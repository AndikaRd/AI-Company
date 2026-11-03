import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { EmployeeNeedsService } from '../src/modules/life-simulation/employee-needs.service';
import { BehaviorDecisionService } from '../src/modules/life-simulation/behavior-decision.service';
import { OfficeFacilitiesService } from '../src/modules/life-simulation/office-facilities.service';
import { LifeSimulationService } from '../src/modules/life-simulation/life-simulation.service';
import { EventsGateway } from '../src/modules/events/events.gateway';
import { EmployeeActivityService } from '../src/modules/employees/employee-activity.service';
import { SocketEvents } from '@vac/shared';

describe('Sprint 7: Employee Life Simulation Engine Audit', () => {
  let prisma: PrismaService;
  let needsService: EmployeeNeedsService;
  let decisionService: BehaviorDecisionService;
  let facilitiesService: OfficeFacilitiesService;
  let simulationService: LifeSimulationService;
  let mockEventsGateway: any;
  let mockActivityService: any;

  const broadcastEvents: Array<{ event: string; payload: any }> = [];

  beforeAll(async () => {
    mockEventsGateway = {
      broadcastOfficeEvent: (event: string, payload: any) => {
        broadcastEvents.push({ event, payload });
      },
      broadcastAgentStatus: jest.fn(),
    };

    mockActivityService = {
      setActivity: jest.fn().mockResolvedValue({}),
      getActivity: jest.fn().mockReturnValue(null),
      getAllActivities: jest.fn().mockReturnValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        OfficeFacilitiesService,
        EmployeeNeedsService,
        BehaviorDecisionService,
        LifeSimulationService,
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: EmployeeActivityService, useValue: mockActivityService },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    needsService = module.get<EmployeeNeedsService>(EmployeeNeedsService);
    decisionService = module.get<BehaviorDecisionService>(BehaviorDecisionService);
    facilitiesService = module.get<OfficeFacilitiesService>(OfficeFacilitiesService);
    simulationService = module.get<LifeSimulationService>(LifeSimulationService);

    // Initialize simulation
    await simulationService.initializeSimulation();
  });

  afterAll(async () => {
    simulationService.onModuleDestroy();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    broadcastEvents.length = 0;
  });

  // ---------------------------------------------------------------------------
  // 1. Employee Needs Change Over Elapsed Time
  // ---------------------------------------------------------------------------
  it('1. should deterministically decay needs over elapsed time', async () => {
    const alex = await prisma.employee.findFirst({
      where: { role: { contains: 'Software Engineer' } },
    });
    expect(alex).toBeDefined();

    // Reset Alex to optimal baseline (100.0)
    needsService.setNeeds(alex!.id, {
      energy: 100.0,
      hunger: 100.0,
      thirst: 100.0,
      focus: 100.0,
      social: 100.0,
      mood: 100.0,
    });

    // Simulate 30 minutes of working activity
    const decayed = needsService.decayNeeds(alex!.id, 30, 'WORKING');
    expect(decayed).toBeDefined();

    // Thirst decays ~1.0/min, hunger ~0.7/min, energy ~0.5/min, focus ~0.8/min
    expect(decayed!.thirst).toBeLessThan(100.0);
    expect(decayed!.hunger).toBeLessThan(100.0);
    expect(decayed!.energy).toBeLessThan(100.0);
    expect(decayed!.focus).toBeLessThan(100.0);
    expect(decayed!.mood).toBeLessThan(100.0);
    expect(decayed!.thirst).toBeCloseTo(70.0, 0);
  });

  // ---------------------------------------------------------------------------
  // 2. Needs Persist in PostgreSQL
  // ---------------------------------------------------------------------------
  it('2. should persist needs to PostgreSQL and recover them', async () => {
    const marcus = await prisma.employee.findFirst({
      where: { role: { contains: 'CTO' } },
    });
    expect(marcus).toBeDefined();

    needsService.setNeeds(marcus!.id, {
      energy: 82.5,
      hunger: 77.0,
      thirst: 65.0,
      focus: 90.0,
      social: 88.0,
    });

    const flushed = await needsService.flushDirtyNeeds();
    expect(flushed).toBeGreaterThan(0);

    const dbRecord = await prisma.employeeNeeds.findUnique({
      where: { employeeId: marcus!.id },
    });
    expect(dbRecord).toBeDefined();
    expect(dbRecord!.energy).toBe(82.5);
    expect(dbRecord!.thirst).toBe(65.0);
  });

  // ---------------------------------------------------------------------------
  // 3. Simulation Recovers After Backend Restart
  // ---------------------------------------------------------------------------
  it('3. should recover state correctly after backend restart without data loss', async () => {
    const elena = await prisma.employee.findFirst({
      where: { role: { contains: 'COO' } },
    });
    expect(elena).toBeDefined();

    // Seed state
    needsService.setNeeds(elena!.id, { thirst: 55.0, hunger: 60.0 });
    await needsService.flushDirtyNeeds();

    // Instantiate a fresh EmployeeNeedsService (simulating restart)
    const freshNeedsService = new EmployeeNeedsService(prisma);
    await freshNeedsService.initialize();

    const recovered = freshNeedsService.getNeeds(elena!.id);
    expect(recovered).toBeDefined();
    expect(recovered!.thirst).toBe(55.0);
    expect(recovered!.hunger).toBe(60.0);
  });

  // ---------------------------------------------------------------------------
  // 4. High Thirst Triggers Drinking Decision
  // ---------------------------------------------------------------------------
  it('4. should trigger a drinking decision when thirst drops below threshold', () => {
    const context = {
      employeeId: 'emp-alex',
      employeeCode: 'VAC-ENG-001',
      needs: {
        employeeId: 'emp-alex',
        energy: 80.0,
        hunger: 80.0,
        thirst: 18.0, // Low thirst (< 25)
        focus: 80.0,
        social: 80.0,
        mood: 75.0,
        lastUpdated: new Date().toISOString(),
      },
      currentBehavior: 'IDLE' as any,
      currentLocationId: 'workstation_alex',
      activeTaskId: null,
      taskPriority: null,
      behaviorStartedAt: new Date(),
    };

    const decision = decisionService.evaluateBehavior(context);
    expect(decision.shouldTransition).toBe(true);
    expect(decision.nextBehavior).toBe('WALKING');
    expect(decision.destinationLocationId).toBe('water_dispenser');
    expect(decision.thought).toContain('thirsty');
  });

  // ---------------------------------------------------------------------------
  // 5. High Hunger Triggers Eating Decision
  // ---------------------------------------------------------------------------
  it('5. should trigger an eating decision when hunger drops below threshold', () => {
    const context = {
      employeeId: 'emp-sophia',
      employeeCode: 'VAC-QA-001',
      needs: {
        employeeId: 'emp-sophia',
        energy: 85.0,
        hunger: 19.0, // Low hunger (< 25)
        thirst: 85.0,
        focus: 80.0,
        social: 80.0,
        mood: 75.0,
        lastUpdated: new Date().toISOString(),
      },
      currentBehavior: 'IDLE' as any,
      currentLocationId: 'workstation_sophia',
      activeTaskId: null,
      taskPriority: null,
      behaviorStartedAt: new Date(),
    };

    const decision = decisionService.evaluateBehavior(context);
    expect(decision.shouldTransition).toBe(true);
    expect(decision.nextBehavior).toBe('WALKING');
    expect(decision.destinationLocationId).toBe('pantry');
    expect(decision.thought).toContain('pantry');
  });

  // ---------------------------------------------------------------------------
  // 6. Low Energy Triggers Resting Decision
  // ---------------------------------------------------------------------------
  it('6. should trigger a resting decision when energy drops below threshold', () => {
    const context = {
      employeeId: 'emp-maya',
      employeeCode: 'VAC-RES-001',
      needs: {
        employeeId: 'emp-maya',
        energy: 16.0, // Low energy (< 25)
        hunger: 85.0,
        thirst: 85.0,
        focus: 80.0,
        social: 80.0,
        mood: 70.0,
        lastUpdated: new Date().toISOString(),
      },
      currentBehavior: 'IDLE' as any,
      currentLocationId: 'workstation_maya',
      activeTaskId: null,
      taskPriority: null,
      behaviorStartedAt: new Date(),
    };

    const decision = decisionService.evaluateBehavior(context);
    expect(decision.shouldTransition).toBe(true);
    expect(decision.nextBehavior).toBe('WALKING');
    expect(decision.destinationLocationId).toBe('lounge');
    expect(decision.thought).toContain('lounge');
  });

  // ---------------------------------------------------------------------------
  // 7. Critical Tasks Prevent Unnecessary Interruption
  // ---------------------------------------------------------------------------
  it('7. should NOT interrupt work for non-emergency thirst during CRITICAL tasks', () => {
    const context = {
      employeeId: 'emp-alex',
      employeeCode: 'VAC-ENG-001',
      needs: {
        employeeId: 'emp-alex',
        energy: 65.0,
        hunger: 70.0,
        thirst: 22.0, // Thirsty (< 25), but above critical emergency (< 12)
        focus: 60.0,
        social: 70.0,
        mood: 65.0,
        lastUpdated: new Date().toISOString(),
      },
      currentBehavior: 'WORKING' as any,
      currentLocationId: 'workstation_alex',
      activeTaskId: 'critical-task-123',
      taskPriority: 'CRITICAL' as any,
      behaviorStartedAt: new Date(),
    };

    const decision = decisionService.evaluateBehavior(context);
    expect(decision.shouldTransition).toBe(false);
    expect(decision.nextBehavior).toBe('WORKING');
    expect(decision.thought).toContain('Critical enterprise priority');
  });

  // ---------------------------------------------------------------------------
  // 8. Conflicting Activities Are Prevented
  // ---------------------------------------------------------------------------
  it('8. should reject invalid simultaneous transitions', () => {
    // Cannot transition directly from EATING to DRINKING without walking/standing up
    expect(decisionService.isValidTransition('EATING', 'DRINKING')).toBe(false);
    expect(decisionService.isValidTransition('DRINKING', 'EATING')).toBe(false);
    expect(decisionService.isValidTransition('RESTING', 'WORKING')).toBe(false);

    // Valid transitions
    expect(decisionService.isValidTransition('WORKING', 'WALKING')).toBe(true);
    expect(decisionService.isValidTransition('WALKING', 'DRINKING')).toBe(true);
    expect(decisionService.isValidTransition('DRINKING', 'RETURNING_TO_DESK')).toBe(true);
    expect(decisionService.isValidTransition('RETURNING_TO_DESK', 'WORKING')).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 9. Employee Returns to Work After Completing Break
  // ---------------------------------------------------------------------------
  it('9. should transition to RETURNING_TO_DESK and resume work when break completes', () => {
    const pastTime = new Date(Date.now() - 5000);
    const workstation = facilitiesService.getWorkstationForEmployee('VAC-ENG-001');

    // Action completion of DRINKING
    const contextDrinkingFinished = {
      employeeId: 'emp-alex',
      employeeCode: 'VAC-ENG-001',
      needs: {
        employeeId: 'emp-alex',
        energy: 85.0,
        hunger: 85.0,
        thirst: 90.0,
        focus: 85.0,
        social: 85.0,
        mood: 85.0,
        lastUpdated: new Date().toISOString(),
      },
      currentBehavior: 'DRINKING' as any,
      currentLocationId: 'water_dispenser',
      activeTaskId: 'task-auth-001',
      taskPriority: 'HIGH' as any,
      behaviorStartedAt: new Date(Date.now() - 50000),
      behaviorExpectedEndAt: pastTime, // Elapsed!
    };

    const step1 = decisionService.evaluateBehavior(contextDrinkingFinished);
    expect(step1.shouldTransition).toBe(true);
    expect(step1.nextBehavior).toBe('RETURNING_TO_DESK');
    expect(step1.destinationLocationId).toBe(workstation.id);

    // Action completion of RETURNING_TO_DESK
    const contextReturnFinished = {
      ...contextDrinkingFinished,
      currentBehavior: 'RETURNING_TO_DESK' as any,
      currentLocationId: workstation.id,
      behaviorExpectedEndAt: pastTime,
    };

    const step2 = decisionService.evaluateBehavior(contextReturnFinished);
    expect(step2.shouldTransition).toBe(true);
    expect(step2.nextBehavior).toBe('WORKING');
    expect(step2.thought).toContain('Resuming assigned task');
  });

  // ---------------------------------------------------------------------------
  // 10. Socket.IO Broadcasts Actual State Transitions
  // ---------------------------------------------------------------------------
  it('10. should broadcast actual Socket.IO events on state transitions', async () => {
    const alex = await prisma.employee.findFirst({
      where: { role: { contains: 'Software Engineer' } },
    });
    expect(alex).toBeDefined();

    // Trigger thirst intervention
    await simulationService.interveneEmployee(alex!.id, 'drink');

    // Verify events were dispatched
    const locationEvent = broadcastEvents.find(
      (e) => e.event === SocketEvents.EMPLOYEE_LOCATION_UPDATED,
    );
    const needsEvent = broadcastEvents.find(
      (e) => e.event === SocketEvents.EMPLOYEE_NEEDS_UPDATED,
    );

    expect(locationEvent).toBeDefined();
    expect(needsEvent).toBeDefined();
    expect(needsEvent!.payload.employeeId).toBe(alex!.id);
  });

  // ---------------------------------------------------------------------------
  // 11. Multiple Employees Simulate Concurrently
  // ---------------------------------------------------------------------------
  it('11. should simulate multiple employees concurrently without cross-contamination', async () => {
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      take: 5,
    });
    expect(employees.length).toBeGreaterThanOrEqual(2);

    // Run a tick of 10 seconds across all employees
    const transitions = await simulationService.runSimulationTick(10);
    expect(typeof transitions).toBe('number');

    // All employees must have valid independent needs states
    for (const emp of employees) {
      const needs = needsService.getNeeds(emp.id);
      expect(needs).toBeDefined();
      expect(needs!.employeeId).toBe(emp.id);
      expect(needs!.energy).toBeGreaterThan(0);
      expect(needs!.thirst).toBeGreaterThan(0);
    }
  });

  // ---------------------------------------------------------------------------
  // 12. Browser Closure Does Not Stop Backend Simulation
  // ---------------------------------------------------------------------------
  it('12. should continue simulation on the server independently of client connections', async () => {
    // Simulate zero connected clients
    mockEventsGateway.server = null;

    const marcus = await prisma.employee.findFirst({
      where: { role: { contains: 'CTO' } },
    });
    expect(marcus).toBeDefined();

    const initialThirst = needsService.getNeeds(marcus!.id)!.thirst;

    // Run tick on backend
    await simulationService.runSimulationTick(60); // 1 minute elapsed

    const updatedThirst = needsService.getNeeds(marcus!.id)!.thirst;
    expect(updatedThirst).toBeLessThan(initialThirst);
  });
});

