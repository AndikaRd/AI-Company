export interface InitialDepartmentDefinition {
  name: string;
  slug: string;
  description: string;
  floorZone: string;
  color: string;
  zoneBounds: {
    x: number;
    z: number;
    width: number;
    depth: number;
  };
}

export const INITIAL_DEPARTMENTS: InitialDepartmentDefinition[] = [
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Core AI models, cloud systems architecture, and platform infrastructure.',
    floorZone: 'Technology Hub',
    color: '#B8DDE3', // Soft Cyan
    zoneBounds: { x: -8, z: -8, width: 8, depth: 8 },
  },
  {
    name: 'Engineering',
    slug: 'engineering',
    description: 'Software development, automated pipelines, testing harnesses, and API services.',
    floorZone: 'Engineering Bay',
    color: '#C4DEC5', // Soft Green
    zoneBounds: { x: 0, z: -8, width: 8, depth: 8 },
  },
  {
    name: 'Research',
    slug: 'research',
    description: 'Autonomous research agents, knowledge graph synthesis, and algorithm evaluation.',
    floorZone: 'Research Lab',
    color: '#D6C9E8', // Soft Purple
    zoneBounds: { x: 8, z: -8, width: 8, depth: 8 },
  },
  {
    name: 'Business Analysis',
    slug: 'business-analysis',
    description: 'Lounge, casual collaboration, and market intelligence.',
    floorZone: 'Lounge & Analysis',
    color: '#F0EFEC', // Muted Surface
    zoneBounds: { x: -8, z: 0, width: 8, depth: 8 },
  },
  {
    name: 'Creative',
    slug: 'creative',
    description: 'Modern conference and collaborative meeting room.',
    floorZone: 'Meeting Room',
    color: '#E9DCA9', // Soft Gold
    zoneBounds: { x: 8, z: 0, width: 8, depth: 8 },
  },
  {
    name: 'Operations',
    slug: 'operations',
    description: 'Runtime orchestration, token usage monitoring, task queues, and resource allocation.',
    floorZone: 'Operations Hub',
    color: '#F2C9A5', // Soft Orange
    zoneBounds: { x: -8, z: 8, width: 8, depth: 8 },
  },
  {
    name: 'Quality Assurance',
    slug: 'quality-assurance',
    description: 'Agent behavioral verification, security audits, regression runs, and hallucination checks.',
    floorZone: 'QA Center',
    color: '#EBC8D3', // Soft Pink
    zoneBounds: { x: 0, z: 8, width: 8, depth: 8 },
  },
  {
    name: 'Administration',
    slug: 'administration',
    description: 'Executive leadership, strategic governance, compliance, and corporate conference room.',
    floorZone: 'Executive Suite',
    color: '#E9DCA9', // Soft Gold
    zoneBounds: { x: 8, z: 8, width: 8, depth: 8 },
  },
];

