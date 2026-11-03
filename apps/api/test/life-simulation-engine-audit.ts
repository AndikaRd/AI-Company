import { PrismaClient } from '@prisma/client';
import { OfficeFacilitiesService } from '../src/modules/life-simulation/office-facilities.service';
import { EmployeeNeedsService } from '../src/modules/life-simulation/employee-needs.service';
import { BehaviorDecisionService } from '../src/modules/life-simulation/behavior-decision.service';
import { LifeSimulationService } from '../src/modules/life-simulation/life-simulation.service';
import { SocketEvents } from '@vac/shared';

async function runLifeSimulationAudit() {
  console.log('\n================================================================');
  console.log('   SPRINT 7: EMPLOYEE LIFE SIMULATION ENGINE - VALIDATION AUDIT  ');
  console.log('================================================================\n');

  const prisma = new PrismaClient();
  const broadcastEvents: Array<{ event: string; payload: any }> = [];

  const mockEventsGateway: any = {
    server: {},
    broadcastOfficeEvent: (event: string, payload: any) => {
      broadcastEvents.push({ event, payload });
    },
    broadcastAgentStatus: () => {},
  };

  const mockActivityService: any = {
    setActivity: async () => ({}),
    getActivity: () => null,
    getAllActivities: () => ({}),
  };

  const facilitiesService = new OfficeFacilitiesService();
  const needsService = new EmployeeNeedsService(prisma as any);
  const decisionService = new BehaviorDecisionService(facilitiesService, prisma as any);
  const simulationService = new LifeSimulationService(
    prisma as any,
    needsService,
    decisionService,
    facilitiesService,
    mockEventsGateway,
    mockActivityService,
  );

  let passedTests = 0;
  const totalTests = 12;

  try {
    await simulationService.initializeSimulation();

    // -------------------------------------------------------------------------
    // TEST 1: Needs Change Over Elapsed Time
    // -------------------------------------------------------------------------
    console.log('[TEST 1/12] Deterministic Needs Decay Over Elapsed Time...');
    const alex = await prisma.employee.findFirst({
      where: { employeeCode: 'VAC-ENG-001' },
    });
    if (!alex) throw new Error('Alex Mercer not found');

    needsService.setNeeds(alex.id, {
      energy: 100.0,
      hunger: 100.0,
      thirst: 100.0,
      focus: 100.0,
      social: 100.0,
      mood: 100.0,
    });

    const decayed = needsService.decayNeeds(alex.id, 25, 'WORKING');
    if (
      decayed &&
      decayed.thirst < 100.0 &&
      decayed.hunger < 100.0 &&
      decayed.energy < 100.0 &&
      decayed.focus < 100.0 &&
      decayed.mood < 100.0
    ) {
      console.log(`  ✓ Decayed 25 mins working: Thirst=${decayed.thirst}, Hunger=${decayed.hunger}, Energy=${decayed.energy}, Mood=${decayed.mood}`);
      passedTests++;
    } else {
      throw new Error('Test 1 failed: Needs did not decay properly');
    }

    // -------------------------------------------------------------------------
    // TEST 2: Needs Persist in PostgreSQL
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2/12] Needs Persistence to PostgreSQL...');
    const marcus = await prisma.employee.findFirst({
      where: { employeeCode: 'VAC-TECH-001' },
    });
    if (!marcus) throw new Error('Marcus Vance not found');

    needsService.setNeeds(marcus.id, {
      energy: 84.0,
      hunger: 72.0,
      thirst: 60.0,
    });
    await needsService.flushDirtyNeeds();

    const dbRecord = await (prisma as any).employeeNeeds.findUnique({
      where: { employeeId: marcus.id },
    });
    if (dbRecord && dbRecord.energy === 84.0 && dbRecord.thirst === 60.0) {
      console.log(`  ✓ Verified DB record in PostgreSQL: energy=${dbRecord.energy}, thirst=${dbRecord.thirst}`);
      passedTests++;
    } else {
      throw new Error('Test 2 failed: PostgreSQL persistence verification failed');
    }

    // -------------------------------------------------------------------------
    // TEST 3: Simulation Recovers After Backend Restart
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3/12] Simulation Recovery After Restart...');
    const elena = await prisma.employee.findFirst({
      where: { employeeCode: 'VAC-OPS-001' },
    });
    if (!elena) throw new Error('Elena Rostova not found');

    needsService.setNeeds(elena.id, { thirst: 52.0, hunger: 58.0 });
    await needsService.flushDirtyNeeds();

    const freshNeedsService = new EmployeeNeedsService(prisma as any);
    await freshNeedsService.initialize();
    const recovered = freshNeedsService.getNeeds(elena.id);

    if (recovered && recovered.thirst === 52.0 && recovered.hunger === 58.0) {
      console.log(`  ✓ Fresh service recovered state from DB: thirst=${recovered.thirst}, hunger=${recovered.hunger}`);
      passedTests++;
    } else {
      throw new Error('Test 3 failed: Recovery from DB failed');
    }

    // -------------------------------------------------------------------------
    // TEST 4: High Thirst Triggers Drinking Decision
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4/12] High Thirst Triggers Drinking Decision...');
    const thirstContext = {
      employeeId: alex.id,
      employeeCode: 'VAC-ENG-001',
      needs: {
        employeeId: alex.id,
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

    const thirstDecision = decisionService.evaluateBehavior(thirstContext);
    if (
      thirstDecision.shouldTransition &&
      thirstDecision.nextBehavior === 'WALKING' &&
      thirstDecision.destinationLocationId === 'water_dispenser'
    ) {
      console.log(`  ✓ Decision Engine triggered WALKING -> water_dispenser: "${thirstDecision.thought}"`);
      passedTests++;
    } else {
      throw new Error(`Test 4 failed: Unexpected decision: ${JSON.stringify(thirstDecision)}`);
    }

    // -------------------------------------------------------------------------
    // TEST 5: High Hunger Triggers Eating Decision
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5/12] High Hunger Triggers Eating Decision...');
    const hungerContext = {
      employeeId: alex.id,
      employeeCode: 'VAC-ENG-001',
      needs: {
        employeeId: alex.id,
        energy: 85.0,
        hunger: 19.0, // Low hunger (< 25)
        thirst: 85.0,
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

    const hungerDecision = decisionService.evaluateBehavior(hungerContext);
    if (
      hungerDecision.shouldTransition &&
      hungerDecision.nextBehavior === 'WALKING' &&
      hungerDecision.destinationLocationId === 'pantry'
    ) {
      console.log(`  ✓ Decision Engine triggered WALKING -> pantry: "${hungerDecision.thought}"`);
      passedTests++;
    } else {
      throw new Error(`Test 5 failed: Unexpected decision: ${JSON.stringify(hungerDecision)}`);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Low Energy Triggers Resting Decision
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6/12] Low Energy Triggers Resting Decision...');
    const energyContext = {
      employeeId: alex.id,
      employeeCode: 'VAC-ENG-001',
      needs: {
        employeeId: alex.id,
        energy: 16.0, // Low energy (< 25)
        hunger: 85.0,
        thirst: 85.0,
        focus: 80.0,
        social: 80.0,
        mood: 70.0,
        lastUpdated: new Date().toISOString(),
      },
      currentBehavior: 'IDLE' as any,
      currentLocationId: 'workstation_alex',
      activeTaskId: null,
      taskPriority: null,
      behaviorStartedAt: new Date(),
    };

    const energyDecision = decisionService.evaluateBehavior(energyContext);
    if (
      energyDecision.shouldTransition &&
      energyDecision.nextBehavior === 'WALKING' &&
      energyDecision.destinationLocationId === 'lounge'
    ) {
      console.log(`  ✓ Decision Engine triggered WALKING -> lounge: "${energyDecision.thought}"`);
      passedTests++;
    } else {
      throw new Error(`Test 6 failed: Unexpected decision: ${JSON.stringify(energyDecision)}`);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Critical Tasks Prevent Unnecessary Interruption
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7/12] Critical Task Shield Prevents Break Interruption...');
    const criticalTaskContext = {
      employeeId: alex.id,
      employeeCode: 'VAC-ENG-001',
      needs: {
        employeeId: alex.id,
        energy: 65.0,
        hunger: 70.0,
        thirst: 22.0, // Thirsty (< 25), but above emergency (< 12)
        focus: 60.0,
        social: 70.0,
        mood: 65.0,
        lastUpdated: new Date().toISOString(),
      },
      currentBehavior: 'WORKING' as any,
      currentLocationId: 'workstation_alex',
      activeTaskId: 'task-crit-001',
      taskPriority: 'CRITICAL' as any,
      behaviorStartedAt: new Date(),
    };

    const criticalDecision = decisionService.evaluateBehavior(criticalTaskContext);
    if (!criticalDecision.shouldTransition && criticalDecision.nextBehavior === 'WORKING') {
      console.log(`  ✓ Work preserved during CRITICAL task: "${criticalDecision.thought}"`);
      passedTests++;
    } else {
      throw new Error('Test 7 failed: Critical task was prematurely interrupted');
    }

    // -------------------------------------------------------------------------
    // TEST 8: Conflicting Activities Are Prevented
    // -------------------------------------------------------------------------
    console.log('\n[TEST 8/12] Concurrency Invariant: Conflicting Actions Prevented...');
    const canEatThenDrink = decisionService.isValidTransition('EATING', 'DRINKING');
    const canRestThenWork = decisionService.isValidTransition('RESTING', 'WORKING');
    const canWalkThenDrink = decisionService.isValidTransition('WALKING', 'DRINKING');

    if (!canEatThenDrink && !canRestThenWork && canWalkThenDrink) {
      console.log('  ✓ Invariant verified: Illegal concurrent and direct jumps blocked');
      passedTests++;
    } else {
      throw new Error('Test 8 failed: Invalid transitions allowed');
    }

    // -------------------------------------------------------------------------
    // TEST 9: Employee Returns to Work After Completing Break
    // -------------------------------------------------------------------------
    console.log('\n[TEST 9/12] Return to Work Cycle After Break Completion...');
    const pastTime = new Date(Date.now() - 5000);
    const workstation = facilitiesService.getWorkstationForEmployee('VAC-ENG-001');

    const breakDoneContext = {
      employeeId: alex.id,
      employeeCode: 'VAC-ENG-001',
      needs: {
        employeeId: alex.id,
        energy: 85.0,
        hunger: 85.0,
        thirst: 95.0,
        focus: 85.0,
        social: 85.0,
        mood: 85.0,
        lastUpdated: new Date().toISOString(),
      },
      currentBehavior: 'DRINKING' as any,
      currentLocationId: 'water_dispenser',
      activeTaskId: 'task-active-01',
      taskPriority: 'HIGH' as any,
      behaviorStartedAt: new Date(Date.now() - 50000),
      behaviorExpectedEndAt: pastTime,
    };

    const returnStep = decisionService.evaluateBehavior(breakDoneContext);
    if (returnStep.shouldTransition && returnStep.nextBehavior === 'RETURNING_TO_DESK') {
      console.log(`  ✓ Step 1: DRINKING finished -> RETURNING_TO_DESK [Target: ${returnStep.destinationLocationId}]`);

      const atDeskContext = {
        ...breakDoneContext,
        currentBehavior: 'RETURNING_TO_DESK' as any,
        currentLocationId: workstation.id,
        behaviorExpectedEndAt: pastTime,
      };

      const resumeStep = decisionService.evaluateBehavior(atDeskContext);
      if (resumeStep.shouldTransition && resumeStep.nextBehavior === 'WORKING') {
        console.log(`  ✓ Step 2: Arrived at workstation -> Resumed WORKING`);
        passedTests++;
      } else {
        throw new Error('Test 9 failed at Step 2 (Did not resume work)');
      }
    } else {
      throw new Error('Test 9 failed at Step 1');
    }

    // -------------------------------------------------------------------------
    // TEST 10: Socket.IO Broadcasts Actual State Transitions
    // -------------------------------------------------------------------------
    console.log('\n[TEST 10/12] Socket.IO Broadcast Verification...');
    // Reset Alex to workstation so we test the transition cleanly
    const workstationAlex = facilitiesService.getWorkstationForEmployee('VAC-ENG-001');
    const alexState = simulationService.getLifeState(alex.id);
    if (alexState) {
      alexState.behavior = 'IDLE';
      alexState.currentLocationId = workstationAlex.id;
      alexState.currentLocationName = workstationAlex.name;
      alexState.destinationLocationId = null;
      alexState.behaviorExpectedEndAt = null;
    }

    broadcastEvents.length = 0;
    await simulationService.interveneEmployee(alex.id, 'drink');

    const locationEv = broadcastEvents.find(
      (e) => e.event === SocketEvents.EMPLOYEE_LOCATION_UPDATED && e.payload.employeeId === alex.id,
    );
    const needsEv = broadcastEvents.find(
      (e) => e.event === SocketEvents.EMPLOYEE_NEEDS_UPDATED && e.payload.employeeId === alex.id,
    );
    const breakEv = broadcastEvents.find(
      (e) =>
        (e.event === SocketEvents.EMPLOYEE_STARTED_BREAK ||
          e.event === SocketEvents.EMPLOYEE_STARTED_DRINKING) &&
        e.payload.employeeId === alex.id,
    );

    if (locationEv && needsEv && breakEv) {
      console.log(`  ✓ Emitted real-time Socket.IO events for Alex: ${breakEv.event}, ${locationEv.event}, ${needsEv.event}`);
      passedTests++;
    } else {
      throw new Error(`Test 10 failed: Socket events missing (location: ${Boolean(locationEv)}, needs: ${Boolean(needsEv)}, break: ${Boolean(breakEv)})`);
    }

    // -------------------------------------------------------------------------
    // TEST 11: Multiple Employees Simulate Concurrently
    // -------------------------------------------------------------------------
    console.log('\n[TEST 11/12] Multi-Employee Concurrent Simulation...');
    const allEmps = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
    const transitions = await simulationService.runSimulationTick(15);

    let allHaveNeeds = true;
    for (const emp of allEmps) {
      const n = needsService.getNeeds(emp.id);
      if (!n || n.energy <= 0) allHaveNeeds = false;
    }

    if (allHaveNeeds && typeof transitions === 'number') {
      console.log(`  ✓ Concurrently simulated ${allEmps.length} AI employees (Transitions: ${transitions})`);
      passedTests++;
    } else {
      throw new Error('Test 11 failed: Concurrent simulation failed');
    }

    // -------------------------------------------------------------------------
    // TEST 12: Browser Closure Does Not Stop Backend Simulation
    // -------------------------------------------------------------------------
    console.log('\n[TEST 12/12] Browser-Closure Independence...');
    mockEventsGateway.server = null; // Disconnect all web clients

    const preTickThirst = needsService.getNeeds(marcus.id)!.thirst;
    await simulationService.runSimulationTick(60); // 1 minute elapsed
    const postTickThirst = needsService.getNeeds(marcus.id)!.thirst;

    if (postTickThirst < preTickThirst) {
      console.log(`  ✓ Simulation continued autonomously with 0 clients: ${preTickThirst} -> ${postTickThirst}`);
      passedTests++;
    } else {
      throw new Error('Test 12 failed: Simulation did not run without clients');
    }

    console.log('\n================================================================');
    console.log(`   AUDIT RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (100%)       `);
    console.log('================================================================\n');

    process.exit(0);
  } catch (err: any) {
    console.error(`\n❌ AUDIT FAILED: ${err.message}`);
    process.exit(1);
  } finally {
    simulationService.onModuleDestroy();
    await prisma.$disconnect();
  }
}

runLifeSimulationAudit();
