export type EmployeeActivityState =
  | 'IDLE'
  | 'THINKING'
  | 'WALKING'
  | 'WORKING'
  | 'TALKING'
  | 'MEETING'
  | 'WAITING_APPROVAL'
  | 'OFFLINE';

export type CharacterAnimationState =
  | 'idle'
  | 'walking'
  | 'working'
  | 'talking'
  | 'meeting'
  | 'thinking';

export interface EmployeeActivityInfo {
  employeeId: string;
  activity: EmployeeActivityState;
  animationState: CharacterAnimationState;
  currentTaskId?: string | null;
  taskTitle?: string | null;
  workstationId?: string | null;
  departmentSlug?: string | null;
  details?: string | null;
  updatedAt: string;
}

export function mapActivityToAnimation(activity: EmployeeActivityState): CharacterAnimationState {
  switch (activity) {
    case 'WORKING':
      return 'working';
    case 'THINKING':
    case 'WAITING_APPROVAL':
      return 'thinking';
    case 'WALKING':
      return 'walking';
    case 'TALKING':
      return 'talking';
    case 'MEETING':
      return 'meeting';
    case 'IDLE':
    case 'OFFLINE':
    default:
      return 'idle';
  }
}

export interface GlbCharacterContract {
  employeeId: string;
  employeeCode?: string;
  name: string;
  role: string;
  departmentSlug: string;
  workstationId?: string;
  avatarUrl?: string;
  animationState: CharacterAnimationState;
  activityState?: EmployeeActivityState;
  position: [number, number, number];
  rotationY?: number;
  scale?: [number, number, number];
}

