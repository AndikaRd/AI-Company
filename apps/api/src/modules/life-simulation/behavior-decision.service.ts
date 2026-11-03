import { Injectable, Logger } from '@nestjs/common';
import { EmployeeNeedsData, LifeBehaviorState } from '@vac/shared';
import { OfficeFacilitiesService } from './office-facilities.service';
import { PrismaService } from '../prisma/prisma.service';

export interface DecisionContext {
  employeeId: string;
  employeeCode?: string;
  role?: string;
  needs: EmployeeNeedsData;
  currentBehavior: LifeBehaviorState;
  currentLocationId: string;
  activeTaskId?: string | null;
  taskPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  behaviorStartedAt: Date;
  behaviorExpectedEndAt?: Date | null;
}

export interface DecisionResult {
  shouldTransition: boolean;
  nextBehavior: LifeBehaviorState;
  destinationLocationId?: string;
  destinationLocationName?: string;
  expectedDurationSeconds: number;
  thought: string;
  details: string;
  replenishTarget?: 'thirst' | 'hunger' | 'energy' | 'focus' | 'social';
  replenishAmount?: number;
}

@Injectable()
export class BehaviorDecisionService {
  private readonly logger = new Logger(BehaviorDecisionService.name);

  // Configurable Need Thresholds (0-100 scale: HIGHER = HEALTHIER)
  private readonly CRITICAL_EMERGENCY_THRESHOLD = 12.0; // Needs below this cause emergency breaks even during tasks
  private readonly BREAK_TRIGGER_THRESHOLD = 25.0; // Needs below this trigger breaks if task is not high/critical
  private readonly HIGH_TASK_TOLERANCE_THRESHOLD = 18.0; // Break threshold during HIGH priority tasks

