export interface LowPolyCharacterStyle {
  employeeCode: string;
  name: string;
  role: string;
  skinColor: string;
  hairColor: string;
  hairStyle: 'swept' | 'bob' | 'short_crop' | 'bun' | 'ponytail';
  topColor: string;
  topStyle: 'hoodie' | 'blazer' | 'suit' | 'labcoat' | 'athletic';
  bottomColor: string;
  shoesColor: string;
  accentColor: string;
  accessory?: 'headset' | 'glasses' | 'badge_gold' | 'tablet' | 'notebook';
  badgeTitle: string;
}

export const LOW_POLY_CHARACTER_CONFIGS: Record<string, LowPolyCharacterStyle> = {
  // 1. Elena Rostova — COO
  'VAC-OPS-001': {
    employeeCode: 'VAC-OPS-001',
    name: 'Elena Rostova',
    role: 'Chief Operating Officer',
    skinColor: '#FBD5B5',
    hairColor: '#1E293B',
    hairStyle: 'bob',
    topColor: '#1E1B4B', // Navy Executive Blazer
    topStyle: 'blazer',
    bottomColor: '#334155', // Charcoal Trousers
    shoesColor: '#0F172A',
    accentColor: '#06B6D4',
    accessory: 'badge_gold',
    badgeTitle: 'COO / CHIEF OF STAFF',
  },

  // 2. Marcus Vance — CTO
  'VAC-TECH-001': {
    employeeCode: 'VAC-TECH-001',
    name: 'Marcus Vance',
    role: 'Chief Technology Officer',
    skinColor: '#8D5B4C',
    hairColor: '#0F172A',
    hairStyle: 'short_crop',
    topColor: '#0F172A', // Cyber-minimalist dark tech suit
    topStyle: 'suit',
    bottomColor: '#1E293B',
    shoesColor: '#020617',
    accentColor: '#38BDF8',
    accessory: 'glasses',
    badgeTitle: 'CHIEF TECHNOLOGY OFFICER',
  },

  // 3. Alex Mercer — Senior SWE (Preserve canonical appearance: navy hoodie, charcoal trousers, sneakers, headset, VAC ID card)
  'VAC-ENG-001': {
    employeeCode: 'VAC-ENG-001',
    name: 'Alex Mercer',
    role: 'Senior Software Engineer',
    skinColor: '#FED7AA',
    hairColor: '#451A03',
    hairStyle: 'swept',
    topColor: '#1E3A8A', // Canonical Navy Blue Hoodie
    topStyle: 'hoodie',
    bottomColor: '#334155', // Charcoal Trousers
    shoesColor: '#E2E8F0', // Clean White/Gray Sneakers
    accentColor: '#10B981',
    accessory: 'headset', // Cyan Wireless Tech Headset
    badgeTitle: 'SENIOR SOFTWARE ENGINEER',
  },

  // 4. Dr. Maya Patel — Principal Researcher
  'VAC-RES-001': {
    employeeCode: 'VAC-RES-001',
    name: 'Dr. Maya Patel',
    role: 'Principal Researcher',
    skinColor: '#D4A373',
    hairColor: '#18181B',
    hairStyle: 'bun',
    topColor: '#4C1D95', // Academic Lab Coat / Scholar Blazer
    topStyle: 'labcoat',
    bottomColor: '#312E81',
    shoesColor: '#18181B',
    accentColor: '#8B5CF6',
    accessory: 'glasses',
    badgeTitle: 'PRINCIPAL RESEARCHER',
  },

  // 5. Sophia Lin — Senior QA Engineer
  'VAC-QA-001': {
    employeeCode: 'VAC-QA-001',
    name: 'Sophia Lin',
    role: 'Senior QA Engineer',
    skinColor: '#FED7AA',
    hairColor: '#18181B',
    hairStyle: 'ponytail',
    topColor: '#881337', // Athletic smart-casual tech wear
    topStyle: 'athletic',
    bottomColor: '#1F2937',
    shoesColor: '#F8FAFC',
    accentColor: '#EF4444',
    accessory: 'tablet',
    badgeTitle: 'SENIOR QA ENGINEER',
  },
};

export function getCharacterStyle(employeeCode?: string | null, firstName?: string | null): LowPolyCharacterStyle {
  if (employeeCode && LOW_POLY_CHARACTER_CONFIGS[employeeCode]) {
    return LOW_POLY_CHARACTER_CONFIGS[employeeCode];
  }
  const name = (firstName || '').toLowerCase();
  if (name.includes('elena')) return LOW_POLY_CHARACTER_CONFIGS['VAC-OPS-001'];
  if (name.includes('marcus')) return LOW_POLY_CHARACTER_CONFIGS['VAC-TECH-001'];
  if (name.includes('alex')) return LOW_POLY_CHARACTER_CONFIGS['VAC-ENG-001'];
  if (name.includes('maya')) return LOW_POLY_CHARACTER_CONFIGS['VAC-RES-001'];
  if (name.includes('sophia')) return LOW_POLY_CHARACTER_CONFIGS['VAC-QA-001'];

  return LOW_POLY_CHARACTER_CONFIGS['VAC-ENG-001'];
}

