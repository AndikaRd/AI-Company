/**
 * Office Layout Configuration (Nexus AI Dynamics)
 * Single source of truth for the 2D top-down architectural floorplan.
 * Coordinate space: 1600 x 1000 viewBox.
 */

export interface ZoneConfig {
  id: string;
  name: string;
  category: 'department' | 'common';
  departmentSlug?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  accentColor: string;
  accentTintDark: string;
  accentTintLight: string;
  door: {
    x: number;
    y: number;
    width: number;
    side: 'top' | 'bottom' | 'left' | 'right';
  };
  desks: DeskConfig[];
  furniture: FurnitureItem[];
}

export interface DeskConfig {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees
  assignedEmployeeCode?: string; // e.g. VAC-OPS-001, VAC-TECH-001
  departmentSlug: string;
  // Position where the employee avatar sits
  avatarX: number;
  avatarY: number;
}

export interface FurnitureItem {
  type: 'desk' | 'table' | 'chair' | 'sofa' | 'plant' | 'divider' | 'counter';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  label?: string;
}

export interface BuildingLayout {
  width: number;
  height: number;
  outerWall: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
  };
  zones: ZoneConfig[];
}

export const OFFICE_LAYOUT: BuildingLayout = {
  width: 1600,
  height: 1000,
  outerWall: {
    x: 30,
    y: 30,
    width: 1540,
    height: 940,
    radius: 20,
  },
  zones: [
    // -------------------------------------------------------------------------
    // ROW 1: Creative, Technology, Engineering, Research
    // -------------------------------------------------------------------------
    {
      id: 'creative',
      name: 'Creative Studio',
      category: 'department',
      departmentSlug: 'creative',
      x: 60,
      y: 60,
      width: 340,
      height: 260,
      accentColor: '#F472B6',
      accentTintDark: 'rgba(244, 114, 182, 0.05)',
      accentTintLight: 'rgba(244, 114, 182, 0.08)',
      door: { x: 340, y: 320, width: 44, side: 'bottom' },
      desks: [
        {
          id: 'desk-crt-1',
          label: 'Design Station 01',
          x: 100,
          y: 130,
          width: 80,
          height: 48,
          departmentSlug: 'creative',
          avatarX: 140,
          avatarY: 200,
        },
        {
          id: 'desk-crt-2',
          label: 'Motion Graphics',
          x: 230,
          y: 130,
          width: 80,
          height: 48,
          departmentSlug: 'creative',
          avatarX: 270,
          avatarY: 200,
        },
      ],
      furniture: [
        { type: 'plant', x: 80, y: 80, radius: 14 },
        { type: 'table', x: 170, y: 240, width: 100, height: 32 },
      ],
    },
    {
      id: 'technology',
      name: 'Technology Hub',
      category: 'department',
      departmentSlug: 'technology',
      x: 430,
      y: 60,
      width: 350,
      height: 260,
      accentColor: '#06B6D4',
      accentTintDark: 'rgba(6, 182, 212, 0.06)',
      accentTintLight: 'rgba(6, 182, 212, 0.09)',
      door: { x: 605, y: 320, width: 48, side: 'bottom' },
      desks: [
        {
          id: 'desk-tech-1',
          label: 'CTO Workstation',
          assignedEmployeeCode: 'VAC-TECH-001',
          x: 480,
          y: 130,
          width: 90,
          height: 50,
          departmentSlug: 'technology',
          avatarX: 525,
          avatarY: 205,
        },
        {
          id: 'desk-tech-2',
          label: 'Infra / DevOps',
          x: 630,
          y: 130,
          width: 90,
          height: 50,
          departmentSlug: 'technology',
          avatarX: 675,
          avatarY: 205,
        },
      ],
      furniture: [
        { type: 'plant', x: 755, y: 80, radius: 14 },
        { type: 'counter', x: 460, y: 250, width: 120, height: 20 },
      ],
    },
    {
      id: 'engineering',
      name: 'Engineering Pod',
      category: 'department',
      departmentSlug: 'engineering',
      x: 810,
      y: 60,
      width: 360,
      height: 260,
      accentColor: '#10B981',
      accentTintDark: 'rgba(16, 185, 129, 0.06)',
      accentTintLight: 'rgba(16, 185, 129, 0.09)',
      door: { x: 990, y: 320, width: 48, side: 'bottom' },
      desks: [
        {
          id: 'desk-eng-1',
          label: 'Senior SWE Desk',
          assignedEmployeeCode: 'VAC-ENG-001',
          x: 860,
          y: 130,
          width: 90,
          height: 50,
          departmentSlug: 'engineering',
          avatarX: 905,
          avatarY: 205,
        },
        {
          id: 'desk-eng-2',
          label: 'Systems Architect',
          x: 1020,
          y: 130,
          width: 90,
          height: 50,
          departmentSlug: 'engineering',
          avatarX: 1065,
          avatarY: 205,
        },
      ],
      furniture: [
        { type: 'plant', x: 835, y: 80, radius: 14 },
        { type: 'table', x: 920, y: 245, width: 140, height: 28 },
      ],
    },
    {
      id: 'research',
      name: 'Research & AI Lab',
      category: 'department',
      departmentSlug: 'research',
      x: 1200,
      y: 60,
      width: 340,
      height: 260,
      accentColor: '#8B5CF6',
      accentTintDark: 'rgba(139, 92, 246, 0.06)',
      accentTintLight: 'rgba(139, 92, 246, 0.09)',
      door: { x: 1200, y: 220, width: 44, side: 'left' },
      desks: [
        {
          id: 'desk-res-1',
          label: 'Principal Researcher',
          assignedEmployeeCode: 'VAC-RES-001',
          x: 1250,
          y: 130,
          width: 90,
          height: 50,
          departmentSlug: 'research',
          avatarX: 1295,
          avatarY: 205,
        },
        {
          id: 'desk-res-2',
          label: 'ML Scientist',
          x: 1400,
          y: 130,
          width: 90,
          height: 50,
          departmentSlug: 'research',
          avatarX: 1445,
          avatarY: 205,
        },
      ],
      furniture: [
        { type: 'plant', x: 1515, y: 80, radius: 14 },
        { type: 'counter', x: 1320, y: 250, width: 140, height: 22 },
      ],
    },

    // -------------------------------------------------------------------------
    // ROW 2: Lounge, Central Garden Atrium, Cafeteria & Pantry
    // -------------------------------------------------------------------------
    {
      id: 'lounge',
      name: 'Casual Lounge',
      category: 'common',
      x: 60,
      y: 350,
      width: 340,
      height: 270,
      accentColor: '#94A3B8',
      accentTintDark: 'rgba(148, 163, 184, 0.03)',
      accentTintLight: 'rgba(148, 163, 184, 0.06)',
      door: { x: 400, y: 460, width: 50, side: 'right' },
      desks: [],
      furniture: [
        { type: 'sofa', x: 90, y: 390, width: 140, height: 44, label: 'Lounge Sofa' },
        { type: 'table', x: 110, y: 460, width: 100, height: 40 },
        { type: 'sofa', x: 90, y: 530, width: 140, height: 44 },
        { type: 'plant', x: 330, y: 380, radius: 18 },
        { type: 'plant', x: 330, y: 580, radius: 16 },
      ],
    },
    {
      id: 'atrium',
      name: 'Central Plaza & Atrium',
      category: 'common',
      x: 430,
      y: 350,
      width: 740,
      height: 270,
      accentColor: '#10B981',
      accentTintDark: 'rgba(16, 185, 129, 0.02)',
      accentTintLight: 'rgba(16, 185, 129, 0.04)',
      door: { x: 800, y: 350, width: 60, side: 'top' },
      desks: [],
      furniture: [
        // Centerpiece Plant Planter
        { type: 'plant', x: 800, y: 485, radius: 36, label: 'Central Ficus' },
        { type: 'table', x: 570, y: 460, width: 110, height: 50, label: 'Collab Bench A' },
        { type: 'table', x: 920, y: 460, width: 110, height: 50, label: 'Collab Bench B' },
        { type: 'plant', x: 470, y: 380, radius: 16 },
        { type: 'plant', x: 1130, y: 380, radius: 16 },
        { type: 'plant', x: 470, y: 580, radius: 16 },
        { type: 'plant', x: 1130, y: 580, radius: 16 },
      ],
    },
    {
      id: 'pantry',
      name: 'Cafeteria & Pantry',
      category: 'common',
      x: 1200,
      y: 350,
      width: 340,
      height: 270,
      accentColor: '#F59E0B',
      accentTintDark: 'rgba(245, 158, 11, 0.04)',
      accentTintLight: 'rgba(245, 158, 11, 0.07)',
      door: { x: 1200, y: 460, width: 50, side: 'left' },
      desks: [],
      furniture: [
        { type: 'counter', x: 1240, y: 380, width: 220, height: 36, label: 'Coffee Bar' },
        { type: 'table', x: 1240, y: 460, width: 90, height: 46 },
        { type: 'table', x: 1370, y: 460, width: 90, height: 46 },
        { type: 'plant', x: 1500, y: 580, radius: 16 },
      ],
    },

    // -------------------------------------------------------------------------
    // ROW 3: Business Analysis, Operations, Quality Assurance, Meeting Room
    // -------------------------------------------------------------------------
    {
      id: 'business_analysis',
      name: 'Business Analysis',
      category: 'department',
      departmentSlug: 'business-analysis',
      x: 60,
      y: 650,
      width: 340,
      height: 290,
      accentColor: '#3B82F6',
      accentTintDark: 'rgba(59, 130, 246, 0.06)',
      accentTintLight: 'rgba(59, 130, 246, 0.09)',
      door: { x: 340, y: 650, width: 44, side: 'top' },
      desks: [
        {
          id: 'desk-ba-1',
          label: 'Lead Analyst',
          x: 100,
          y: 730,
          width: 80,
          height: 48,
          departmentSlug: 'business-analysis',
          avatarX: 140,
          avatarY: 805,
        },
        {
          id: 'desk-ba-2',
          label: 'Market Intel',
          x: 230,
          y: 730,
          width: 80,
          height: 48,
          departmentSlug: 'business-analysis',
          avatarX: 270,
          avatarY: 805,
        },
      ],
      furniture: [
        { type: 'table', x: 140, y: 860, width: 140, height: 36 },
        { type: 'plant', x: 80, y: 910, radius: 14 },
      ],
    },
    {
      id: 'operations',
      name: 'Operations & Exec',
      category: 'department',
      departmentSlug: 'operations',
      x: 430,
      y: 650,
      width: 350,
      height: 290,
      accentColor: '#F59E0B',
      accentTintDark: 'rgba(245, 158, 11, 0.06)',
      accentTintLight: 'rgba(245, 158, 11, 0.09)',
      door: { x: 605, y: 650, width: 48, side: 'top' },
      desks: [
        {
          id: 'desk-ops-1',
          label: 'COO Executive Station',
          assignedEmployeeCode: 'VAC-OPS-001',
          x: 480,
          y: 730,
          width: 90,
          height: 50,
          departmentSlug: 'operations',
          avatarX: 525,
          avatarY: 805,
        },
        {
          id: 'desk-ops-2',
          label: 'Operations Coordinator',
          x: 630,
          y: 730,
          width: 90,
          height: 50,
          departmentSlug: 'operations',
          avatarX: 675,
          avatarY: 805,
        },
      ],
      furniture: [
        { type: 'plant', x: 460, y: 910, radius: 15 },
        { type: 'table', x: 550, y: 860, width: 120, height: 32 },
      ],
    },
    {
      id: 'qa',
      name: 'Quality Assurance',
      category: 'department',
      departmentSlug: 'quality-assurance',
      x: 810,
      y: 650,
      width: 360,
      height: 290,
      accentColor: '#EC4899',
      accentTintDark: 'rgba(236, 72, 153, 0.06)',
      accentTintLight: 'rgba(236, 72, 153, 0.09)',
      door: { x: 990, y: 650, width: 48, side: 'top' },
      desks: [
        {
          id: 'desk-qa-1',
          label: 'Senior QA Station',
          assignedEmployeeCode: 'VAC-QA-001',
          x: 860,
          y: 730,
          width: 90,
          height: 50,
          departmentSlug: 'quality-assurance',
          avatarX: 905,
          avatarY: 805,
        },
        {
          id: 'desk-qa-2',
          label: 'Test Automation',
          x: 1020,
          y: 730,
          width: 90,
          height: 50,
          departmentSlug: 'quality-assurance',
          avatarX: 1065,
          avatarY: 805,
        },
      ],
      furniture: [
        { type: 'plant', x: 1140, y: 910, radius: 14 },
        { type: 'counter', x: 900, y: 865, width: 150, height: 24 },
      ],
    },
    {
      id: 'meeting',
      name: 'Executive Boardroom',
      category: 'common',
      x: 1200,
      y: 650,
      width: 340,
      height: 290,
      accentColor: '#6366F1',
      accentTintDark: 'rgba(99, 102, 241, 0.05)',
      accentTintLight: 'rgba(99, 102, 241, 0.08)',
      door: { x: 1200, y: 760, width: 48, side: 'left' },
      desks: [],
      furniture: [
        { type: 'table', x: 1260, y: 730, width: 220, height: 90, label: 'Conference Table' },
        // Meeting chairs surrounding table
        { type: 'chair', x: 1290, y: 710, radius: 8 },
        { type: 'chair', x: 1340, y: 710, radius: 8 },
        { type: 'chair', x: 1390, y: 710, radius: 8 },
        { type: 'chair', x: 1440, y: 710, radius: 8 },
        { type: 'chair', x: 1290, y: 840, radius: 8 },
        { type: 'chair', x: 1340, y: 840, radius: 8 },
        { type: 'chair', x: 1390, y: 840, radius: 8 },
        { type: 'chair', x: 1440, y: 840, radius: 8 },
        { type: 'plant', x: 1510, y: 910, radius: 16 },
      ],
    },
  ],
};

