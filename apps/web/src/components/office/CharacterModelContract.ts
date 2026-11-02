import { CharacterAnimationState } from '@vac/shared';

/**
 * CharacterModelContract
 * Contract defining props and behaviors required for upcoming GLB rigged character models.
 * Animations to be bound in Sprint 2:
 * - 'idle': Breathing / seated neutral posture
 * - 'walking': Waypoint pathing between workstation and departments
 * - 'working': Typing / keyboard interaction at designated workstation
 * - 'talking': Speech gestures during multi-agent discussions
 * - 'meeting': Seated conference posture around meeting tables
 */
export interface CharacterModelProps {
  employeeId: string;
  employeeCode?: string;
  name: string;
  modelUrl: string;
  animationState: CharacterAnimationState;
  position: [number, number, number];
  rotationY?: number;
  scale?: [number, number, number];
  onAnimationEnd?: (state: CharacterAnimationState) => void;
}

export const SUPPORTED_ANIMATION_STATES: CharacterAnimationState[] = [
  'idle',
  'walking',
  'working',
  'talking',
  'meeting',
];