  constructor(
    private readonly facilities: OfficeFacilitiesService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Evaluates the employee's current state, needs, active task priority, and location
   * to determine the next behavior transition according to company policies and physical constraints.
   */
  evaluateBehavior(ctx: DecisionContext, now: Date = new Date()): DecisionResult {
    const {
      needs,
      currentBehavior,
      currentLocationId,
      activeTaskId,
      taskPriority,
      behaviorStartedAt,
      behaviorExpectedEndAt,
    } = ctx;

    const workstation = this.facilities.getWorkstationForEmployee(ctx.employeeCode || ctx.role || '');
    const isAtWorkstation = currentLocationId === workstation.id || currentLocationId === 'workstation';

    // 1. Check if an in-progress temporary action (WALKING, DRINKING, EATING, RESTING, SOCIALIZING) has finished its duration
    if (behaviorExpectedEndAt && now.getTime() >= behaviorExpectedEndAt.getTime()) {
      return this.handleActionCompletion(ctx, workstation, now);
    }

    // 2. If employee is currently walking or actively consuming, let them finish unless there's a catastrophic condition
    if (
      currentBehavior === 'WALKING' ||
      currentBehavior === 'RETURNING_TO_DESK' ||
      currentBehavior === 'DRINKING' ||
      currentBehavior === 'EATING' ||
      currentBehavior === 'RESTING' ||
      currentBehavior === 'SOCIALIZING'
    ) {
      return {
        shouldTransition: false,
        nextBehavior: currentBehavior,
        expectedDurationSeconds: 0,
        thought: 'Continuing current activity...',
        details: `Active in ${currentBehavior}`,
      };
    }

    // 3. Employee is at workstation (or idle) - evaluate whether needs dictate taking a break vs working
    return this.evaluateBreakOrWork(ctx, workstation);
  }

  /**
   * Handles what happens when an action's duration expires
   */
  private handleActionCompletion(
    ctx: DecisionContext,
    workstation: any,
    now: Date,
  ): DecisionResult {
    const { currentBehavior, currentLocationId, activeTaskId } = ctx;

    // A) If finished WALKING to a facility, transition to the corresponding activity
    if (currentBehavior === 'WALKING') {
      if (currentLocationId === 'water_dispenser') {
        return {
          shouldTransition: true,
          nextBehavior: 'DRINKING',
          expectedDurationSeconds: 40,
          thought: 'Pouring a glass of chilled mineral water.',
          details: 'Hydrating at the water dispenser',
          replenishTarget: 'thirst',
          replenishAmount: 55.0,
        };
      }

      if (currentLocationId === 'pantry') {
        return {
          shouldTransition: true,
          nextBehavior: 'EATING',
          expectedDurationSeconds: 50,
          thought: 'Enjoying a healthy artisanal snack and fresh fruit in the pantry.',
          details: 'Eating lunch/snack in the pantry',
          replenishTarget: 'hunger',
          replenishAmount: 60.0,
        };
      }

      if (currentLocationId === 'lounge') {
        return {
          shouldTransition: true,
          nextBehavior: 'RESTING',
          expectedDurationSeconds: 60,
          thought: 'Taking a quiet rest on the lounge sofa to restore energy and mental focus.',
          details: 'Resting on the lounge sofa',
          replenishTarget: 'energy',
          replenishAmount: 45.0,
        };
      }

      if (currentLocationId === 'atrium') {
        return {
          shouldTransition: true,
          nextBehavior: 'SOCIALIZING',
          expectedDurationSeconds: 45,
          thought: 'Chatting with colleagues by the central atrium ficus tree.',
          details: 'Informal social interaction at the atrium',
          replenishTarget: 'social',
          replenishAmount: 50.0,
        };
      }
    }

    // B) If finished break action (DRINKING, EATING, RESTING, SOCIALIZING), transition to RETURNING_TO_DESK
    if (
      currentBehavior === 'DRINKING' ||
      currentBehavior === 'EATING' ||
      currentBehavior === 'RESTING' ||
      currentBehavior === 'SOCIALIZING'
    ) {
      return {
        shouldTransition: true,
        nextBehavior: 'RETURNING_TO_DESK',
        destinationLocationId: workstation.id,
        destinationLocationName: workstation.name,
        expectedDurationSeconds: 15,
        thought: 'Feeling refreshed. Heading back to my workstation to continue company directives.',
        details: 'Walking back to workstation',
      };
    }

    // C) If finished RETURNING_TO_DESK, transition back to WORKING (if task exists) or IDLE
    if (currentBehavior === 'RETURNING_TO_DESK') {
      const nextBeh: LifeBehaviorState = activeTaskId ? 'WORKING' : 'IDLE';
      return {
        shouldTransition: true,
        nextBehavior: nextBeh,
        destinationLocationId: workstation.id,
        destinationLocationName: workstation.name,
        expectedDurationSeconds: 0,
        thought: activeTaskId
          ? 'Back at my desk. Resuming assigned task with high focus.'
          : 'Ready at workstation for next executive assignment.',
        details: activeTaskId ? 'Resumed active work' : 'Ready at workstation',
      };
    }

    // Default: remain unchanged
    return {
      shouldTransition: false,
      nextBehavior: currentBehavior,
      expectedDurationSeconds: 0,
      thought: 'At workstation.',
      details: 'Routine operations',
    };
  }

  /**
   * Evaluates if needs trigger a break, taking into account task priorities and company policies
   */
  private evaluateBreakOrWork(ctx: DecisionContext, workstation: any): DecisionResult {
    const { needs, activeTaskId, taskPriority, currentBehavior } = ctx;

    // Check emergency thresholds (< 12)
    const isCriticalThirst = needs.thirst < this.CRITICAL_EMERGENCY_THRESHOLD;
    const isCriticalHunger = needs.hunger < this.CRITICAL_EMERGENCY_THRESHOLD;
    const isCriticalEnergy = needs.energy < 10.0;

    // Company Policy: CRITICAL tasks block ordinary breaks, unless an emergency condition is met
    if (taskPriority === 'CRITICAL' && !isCriticalThirst && !isCriticalHunger && !isCriticalEnergy) {
      return {
        shouldTransition: currentBehavior !== 'WORKING',
        nextBehavior: 'WORKING',
        destinationLocationId: workstation.id,
        destinationLocationName: workstation.name,
        expectedDurationSeconds: 0,
        thought: 'Critical enterprise priority active. Postponing breaks until milestone deliverable is verified.',
        details: 'Executing Critical Priority Task',
      };
    }

    // Company Policy: HIGH tasks only allow breaks if a need is below HIGH_TASK_TOLERANCE_THRESHOLD (< 18)
    const breakThreshold =
      taskPriority === 'HIGH'
        ? this.HIGH_TASK_TOLERANCE_THRESHOLD
        : this.BREAK_TRIGGER_THRESHOLD;

    // Evaluate needs hierarchy: Thirst (1) > Hunger (2) > Energy (3) > Focus (4) > Social (5)
    if (needs.thirst < breakThreshold) {
      return {
        shouldTransition: true,
        nextBehavior: 'WALKING',
        destinationLocationId: 'water_dispenser',
        destinationLocationName: 'Pure Spring Water Dispenser',
        expectedDurationSeconds: 15,
        thought: 'Feeling thirsty. Heading to the water dispenser for a quick hydration break.',
        details: 'Walking to water dispenser',
      };
    }

    if (needs.hunger < breakThreshold) {
      return {
        shouldTransition: true,
        nextBehavior: 'WALKING',
        destinationLocationId: 'pantry',
        destinationLocationName: 'Cafeteria & Artisan Pantry',
        expectedDurationSeconds: 18,
        thought: 'Nutritional energy is low. Heading to the pantry for a healthy snack.',
        details: 'Walking to pantry',
      };
    }

    if (needs.energy < breakThreshold || needs.focus < breakThreshold) {
      return {
        shouldTransition: true,
        nextBehavior: 'WALKING',
        destinationLocationId: 'lounge',
        destinationLocationName: 'Executive Rest & Break Lounge',
        expectedDurationSeconds: 20,
        thought: 'Experiencing cognitive fatigue. Taking a short break in the lounge.',
        details: 'Walking to lounge',
      };
    }

    if (needs.social < breakThreshold && !activeTaskId) {
      return {
        shouldTransition: true,
        nextBehavior: 'WALKING',
        destinationLocationId: 'atrium',
        destinationLocationName: 'Central Plaza & Atrium',
        expectedDurationSeconds: 15,
        thought: 'Time for a brief casual catch-up with team members at the atrium.',
        details: 'Walking to atrium',
      };
    }

    // If all needs are healthy and satisfied:
    const targetBehavior: LifeBehaviorState = activeTaskId ? 'WORKING' : 'IDLE';
    if (currentBehavior !== targetBehavior) {
      return {
        shouldTransition: true,
        nextBehavior: targetBehavior,
        destinationLocationId: workstation.id,
        destinationLocationName: workstation.name,
        expectedDurationSeconds: 0,
        thought: activeTaskId
          ? 'Needs are well-balanced. Deeply engaged in task execution.'
          : 'All conditions optimal. Ready at workstation.',
        details: activeTaskId ? 'Working on assigned task' : 'Idle at workstation',
      };
    }

    return {
      shouldTransition: false,
      nextBehavior: currentBehavior,
      expectedDurationSeconds: 0,
      thought: activeTaskId ? 'Deep in productive focus.' : 'At workstation.',
      details: 'Conditions normal',
    };
  }

  /**
   * Validates that state transitions do not violate concurrency invariants
   * (e.g. employee cannot eat and work simultaneously)
   */
  isValidTransition(from: LifeBehaviorState, to: LifeBehaviorState): boolean {
    if (from === to) return true;

    // Disallowed simultaneous / impossible jumps:
    // e.g. Cannot jump straight from EATING to DRINKING without walking/standing up
    if (from === 'EATING' && to === 'DRINKING') return false;
    if (from === 'DRINKING' && to === 'EATING') return false;
    if (from === 'RESTING' && to === 'WORKING') return false; // Must return to desk first

    return true;
  }
}

