import { Employee } from '@vac/shared';

export interface CharacterAssetMetadata {
  employeeCode: string;
  slug: string;
  name: string;
  role: string;
  glbUrl: string;
  previewUrl: string;
  scale: [number, number, number];
  rotationOffsetY: number;
  availableClips: string[];
  animationMapping: Record<
    string,
    {
      type: 'clip' | 'procedural_fallback';
      clipName?: string;
      behavior?: string;
    }
  >;
  visualAttributes: {
    apparel: string;
    palette: { primary: string; accent: string };
    badge: string;
    accessories?: string[];
  };
}

export const CHARACTER_ASSET_REGISTRY: Record<string, CharacterAssetMetadata> = {
  // 1. Elena Rostova — COO
  'VAC-OPS-001': {
    employeeCode: 'VAC-OPS-001',
    slug: 'elena-rostova',
    name: 'Elena Rostova',
    role: 'Chief Operating Officer / Chief of Staff',
    glbUrl: '/assets/characters/elena-rostova/character.glb',
    previewUrl: '/assets/characters/elena-rostova/preview.png',
    scale: [1.15, 1.15, 1.15],
    rotationOffsetY: Math.PI,
    availableClips: [],
    animationMapping: {
      IDLE: { type: 'procedural_fallback', behavior: 'breathing_subtle_posture' },
      WALKING: { type: 'procedural_fallback', behavior: 'torso_bobbing_stride' },
      SITTING_WORKING: { type: 'procedural_fallback', behavior: 'seated_executive_desk_monitoring' },
      TALKING: { type: 'procedural_fallback', behavior: 'head_nod_authoritative_gestures' },
      MEETING: { type: 'procedural_fallback', behavior: 'conference_seated_command_posture' },
      THINKING: { type: 'procedural_fallback', behavior: 'analytical_head_tilt' },
    },
    visualAttributes: {
      apparel: 'Smart executive business attire, sharp blazer',
      palette: { primary: '#1e1b4b', accent: '#06b6d4' },
      badge: 'VAC-OPS-001 Executive Gold ID',
    },
  },

  // 2. Marcus Vance — CTO
  'VAC-TECH-001': {
    employeeCode: 'VAC-TECH-001',
    slug: 'marcus-vance',
    name: 'Marcus Vance',
    role: 'Chief Technology Officer',
    glbUrl: '/assets/characters/marcus-vance/character.glb',
    previewUrl: '/assets/characters/marcus-vance/preview.png',
    scale: [1.05, 1.05, 1.05],
    rotationOffsetY: Math.PI,
    availableClips: ['agree', 'headShake', 'idle', 'run', 'sad_pose', 'sneak_pose', 'walk'],
    animationMapping: {
      IDLE: { type: 'clip', clipName: 'idle' },
      WALKING: { type: 'clip', clipName: 'walk' },
      SITTING_WORKING: { type: 'procedural_fallback', behavior: 'seated_terminal_typing_interaction' },
      TALKING: { type: 'clip', clipName: 'agree' },
      MEETING: { type: 'clip', clipName: 'idle' },
      THINKING: { type: 'clip', clipName: 'headShake' },
    },
    visualAttributes: {
      apparel: 'Modern technical executive apparel, cyber-minimalist dark suit',
      palette: { primary: '#0f172a', accent: '#38bdf8' },
      badge: 'VAC-TECH-001 Technical Authority Badge',
    },
  },

  // 3. Alex Mercer — Senior Software Engineer
  'VAC-ENG-001': {
    employeeCode: 'VAC-ENG-001',
    slug: 'alex-mercer',
    name: 'Alex Mercer',
    role: 'Senior Software Engineer',
    glbUrl: '/assets/characters/alex-mercer/character.glb',
    previewUrl: '/assets/characters/alex-mercer/preview.png',
    scale: [1.05, 1.05, 1.05],
    rotationOffsetY: Math.PI,
    availableClips: ['Idle', 'Run', 'TPose', 'Walk'],
    animationMapping: {
      IDLE: { type: 'clip', clipName: 'Idle' },
      WALKING: { type: 'clip', clipName: 'Walk' },
      SITTING_WORKING: { type: 'procedural_fallback', behavior: 'seated_mechanical_keyboard_coding' },
      TALKING: { type: 'procedural_fallback', behavior: 'head_nod_peer_explanation' },
      MEETING: { type: 'clip', clipName: 'Idle' },
      THINKING: { type: 'procedural_fallback', behavior: 'chin_touch_code_inspection' },
    },
    visualAttributes: {
      apparel: 'Navy hoodie, charcoal trousers, sneakers, wireless tech headset',
      palette: { primary: '#0369a1', accent: '#10b981' },
      badge: 'VAC-ENG-001 Senior SWE Badge',
      accessories: ['Headset', 'Smart Watch', 'AR Glasses'],
    },
  },

  // 4. Dr. Maya Patel — Principal Research Specialist
  'VAC-RES-001': {
    employeeCode: 'VAC-RES-001',
    slug: 'maya-patel',
    name: 'Dr. Maya Patel',
    role: 'Principal Research Specialist',
    glbUrl: '/assets/characters/maya-patel/character.glb',
    previewUrl: '/assets/characters/maya-patel/preview.png',
    scale: [1.0, 1.0, 1.0],
    rotationOffsetY: Math.PI,
    availableClips: [],
    animationMapping: {
      IDLE: { type: 'procedural_fallback', behavior: 'breathing_intellectual_posture' },
      WALKING: { type: 'procedural_fallback', behavior: 'torso_bobbing_stride' },
      SITTING_WORKING: { type: 'procedural_fallback', behavior: 'seated_literature_synthesis_posture' },
      TALKING: { type: 'procedural_fallback', behavior: 'academic_exposition_gestures' },
      MEETING: { type: 'procedural_fallback', behavior: 'conference_observing_notes' },
      THINKING: { type: 'procedural_fallback', behavior: 'pensive_research_look' },
    },
    visualAttributes: {
      apparel: 'Stylized academic lab coat / scholarly blazer, glasses, research notebook',
      palette: { primary: '#6b21a8', accent: '#8b5cf6' },
      badge: 'VAC-RES-001 Principal Researcher Badge',
    },
  },

  // 5. Sophia Lin — Senior QA Engineer
  'VAC-QA-001': {
    employeeCode: 'VAC-QA-001',
    slug: 'sophia-lin',
    name: 'Sophia Lin',
    role: 'Senior Quality Assurance Engineer',
    glbUrl: '/assets/characters/sophia-lin/character.glb',
    previewUrl: '/assets/characters/sophia-lin/preview.png',
    scale: [1.05, 1.05, 1.05],
    rotationOffsetY: Math.PI,
    availableClips: ['SambaDance', 'TPose'],
    animationMapping: {
      IDLE: { type: 'procedural_fallback', behavior: 'alert_standing_quality_posture' },
      WALKING: { type: 'procedural_fallback', behavior: 'torso_bobbing_stride' },
      SITTING_WORKING: { type: 'procedural_fallback', behavior: 'seated_qa_test_inspection_typing' },
      TALKING: { type: 'procedural_fallback', behavior: 'testing_boundary_explanation' },
      MEETING: { type: 'procedural_fallback', behavior: 'conference_seated_qa_signoff' },
      THINKING: { type: 'procedural_fallback', behavior: 'scrutinizing_defect_analysis' },
    },
    visualAttributes: {
      apparel: 'Athletic smart-casual QA tech attire, tactical sneakers, automated test tablet',
      palette: { primary: '#991b1b', accent: '#ef4444' },
      badge: 'VAC-QA-001 Senior QA Badge',
    },
  },
};

