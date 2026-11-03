import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeeNeedsService } from './employee-needs.service';
import { BehaviorDecisionService, DecisionContext } from './behavior-decision.service';
import { OfficeFacilitiesService } from './office-facilities.service';
import { EventsGateway } from '../events/events.gateway';
import { EmployeeActivityService } from '../employees/employee-activity.service';
import {
  EmployeeLifeStateData,
  LifeBehaviorState,
  SocketEvents,
  EmployeeActivityState,
  mapActivityToAnimation,
} from '@vac/shared';

@Injectable()
export class LifeSimulationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LifeSimulationService.name);

  // In-memory life states per employee
  private readonly lifeStates: Map<string, EmployeeLifeStateData> = new Map();

  // Background ticker handle
  private timer: NodeJS.Timeout | null = null;
  private isTicking = false;
  private lastSimulationTime: Date = new Date();

  // Max catch-up seconds if server was stopped (e.g. 10 minutes max catch-up)
  private readonly MAX_CATCHUP_SECONDS = 600;

  constructor(
    private readonly prisma: PrismaService,
    private readonly needsService: EmployeeNeedsService,
    private readonly decisionService: BehaviorDecisionService,
    private readonly facilities: OfficeFacilitiesService,
    @Inject(forwardRef(() => EventsGateway))
    private readonly eventsGateway: EventsGateway,
    @Inject(forwardRef(() => EmployeeActivityService))
    private readonly activityService: EmployeeActivityService,
  ) {}

  async onModuleInit() {
    await this.initializeSimulation();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Initializes employee life states from database and starts background simulation loop
   */
  async initializeSimulation(): Promise<void> {
    try {
      // 1. Initialize needs subsystem
      await this.needsService.initialize();

      // 2. Load active employees and their stored life states
      const employees = await this.prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        include: {
          lifeState: true,
          tasks: {
            where: { status: 'IN_PROGRESS' },
            orderBy: { priority: 'desc' },
            take: 1,
          },
        },
      });

      const now = new Date();

      for (const emp of employees) {
        const workstation = this.facilities.getWorkstationForEmployee(emp.employeeCode || emp.role || '');
        const activeTask = emp.tasks[0] || null;

        if (emp.lifeState) {
          // Recover existing life state from database
          this.lifeStates.set(emp.id, {
            id: emp.lifeState.id,
            employeeId: emp.id,
            behavior: emp.lifeState.behavior as LifeBehaviorState,
            currentLocationId: emp.lifeState.currentLocationId,
            currentLocationName: emp.lifeState.currentLocationName,
            destinationLocationId: emp.lifeState.destinationLocationId,
            activeTaskId: activeTask ? activeTask.id : emp.lifeState.activeTaskId,
            currentThought: emp.lifeState.currentThought || 'At workstation.',
            behaviorStartedAt: emp.lifeState.behaviorStartedAt.toISOString(),
            behaviorExpectedEndAt: emp.lifeState.behaviorExpectedEndAt?.toISOString() || null,
            interruptedBehavior: emp.lifeState.interruptedBehavior as LifeBehaviorState || null,
            lastSimulationUpdate: emp.lifeState.lastSimulationUpdate.toISOString(),
          });
        } else {
          // Initialize fresh life state at their primary workstation
          const created = await this.prisma.employeeLifeState.create({
            data: {
              employeeId: emp.id,
              behavior: activeTask ? 'WORKING' : 'IDLE',
              currentLocationId: workstation.id,
              currentLocationName: workstation.name,
              activeTaskId: activeTask ? activeTask.id : null,
              currentThought: activeTask ? 'Beginning active assignment.' : 'Ready at workstation.',
              behaviorStartedAt: now,
              lastSimulationUpdate: now,
            },
          });

          this.lifeStates.set(emp.id, {
            id: created.id,
            employeeId: emp.id,
            behavior: created.behavior as LifeBehaviorState,
            currentLocationId: created.currentLocationId,
            currentLocationName: created.currentLocationName,
            destinationLocationId: null,
            activeTaskId: created.activeTaskId,
            currentThought: created.currentThought,
            behaviorStartedAt: created.behaviorStartedAt.toISOString(),
            behaviorExpectedEndAt: null,
            interruptedBehavior: null,
            lastSimulationUpdate: created.lastSimulationUpdate.toISOString(),
          });
        }
      }

      this.lastSimulationTime = now;
      this.logger.log(`Initialized LifeSimulationService for ${this.lifeStates.size} employees`);

      // 3. Start background ticker (every 5 seconds)
      this.timer = setInterval(() => {
        this.runSimulationTick().catch((err) => {
          this.logger.error(`Unhandled error in life simulation tick: ${err.message}`);
        });
      }, 5000);
    } catch (err: any) {
      this.logger.error(`Failed to initialize life simulation: ${err.message}`);
    }
  }

  /**
   * Main simulation tick. Computes elapsed time since last run, decays needs,
   * evaluates behaviors, executes transitions, and broadcasts events.
   */
  async runSimulationTick(forcedElapsedSeconds?: number, customNow?: Date): Promise<number> {
    if (this.isTicking) return 0;
    this.isTicking = true;

    try {
      const now = customNow || new Date();
      let elapsedSeconds =
        forcedElapsedSeconds !== undefined
          ? forcedElapsedSeconds
          : Math.max(0, (now.getTime() - this.lastSimulationTime.getTime()) / 1000);

      // Clamp max catch-up time
      elapsedSeconds = Math.min(elapsedSeconds, this.MAX_CATCHUP_SECONDS);
      this.lastSimulationTime = now;

      const elapsedMinutes = elapsedSeconds / 60;
      let transitionsCount = 0;

      for (const [employeeId, lifeState] of this.lifeStates.entries()) {
        // 1. Decay needs based on current activity and elapsed time
        const currentNeeds = this.needsService.decayNeeds(
          employeeId,
          elapsedMinutes,
          lifeState.behavior,
        );

        if (!currentNeeds) continue;

        // 2. Fetch employee details and active task for decision context
        const emp = await this.prisma.employee.findUnique({
          where: { id: employeeId },
          include: {
            tasks: {
              where: { status: 'IN_PROGRESS' },
              orderBy: { priority: 'desc' },
              take: 1,
            },
          },
        });

        const activeTask = emp?.tasks[0] || null;

        // 3. Evaluate next behavior decision
        const ctx: DecisionContext = {
          employeeId,
          employeeCode: emp?.employeeCode || undefined,
          role: emp?.role,
          needs: currentNeeds,
          currentBehavior: lifeState.behavior,
          currentLocationId: lifeState.currentLocationId,
          activeTaskId: activeTask ? activeTask.id : null,
          taskPriority: activeTask ? (activeTask.priority as any) : null,
          behaviorStartedAt: new Date(lifeState.behaviorStartedAt),
          behaviorExpectedEndAt: lifeState.behaviorExpectedEndAt
            ? new Date(lifeState.behaviorExpectedEndAt)
            : null,
        };

        const decision = this.decisionService.evaluateBehavior(ctx, now);

        // 4. If decision triggers need replenishment (e.g. drinking water, eating snack)
        if (decision.replenishTarget && decision.replenishAmount) {
          this.needsService.replenishNeed(
            employeeId,
            decision.replenishTarget,
            decision.replenishAmount,
          );
        }

        // 5. Apply State Transition if needed
        if (decision.shouldTransition) {
          await this.executeBehaviorTransition(employeeId, lifeState, decision, now, emp);
          transitionsCount++;
        } else {
          // Update thought if changed
          if (decision.thought && decision.thought !== lifeState.currentThought) {
            lifeState.currentThought = decision.thought;
            this.broadcastNeedsUpdate(employeeId, currentNeeds, lifeState);
          }
        }
      }

      // Periodically flush dirty needs and states to database
      await this.needsService.flushDirtyNeeds();

      return transitionsCount;
    } finally {
      this.isTicking = false;
    }
  }

  /**
   * Executes a state transition, persists to PostgreSQL, and broadcasts real-time events
   */
  private async executeBehaviorTransition(
    employeeId: string,
    currentLifeState: EmployeeLifeStateData,
    decision: any,
    now: Date,
    employeeRecord: any,
  ) {
    const prevBehavior = currentLifeState.behavior;
    const nextBehavior: LifeBehaviorState = decision.nextBehavior;

    // Calculate end time
    const expectedEnd = decision.expectedDurationSeconds > 0
      ? new Date(now.getTime() + decision.expectedDurationSeconds * 1000)
      : null;

    // Update location if target specified
    const nextLocationId = decision.destinationLocationId || currentLifeState.currentLocationId;
    const nextLocationName = decision.destinationLocationName || currentLifeState.currentLocationName;

    // Mutate in-memory state
    currentLifeState.behavior = nextBehavior;
    currentLifeState.currentLocationId = nextLocationId;
    currentLifeState.currentLocationName = nextLocationName;
    currentLifeState.destinationLocationId = decision.destinationLocationId || null;
    currentLifeState.currentThought = decision.thought;
    currentLifeState.behaviorStartedAt = now.toISOString();
    currentLifeState.behaviorExpectedEndAt = expectedEnd ? expectedEnd.toISOString() : null;
    currentLifeState.lastSimulationUpdate = now.toISOString();

    // 1. Persist to PostgreSQL EmployeeLifeState
    try {
      await this.prisma.employeeLifeState.upsert({
        where: { employeeId },
        update: {
          behavior: nextBehavior,
          currentLocationId: nextLocationId,
          currentLocationName: nextLocationName,
          destinationLocationId: currentLifeState.destinationLocationId,
          currentThought: decision.thought,
          behaviorStartedAt: now,
          behaviorExpectedEndAt: expectedEnd,
          lastSimulationUpdate: now,
        },
        create: {
          employeeId,
          behavior: nextBehavior,
          currentLocationId: nextLocationId,
          currentLocationName: nextLocationName,
          currentThought: decision.thought,
          behaviorStartedAt: now,
          behaviorExpectedEndAt: expectedEnd,
          lastSimulationUpdate: now,
        },
      });

      // 2. Persist to EmployeeLifeEvent audit history
      const currentNeeds = this.needsService.getNeeds(employeeId);
      await this.prisma.employeeLifeEvent.create({
        data: {
          employeeId,
          eventType: this.getEventTypeForBehavior(nextBehavior),
          behavior: nextBehavior,
          locationId: nextLocationId,
          locationName: nextLocationName,
          details: decision.details,
          thought: decision.thought,
          needsSnapshot: currentNeeds as any,
          createdAt: now,
        },
      });
    } catch (err: any) {
      this.logger.error(`Error saving life transition for [${employeeId}]: ${err.message}`);
    }

    // 3. Map LifeBehaviorState to Virtual Office Activity & Animation
    const mappedOfficeActivity: EmployeeActivityState = this.mapBehaviorToOfficeActivity(nextBehavior);
    const mappedAnimation = mapActivityToAnimation(mappedOfficeActivity);

    // Sync with existing EmployeeActivityService
    await this.activityService.setActivity(employeeId, mappedOfficeActivity, {
      details: decision.details,
      location: {
        workstationId: nextLocationId,
      },
    });

    // 4. Broadcast specific Sprint 7 Life Simulation events
    const empName = employeeRecord
      ? `${employeeRecord.firstName} ${employeeRecord.lastName}`
      : 'AI Employee';

    const eventPayload = {
      employeeId,
      employeeName: empName,
      prevBehavior,
      behavior: nextBehavior,
      activity: mappedOfficeActivity,
      animationState: mappedAnimation,
      locationId: nextLocationId,
      locationName: nextLocationName,
      thought: decision.thought,
      details: decision.details,
      expectedDurationSeconds: decision.expectedDurationSeconds,
      timestamp: now.toISOString(),
    };

    // Broadcast specific life event
    const specificEvent = this.getEventTypeForBehavior(nextBehavior);
    this.eventsGateway.broadcastOfficeEvent(specificEvent, eventPayload);

    // Broadcast unified location and needs updates
    this.eventsGateway.broadcastOfficeEvent(SocketEvents.EMPLOYEE_LOCATION_UPDATED, {
      employeeId,
      locationId: nextLocationId,
      locationName: nextLocationName,
      timestamp: now.toISOString(),
    });

    this.broadcastNeedsUpdate(employeeId, this.needsService.getNeeds(employeeId), currentLifeState);

    this.logger.log(
      `[LifeSimulation] ${empName} -> ${nextBehavior} at ${nextLocationName} ("${decision.thought}")`,
    );
  }

  private broadcastNeedsUpdate(
    employeeId: string,
    needs: any,
    lifeState: EmployeeLifeStateData,
  ) {
    if (!needs) return;

    this.eventsGateway.broadcastOfficeEvent(SocketEvents.EMPLOYEE_NEEDS_UPDATED, {
      employeeId,
      needs,
      behavior: lifeState.behavior,
      locationId: lifeState.currentLocationId,
      currentThought: lifeState.currentThought,
      timestamp: new Date().toISOString(),
    });
  }

  private getEventTypeForBehavior(behavior: LifeBehaviorState): string {
    switch (behavior) {
      case 'WORKING':
        return SocketEvents.EMPLOYEE_STARTED_WORKING;
      case 'DRINKING':
        return SocketEvents.EMPLOYEE_STARTED_DRINKING;
      case 'EATING':
        return SocketEvents.EMPLOYEE_STARTED_EATING;
      case 'RESTING':
        return SocketEvents.EMPLOYEE_STARTED_RESTING;
      case 'SOCIALIZING':
        return SocketEvents.EMPLOYEE_STARTED_SOCIALIZING;
      case 'WALKING':
        return SocketEvents.EMPLOYEE_STARTED_BREAK;
      case 'RETURNING_TO_DESK':
        return SocketEvents.EMPLOYEE_RESUMED_WORK;
      case 'IDLE':
      default:
        return 'employee:idle';
    }
  }

  private mapBehaviorToOfficeActivity(behavior: LifeBehaviorState): EmployeeActivityState {
    switch (behavior) {
      case 'WORKING':
        return 'WORKING';
      case 'DRINKING':
      case 'EATING':
      case 'RESTING':
        return 'IDLE';
      case 'SOCIALIZING':
        return 'TALKING';
      case 'WALKING':
      case 'RETURNING_TO_DESK':
        return 'WALKING';
      case 'ATTENDING_MEETING':
        return 'MEETING';
      case 'IDLE':
      default:
        return 'IDLE';
    }
  }

  getLifeState(employeeId: string): EmployeeLifeStateData | null {
    return this.lifeStates.get(employeeId) || null;
  }

  getAllLifeStates(): Record<string, EmployeeLifeStateData> {
    const res: Record<string, EmployeeLifeStateData> = {};
    for (const [id, val] of this.lifeStates.entries()) {
      res[id] = { ...val };
    }
    return res;
  }

  /**
   * Manual intervention API for testing & administration
   */
  async interveneEmployee(
    employeeId: string,
    action: 'drink' | 'eat' | 'rest' | 'work' | 'reset',
  ): Promise<EmployeeLifeStateData | null> {
    const current = this.lifeStates.get(employeeId);
    if (!current) return null;

    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    const now = new Date();

    if (action === 'drink') {
      this.needsService.setNeeds(employeeId, { thirst: 15.0 });
    } else if (action === 'eat') {
      this.needsService.setNeeds(employeeId, { hunger: 15.0 });
    } else if (action === 'rest') {
      this.needsService.setNeeds(employeeId, { energy: 15.0 });
    } else if (action === 'work') {
      this.needsService.setNeeds(employeeId, { energy: 95.0, thirst: 95.0, hunger: 95.0 });
    } else if (action === 'reset') {
      this.needsService.setNeeds(employeeId, {
        energy: 100.0,
        hunger: 100.0,
        thirst: 100.0,
        focus: 100.0,
        social: 100.0,
        mood: 100.0,
      });
    }

    // Run tick immediately to apply decision
    await this.runSimulationTick(1, now);

    return this.lifeStates.get(employeeId) || null;
  }
}

