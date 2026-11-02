import { create } from 'zustand';
import { CameraPreset, SelectedZoneInfo } from '../types';
import { EmployeeActivityInfo, EmployeeActivityUpdatedPayload } from '@vac/shared';

interface OfficeState {
  // Camera
  activePreset: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  
  // Selection
  selectedZone: SelectedZoneInfo | null;
  hoveredZone: string | null;
  selectedEmployeeId: string | null;

  // View Options
  showGrid: boolean;
  showLabels: boolean;
  showFurniture: boolean;
  lightingMode: 'daylight' | 'cyberpunk' | 'warm';

  // Sprint 6: Real-time Employee Activities & Socket state
  employeeActivities: Record<string, EmployeeActivityInfo>;
  isSocketConnected: boolean;
  connectionState: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';

  // Actions
  setPreset: (preset: CameraPreset) => void;
  selectZone: (zone: SelectedZoneInfo | null) => void;
  setHoveredZone: (slug: string | null) => void;
  selectEmployee: (id: string | null) => void;
  toggleGrid: () => void;
  toggleLabels: () => void;
  toggleFurniture: () => void;
  setLightingMode: (mode: 'daylight' | 'cyberpunk' | 'warm') => void;
  resetCamera: () => void;
  focusPosition: (targetPos: [number, number, number], name?: string) => void;

  // Real-time Activity Actions
  setAllActivities: (activities: Record<string, EmployeeActivityInfo>) => void;
  updateEmployeeActivity: (payload: EmployeeActivityUpdatedPayload) => void;
  setSocketConnected: (connected: boolean) => void;
  setConnectionState: (state: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR') => void;
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
    name: 'Operations & Exec Hub',
    position: [-4, 14, 8],
    target: [-6, 0, 8],
  },
  {
    id: 'conference',
    name: 'Executive Meeting Room',
    position: [12, 14, 12],
    target: [8, 0, 8],
  },
  {
    id: 'research',
    name: 'Research & Intelligence',
    position: [10, 14, -4],
    target: [8, 0, -8],
  },
];

export const useOfficeStore = create<OfficeState>((set) => ({
  activePreset: 'iso-default',
  cameraPosition: [24, 26, 24],
  cameraTarget: [0, 0, 0],
  selectedZone: null,
  hoveredZone: null,
  selectedEmployeeId: null,
  showGrid: true,
  showLabels: true,
  showFurniture: true,
  lightingMode: 'daylight',
  employeeActivities: {},
  isSocketConnected: false,
  connectionState: 'CONNECTING',

  setPreset: (preset: CameraPreset) =>
    set({
      activePreset: preset.id,
      cameraPosition: preset.position,
      cameraTarget: preset.target,
    }),

  selectZone: (zone) => set({ selectedZone: zone }),
  setHoveredZone: (slug) => set({ hoveredZone: slug }),
  selectEmployee: (id) => set({ selectedEmployeeId: id }),
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
      selectedEmployeeId: null,
    }),

  focusPosition: (targetPos: [number, number, number], name = 'Custom Focus') =>
    set({
      activePreset: name,
      cameraPosition: [targetPos[0] + 5, targetPos[1] + 6, targetPos[2] + 5],
      cameraTarget: [targetPos[0], targetPos[1] + 0.8, targetPos[2]],
    }),

  setAllActivities: (activities) => set({ employeeActivities: activities }),

  updateEmployeeActivity: (payload) =>
    set((state) => {
      const existing = state.employeeActivities[payload.employeeId] || {
        employeeId: payload.employeeId,
        activity: 'IDLE',
        animationState: 'idle',
        updatedAt: payload.timestamp,
      };

      return {
        employeeActivities: {
          ...state.employeeActivities,
          [payload.employeeId]: {
            ...existing,
            activity: payload.activity,
            animationState: payload.animationState,
            currentTaskId: payload.currentTaskId,
            taskTitle: payload.taskTitle,
            workstationId: payload.workstationId || existing.workstationId,
            departmentSlug: payload.departmentSlug || existing.departmentSlug,
            details: payload.details || existing.details,
            updatedAt: payload.timestamp,
          },
        },
      };
    }),

  setSocketConnected: (connected) =>
    set({
      isSocketConnected: connected,
      connectionState: connected ? 'CONNECTED' : 'DISCONNECTED',
    }),
  setConnectionState: (state) =>
    set({
      connectionState: state,
      isSocketConnected: state === 'CONNECTED',
    }),
}));

