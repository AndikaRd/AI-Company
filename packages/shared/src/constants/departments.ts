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
    floorZone: 'ZONE_TECH',
    color: '#3b82f6', // blue-500
    zoneBounds: { x: -8, z: -8, width: 8, depth: 8 },
  },
  {
    name: 'Engineering',
    slug: 'engineering',
    description: 'Software development, automated pipelines, testing harnesses, and API services.',
    floorZone: 'ZONE_ENG',
    color: '#10b981', // emerald-500
    zoneBounds: { x: 0, z: -8, width: 8, depth: 8 },
  },
  {
    name: 'Research',
    slug: 'research',
    description: 'Autonomous research agents, knowledge graph synthesis, and algorithm evaluation.',
    floorZone: 'ZONE_RESEARCH',
    color: '#8b5cf6', // violet-500
    zoneBounds: { x: 8, z: -8, width: 8, depth: 8 },
  },
  {
    name: 'Business Analysis',
    slug: 'business-analysis',
    description: 'Market data analysis, competitive intelligence, and workflow metric optimization.',
    floorZone: 'ZONE_BA',
    color: '#f59e0b', // amber-500
    zoneBounds: { x: -8, z: 0, width: 8, depth: 8 },
  },
  {
    name: 'Creative',
    slug: 'creative',
    description: 'Generative media, UI/UX conceptual design, asset creation, and content generation.',
    floorZone: 'ZONE_CREATIVE',
    color: '#ec4899', // pink-500
    zoneBounds: { x: 8, z: 0, width: 8, depth: 8 },
  },
  {
    name: 'Operations',
    slug: 'operations',
    description: 'Runtime orchestration, token usage monitoring, task queues, and resource allocation.',
    floorZone: 'ZONE_OPS',
    color: '#06b6d4', // cyan-500
    zoneBounds: { x: -8, z: 8, width: 8, depth: 8 },
  },
  {
    name: 'Quality Assurance',
    slug: 'quality-assurance',
    description: 'Agent behavioral verification, security audits, regression runs, and hallucination checks.',
    floorZone: 'ZONE_QA',
    color: '#ef4444', // red-500
    zoneBounds: { x: 0, z: 8, width: 8, depth: 8 },
  },
  {
    name: 'Administration',
    slug: 'administration',
    description: 'Strategic governance, corporate policy, compliance checks, and organizational oversight.',
    floorZone: 'ZONE_ADMIN',
    color: '#6366f1', // indigo-500
    zoneBounds: { x: 8, z: 8, width: 8, depth: 8 },
  },
];
