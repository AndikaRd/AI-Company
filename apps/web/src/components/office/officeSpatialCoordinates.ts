/**
 * Authoritative 3D Spatial Coordinates for all Nexus AI Dynamics Office Facilities & Workstations.
 * Matches backend OfficeFacilitiesService and 2D Architectural Floorplan.
 */

export interface FacilityCoordinates {
  id: string;
  name: string;
  category: 'workstation' | 'water_dispenser' | 'pantry' | 'lounge' | 'meeting_room' | 'atrium' | 'reception';
  position: [number, number, number];
  seatRotationY?: number;
  departmentSlug?: string;
  assignedEmployeeCode?: string;
}

export const OFFICE_FACILITY_COORDINATES: Record<string, FacilityCoordinates> = {
  // 1. Employee Workstations (Standing/Seating Anchor)
  workstation_marcus: {
    id: 'workstation_marcus',
    name: 'CTO Technology Desk',
    category: 'workstation',
    position: [-9, 0, -8.45],
    seatRotationY: Math.PI,
    departmentSlug: 'technology',
    assignedEmployeeCode: 'VAC-TECH-001',
  },
  workstation_alex: {
    id: 'workstation_alex',
    name: 'Senior SWE Workstation',
    category: 'workstation',
    position: [-1, 0, -8.45],
    seatRotationY: Math.PI,
    departmentSlug: 'engineering',
    assignedEmployeeCode: 'VAC-ENG-001',
  },
  workstation_maya: {
    id: 'workstation_maya',
    name: 'Principal Researcher Desk',
    category: 'workstation',
    position: [7, 0, -8.45],
    seatRotationY: Math.PI,
    departmentSlug: 'research',
    assignedEmployeeCode: 'VAC-RES-001',
  },
  workstation_elena: {
    id: 'workstation_elena',
    name: 'COO Operations Desk',
    category: 'workstation',
    position: [-8, 0, 7.55],
    seatRotationY: 0,
    departmentSlug: 'operations',
    assignedEmployeeCode: 'VAC-OPS-001',
  },
  workstation_sophia: {
    id: 'workstation_sophia',
    name: 'Senior QA Station',
    category: 'workstation',
    position: [-1, 0, 8.55],
    seatRotationY: 0,
    departmentSlug: 'quality-assurance',
    assignedEmployeeCode: 'VAC-QA-001',
  },

  // 2. Physical Amenities & Rest Facilities
  water_dispenser: {
    id: 'water_dispenser',
    name: 'Pure Spring Water Dispenser',
    category: 'water_dispenser',
    position: [-3, 0, 2.3],
    seatRotationY: 0,
  },
  pantry: {
    id: 'pantry',
    name: 'Cafeteria & Artisan Pantry',
    category: 'pantry',
    position: [3, 0, 2.3],
    seatRotationY: 0,
  },
  lounge: {
    id: 'lounge',
    name: 'Executive Rest & Break Lounge',
    category: 'lounge',
    position: [-7.8, 0, -0.6],
    seatRotationY: Math.PI / 2,
  },
  meeting_room: {
    id: 'meeting_room',
    name: 'Executive Boardroom',
    category: 'meeting_room',
    position: [8, 0, 7.2],
    seatRotationY: -Math.PI / 2,
  },
  atrium: {
    id: 'atrium',
    name: 'Central Plaza & Living Atrium',
    category: 'atrium',
    position: [0, 0, 1.8],
    seatRotationY: Math.PI,
  },
  reception: {
    id: 'reception',
    name: 'Front Reception & Welcome Area',
    category: 'reception',
    position: [-10.5, 0, -1.8],
    seatRotationY: Math.PI / 2,
  },
};

export function getFacilityPosition(locationId: string | null | undefined): [number, number, number] {
  if (!locationId) return [0, 0, 0];
  const found = OFFICE_FACILITY_COORDINATES[locationId];
  if (found) return found.position;

  // Department-level fallback
  if (locationId.includes('tech')) return OFFICE_FACILITY_COORDINATES.workstation_marcus.position;
  if (locationId.includes('eng')) return OFFICE_FACILITY_COORDINATES.workstation_alex.position;
  if (locationId.includes('res')) return OFFICE_FACILITY_COORDINATES.workstation_maya.position;
  if (locationId.includes('ops') || locationId.includes('exec')) return OFFICE_FACILITY_COORDINATES.workstation_elena.position;
  if (locationId.includes('qa')) return OFFICE_FACILITY_COORDINATES.workstation_sophia.position;

  return [0, 0, 0];
}

