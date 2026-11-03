import { create } from 'zustand';
import { CameraPreset, SelectedZoneInfo } from '../types';
import {
  EmployeeActivityInfo,
  EmployeeActivityUpdatedPayload,
  EmployeeNeedsData,
  EmployeeLifeStateData,
  LifeBehaviorState,
} from '@vac/shared';

interface OfficeState {
  // Camera
  activePreset: string;
  cameraMode: 'overview' | 'explore';
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  
  // Selection
  selectedZone: SelectedZoneInfo | null;
  hoveredZone: string | null;
  selectedEmployeeId: string | null;
  selectedFacilityId: string | null;

  // View Options
  showGrid: boolean;
  showLabels: boolean;
  showFurniture: boolean;
  lightingMode: 'daylight' | 'warm' | 'soft';

  // Sprint 6: Real-time Employee Activities & Socket state
  employeeActivities: Record<string, EmployeeActivityInfo>;
  isSocketConnected: boolean;
  connectionState: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';

  // Sprint 7: Employee Life Simulation State
  employeeNeeds: Record<string, EmployeeNeedsData>;
  employeeLifeStates: Record<string, EmployeeLifeStateData>;

  // Actions
  setPreset: (preset: CameraPreset) => void;
  setCameraMode: (mode: 'overview' | 'explore') => void;
  selectZone: (zone: SelectedZoneInfo | null) => void;
  setHoveredZone: (slug: string | null) => void;
  selectEmployee: (id: string | null) => void;
  selectFacility: (id: string | null) => void;
  toggleGrid: () => void;
  toggleLabels: () => void;
  toggleFurniture: () => void;
  setLightingMode: (mode: 'daylight' | 'warm' | 'soft') => void;
  resetCamera: () => void;
  focusPosition: (targetPos: [number, number, number], name?: string) => void;

  // Real-time Activity Actions
  setAllActivities: (activities: Record<string, EmployeeActivityInfo>) => void;
  updateEmployeeActivity: (payload: EmployeeActivityUpdatedPayload) => void;
  setSocketConnected: (connected: boolean) => void;
  setConnectionState: (state: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR') => void;

  // Sprint 7 Life Actions
  setAllNeeds: (needs: Record<string, EmployeeNeedsData>) => void;
  updateEmployeeNeeds: (payload: { employeeId: string; needs: EmployeeNeedsData; behavior?: LifeBehaviorState; currentThought?: string }) => void;
  setAllLifeStates: (states: Record<string, EmployeeLifeStateData>) => void;
  updateEmployeeLifeState: (payload: Partial<EmployeeLifeStateData> & { employeeId: string }) => void;
}

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'iso-default',
    name: 'Isometric View',
    position: [24, 26, 24],
    target: [0, 0, 0],
  },
  {
    id: 'top-down',
    name: 'Top View',
    position: [0.1, 38, 0],
    target: [0, 0, 0],
  },
  {
    id: 'tech-hub',
    name: 'Tech & Engineering',
    position: [-4, 14, -4],
    target: [-4, 0, -8],
  },
  {
    id: 'executive',
    name: 'Operations & Exec',
    position: [-4, 14, 8],
    target: [-6, 0, 8],
  },
  {
    id: 'conference',
    name: 'Meeting Room',
    position: [12, 14, 12],
    target: [8, 0, 8],
  },
  {
    id: 'research',
    name: 'Research Lab',
    position: [10, 14, -4],
    target: [8, 0, -8],
  },
];

export const useOfficeStore = create<OfficeState>((set) => ({
  activePreset: 'iso-default',
  cameraMode: 'overview',
  cameraPosition: [24, 26, 24],
  cameraTarget: [0, 0, 0],
  selectedZone: null,
  hoveredZone: null,
  selectedEmployeeId: null,
  selectedFacilityId: null,
  showGrid: false, // Default to clean Scandinavian floor without harsh grids
  showLabels: true,
  showFurniture: true,
  lightingMode: 'daylight',
  employeeActivities: {},
  isSocketConnected: false,
  connectionState: 'CONNECTING',
  employeeNeeds: {},
  employeeLifeStates: {},

  setPreset: (preset: CameraPreset) =>
    set({
      activePreset: preset.id,
      cameraPosition: preset.position,
      cameraTarget: preset.target,
      cameraMode: 'explore',
    }),

  setCameraMode: (mode: 'overview' | 'explore') =>
    set(() => ({
      cameraMode: mode,
      ...(mode === 'overview'
        ? {
            activePreset: 'iso-default',
            cameraPosition: [24, 26, 24],
            cameraTarget: [0, 0, 0],
          }
        : {}),
    })),

  selectZone: (zone) => set({ selectedZone: zone }),
  setHoveredZone: (slug) => set({ hoveredZone: slug }),
  selectEmployee: (id) => set({ selectedEmployeeId: id }),
  selectFacility: (id) => set({ selectedFacilityId: id }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleFurniture: () => set((s) => ({ showFurniture: !s.showFurniture })),
  setLightingMode: (mode) => set({ lightingMode: mode }),

  resetCamera: () =>
    set({
      activePreset: 'iso-default',
      cameraMode: 'overview',
      cameraPosition: [24, 26, 24],
      cameraTarget: [0, 0, 0],
      selectedZone: null,
      selectedEmployeeId: null,
      selectedFacilityId: null,
    }),

  focusPosition: (targetPos: [number, number, number], name = 'Custom Focus') =>
    set({
      activePreset: name,
      cameraMode: 'explore',
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

  // Sprint 7: Life Simulation Action Handlers
  setAllNeeds: (needs) => set({ employeeNeeds: needs }),
  updateEmployeeNeeds: (payload) =>
    set((state) => ({
      employeeNeeds: {
        ...state.employeeNeeds,
        [payload.employeeId]: payload.needs,
      },
      employeeLifeStates: payload.behavior || payload.currentThought
        ? {
            ...state.employeeLifeStates,
            [payload.employeeId]: {
              ...(state.employeeLifeStates[payload.employeeId] || {
                employeeId: payload.employeeId,
                behavior: 'IDLE',
                currentLocationId: 'workstation',
                currentLocationName: 'Workstation',
                behaviorStartedAt: new Date().toISOString(),
                lastSimulationUpdate: new Date().toISOString(),
              }),
              behavior: payload.behavior || state.employeeLifeStates[payload.employeeId]?.behavior || 'IDLE',
              currentThought: payload.currentThought || state.employeeLifeStates[payload.employeeId]?.currentThought,
            },
          }
        : state.employeeLifeStates,
    })),
  setAllLifeStates: (states) => set({ employeeLifeStates: states }),
  updateEmployeeLifeState: (payload) =>
    set((state) => ({
      employeeLifeStates: {
        ...state.employeeLifeStates,
        [payload.employeeId]: {
          ...(state.employeeLifeStates[payload.employeeId] || {
            employeeId: payload.employeeId,
            behavior: 'IDLE',
            currentLocationId: 'workstation',
            currentLocationName: 'Workstation',
            behaviorStartedAt: new Date().toISOString(),
            lastSimulationUpdate: new Date().toISOString(),
          }),
          ...payload,
        },
      },
    })),
}));

