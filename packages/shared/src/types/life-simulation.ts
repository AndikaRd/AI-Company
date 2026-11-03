/**
 * Sprint 7: Employee Life Simulation Engine Types
 *
 * UNIFORM SEMANTIC MODEL:
 * All need metrics are on a 0 - 100 scale where HIGHER = HEALTHIER / BETTER.
 * - 100: Optimal / Fully Satisfied
 * - 50: Moderate / Adequate
 * - < 25: Need Threshold Triggered (Urgent Need)
 * - < 15: Critical Distress / Emergency Interrupt
 */

export interface EmployeeNeedsData {
  id?: string;
  employeeId: string;
  energy: number;   // 100 = fully rested, 0 = exhausted
  hunger: number;   // 100 = fully satiated, 0 = starving
  thirst: number;   // 100 = fully hydrated, 0 = parched
  focus: number;    // 100 = laser-focused, 0 = scattered / burned out
  social: number;   // 100 = socially fulfilled, 0 = isolated / lonely
  mood: number;     // 100 = ecstatic / inspired, 0 = demoralized / depressed
  lastUpdated: string;
}

export type LifeBehaviorState =
  | 'WORKING'
  | 'DRINKING'
  | 'EATING'
  | 'RESTING'
  | 'SOCIALIZING'
  | 'WALKING'
  | 'RETURNING_TO_DESK'
  | 'ATTENDING_MEETING'
  | 'IDLE';

export interface EmployeeLifeStateData {
  id?: string;
  employeeId: string;
  behavior: LifeBehaviorState;
  currentLocationId: string;
  currentLocationName: string;
  destinationLocationId?: string | null;
  activeTaskId?: string | null;
  currentThought?: string | null;
  behaviorStartedAt: string;
  behaviorExpectedEndAt?: string | null;
  interruptedBehavior?: LifeBehaviorState | null;
  lastSimulationUpdate: string;
}

export interface EmployeeLifeEventData {
  id?: string;
  employeeId: string;
  eventType: string;
  behavior: LifeBehaviorState;
  locationId?: string | null;
  locationName?: string | null;
  details?: string | null;
  thought?: string | null;
  needsSnapshot?: Partial<EmployeeNeedsData> | null;
  createdAt: string;
}

export interface OfficeFacilityLocation {
  id: string;
  name: string;
  category: 'workstation' | 'pantry' | 'water_dispenser' | 'lounge' | 'meeting_room' | 'atrium';
  departmentSlug?: string;
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  capacity: number;
}

export interface SimulationTickResult {
  simulatedElapsedSeconds: number;
  employeesSimulated: number;
  stateTransitionsCount: number;
  eventsEmittedCount: number;
  timestamp: string;
}

