import { Injectable, Logger } from '@nestjs/common';
import { OfficeFacilityLocation } from '@vac/shared';

@Injectable()
export class OfficeFacilitiesService {
  private readonly logger = new Logger(OfficeFacilitiesService.name);

  private readonly facilities: Map<string, OfficeFacilityLocation> = new Map();

  constructor() {
    this.registerDefaultFacilities();
  }

  private registerDefaultFacilities() {
    const list: OfficeFacilityLocation[] = [
      // Employee Primary Workstations
      {
        id: 'workstation_elena',
        name: 'COO Executive Station',
        category: 'workstation',
        departmentSlug: 'operations',
        coordinates: { x: -8, y: 0, z: 7 },
        capacity: 1,
      },
      {
        id: 'workstation_marcus',
        name: 'CTO Technology Desk',
        category: 'workstation',
        departmentSlug: 'technology',
        coordinates: { x: -9, y: 0, z: -9 },
        capacity: 1,
      },
      {
        id: 'workstation_alex',
        name: 'Senior SWE Workstation',
        category: 'workstation',
        departmentSlug: 'engineering',
        coordinates: { x: -1, y: 0, z: -9 },
        capacity: 1,
      },
      {
        id: 'workstation_maya',
        name: 'Principal Researcher Desk',
        category: 'workstation',
        departmentSlug: 'research',
        coordinates: { x: 7, y: 0, z: -9 },
        capacity: 1,
      },
      {
        id: 'workstation_sophia',
        name: 'Senior QA Station',
        category: 'workstation',
        departmentSlug: 'quality-assurance',
        coordinates: { x: -1, y: 0, z: 8 },
        capacity: 1,
      },

      // Shared Company Facilities
      {
        id: 'water_dispenser',
        name: 'Pure Spring Water Dispenser',
        category: 'water_dispenser',
        coordinates: { x: 8, y: 0, z: 3 },
        capacity: 2,
      },
      {
        id: 'pantry',
        name: 'Cafeteria & Artisan Pantry',
        category: 'pantry',
        coordinates: { x: 10, y: 0, z: 4 },
        capacity: 6,
      },
      {
        id: 'lounge',
        name: 'Executive Rest & Break Lounge',
        category: 'lounge',
        coordinates: { x: -8, y: 0, z: -1 },
        capacity: 4,
      },
      {
        id: 'meeting_room',
        name: 'Executive Boardroom',
        category: 'meeting_room',
        coordinates: { x: 8, y: 0, z: 8 },
        capacity: 8,
      },
      {
        id: 'atrium',
        name: 'Central Plaza & Atrium',
        category: 'atrium',
        coordinates: { x: 0, y: 0, z: 0 },
        capacity: 10,
      },
    ];

    for (const f of list) {
      this.facilities.set(f.id, f);
    }
  }

  getFacility(id: string): OfficeFacilityLocation | null {
    return this.facilities.get(id) || null;
  }

  getAllFacilities(): OfficeFacilityLocation[] {
    return Array.from(this.facilities.values());
  }

  getWorkstationForEmployee(employeeCodeOrRole: string, workstationId?: string | null): OfficeFacilityLocation {
    if (workstationId && this.facilities.has(workstationId)) {
      return this.facilities.get(workstationId)!;
    }

    const code = (employeeCodeOrRole || '').toUpperCase();
    if (code.includes('OPS') || code.includes('ELENA') || code.includes('CHIEF OF STAFF')) {
      return this.facilities.get('workstation_elena')!;
    }
    if (code.includes('TECH') || code.includes('MARCUS') || code.includes('CTO')) {
      return this.facilities.get('workstation_marcus')!;
    }
    if (code.includes('ENG') || code.includes('ALEX') || code.includes('SOFTWARE ENGINEER')) {
      return this.facilities.get('workstation_alex')!;
    }
    if (code.includes('RES') || code.includes('MAYA') || code.includes('RESEARCHER')) {
      return this.facilities.get('workstation_maya')!;
    }
    if (code.includes('QA') || code.includes('SOPHIA') || code.includes('QA ENGINEER')) {
      return this.facilities.get('workstation_sophia')!;
    }

    // Default fallback
    return this.facilities.get('workstation_alex')!;
  }
}