export class CharacterAssetsService {
  /**
   * Resolves the asset metadata for any employee by employeeCode, id, or firstName
   */
  static getAssetForEmployee(employee: Employee | null): CharacterAssetMetadata {
    if (!employee) {
      return CHARACTER_ASSET_REGISTRY['VAC-ENG-001'];
    }

    if (employee.employeeCode && CHARACTER_ASSET_REGISTRY[employee.employeeCode]) {
      return CHARACTER_ASSET_REGISTRY[employee.employeeCode];
    }

    const firstName = employee.firstName.toLowerCase();
    if (firstName.includes('elena')) return CHARACTER_ASSET_REGISTRY['VAC-OPS-001'];
    if (firstName.includes('marcus')) return CHARACTER_ASSET_REGISTRY['VAC-TECH-001'];
    if (firstName.includes('alex')) return CHARACTER_ASSET_REGISTRY['VAC-ENG-001'];
    if (firstName.includes('maya')) return CHARACTER_ASSET_REGISTRY['VAC-RES-001'];
    if (firstName.includes('sophia')) return CHARACTER_ASSET_REGISTRY['VAC-QA-001'];

    return CHARACTER_ASSET_REGISTRY['VAC-ENG-001'];
  }

  /**
   * Returns all 5 character assets
   */
  static getAllCharacterAssets(): CharacterAssetMetadata[] {
    return Object.values(CHARACTER_ASSET_REGISTRY);
  }
}
