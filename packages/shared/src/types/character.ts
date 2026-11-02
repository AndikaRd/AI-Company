export type CharacterAnimationState =
  | 'idle'
  | 'walking'
  | 'working'
  | 'talking'
  | 'meeting';

export interface GlbCharacterContract {
  employeeId: string;
  employeeCode?: string;
  name: string;
  role: string;
  departmentSlug: string;
  workstationId?: string;
  avatarUrl?: string;
  animationState: CharacterAnimationState;
  position: [number, number, number];
  rotationY?: number;
  scale?: [number, number, number];
}

