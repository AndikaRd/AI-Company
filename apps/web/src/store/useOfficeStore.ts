import { create } from 'zustand';
import { CameraPreset, SelectedZoneInfo } from '../types';

interface OfficeState {
  // Camera
  activePreset: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  
  // Selection
  selectedZone: SelectedZoneInfo | null;
  hoveredZone: string | null;

  // View Options
  showGrid: boolean;
  showLabels: boolean;
  showFurniture: boolean;
  lightingMode: 'daylight' | 'cyberpunk' | 'warm';

  // Actions
  setPreset: (preset: CameraPreset) => void;
  selectZone: (zone: SelectedZoneInfo | null) => void;
  setHoveredZone: (slug: string | null) => void;
  toggleGrid: () => void;
  toggleLabels: () => void;
  toggleFurniture: () => void;
  setLightingMode: (mode: 'daylight' | 'cyberpunk' | 'warm') => void;
  resetCamera: () => void;
}

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'iso-default',
    name: 'Isometric Default',
    position: [24, 26, 24],
    target: [0, 0, 0],
  },
  {
    id: 'top-down',
    name: 'Top Down Blueprint',
    position: [0.1, 38, 0],
    target: [0, 0, 0],
  },
  {
    id: 'tech-hub',
    name: 'Tech & Engineering Bay',
    position: [-4, 14, -4],
    target: [-4, 0, -8],
  },
  {
    id: 'executive',
    name: 'Administration & Exec',
    position: [8, 14, 8],
    target: [8, 0, 8],
  },
];

export const useOfficeStore = create<OfficeState>((set) => ({
  activePreset: 'iso-default',
  cameraPosition: [24, 26, 24],
  cameraTarget: [0, 0, 0],
  selectedZone: null,
  hoveredZone: null,
  showGrid: true,
  showLabels: true,
  showFurniture: true,
  lightingMode: 'daylight',

  setPreset: (preset: CameraPreset) =>
    set({
      activePreset: preset.id,
      cameraPosition: preset.position,
      cameraTarget: preset.target,
    }),

  selectZone: (zone) => set({ selectedZone: zone }),
  setHoveredZone: (slug) => set({ hoveredZone: slug }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleFurniture: () => set((s) => ({ showFurniture: !s.showFurniture })),
  setLightingMode: (mode) => set({ lightingMode: mode }),

  resetCamera: () =>
    set({
      activePreset: 'iso-default',
      cameraPosition: [24, 26, 24],
      cameraTarget: [0, 0, 0],
      selectedZone: null,
    }),
}));
