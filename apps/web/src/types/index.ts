export * from '@vac/shared';

export interface CameraPreset {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface SelectedZoneInfo {
  id: string;
  name: string;
  slug: string;
  floorZone?: string | null;
  color?: string | null;
  description?: string | null;
  employeeCount: number;
}

