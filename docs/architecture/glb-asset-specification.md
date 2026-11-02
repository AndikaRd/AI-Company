# Virtual AI Company (VAC) — 3D GLB Character Asset Specification

## 1. Executive Summary

This document specifies the technical standards, rigging constraints, animation clips, and React Three Fiber integration pipeline for 3D character avatars representing AI Employees (such as Alex Mercer, Senior Software Engineer) in the Virtual AI Company isometric office.

The virtual office runtime utilizes Three.js, React Three Fiber (R3F), and `@react-three/drei`. Character instances are mounted at predefined workstation anchors (`CharacterAnchor`) with animation states controlled by agent activity.

---

## 2. Geometry & Mesh Specifications

| Property | Target Specification | Hard Limit | Rationale |
| :--- | :--- | :--- | :--- |
| **File Format** | Binary glTF (`.glb`) | `.glb` only | Optimized single-file packaging with embedded textures and animations. |
| **glTF Version** | 2.0 | 2.0 | Full native WebGL compatibility with Three.js `GLTFLoader`. |
| **Polygon Count** | 15,000 - 22,000 triangles | 30,000 triangles max | Ensures 60 FPS performance when multiple agents are active in the 3D office. |
| **Mesh Structure** | Single skinned mesh or skinned mesh with modular accessories (e.g. glasses, badge). | Max 4 draw calls per character | Minimize draw call overhead in WebGL renderer. |
| **Scale / Units** | 1 unit = 1.0 meter | Metric (1.70m - 1.85m height) | Matches office desks (0.75m height) and floor grid proportions. |
| **Pivot Origin** | Floor center between feet `(0, 0, 0)` | Exactly `(0, 0, 0)` | Ensures clean placement on `CharacterAnchor` floor rings. |

---

## 3. Rigging & Skeleton Standards

Characters must use a standard humanoid bipedal skeleton compatible with Mixamo and standard game engines.

### Standard Bone Hierarchy (Humanoid):
```
Hips (Root)
 ├── Spine
 │    └── Spine1
 │         └── Spine2
 │              ├── Neck
 │              │    └── Head
 │              ├── LeftShoulder
 │              │    └── LeftArm
 │              │         └── LeftForeArm
 │              │              └── LeftHand
 │              └── RightShoulder
 │                   └── RightArm
 │                        └── RightForeArm
 │                             └── RightHand
 ├── LeftUpLeg
 │    └── LeftLeg
 │         └── LeftFoot
 │              └── LeftToeBase
 └── RightUpLeg
      └── RightLeg
           └── RightFoot
                └── RightToeBase
```

### Rigging Rules:
1. Max 4 bone weights per vertex (GPU skinning standard).
2. T-pose or A-pose as rest pose at frame 0.
3. Clean humanoid proportions: Seated height on standard office chair (0.44m seat height) must align palms with keyboard surface at 0.75m.

---

## 4. Required Animation Clips

All animations must be embedded directly inside the `.glb` file using standard glTF animation channels.

The animation state contract is governed by `@vac/shared/CharacterAnimationState`:

```typescript
export type CharacterAnimationState =
  | 'idle'
  | 'walking'
  | 'working'
  | 'talking'
  | 'meeting';
```

| Clip Name | Description | Loop Type | Duration | Context |
| :--- | :--- | :--- | :--- | :--- |
| `idle` | Neutral standing or seated posture with subtle chest breathing and periodic head turns. | Looping | 3.0 - 4.0s | Default standby state when no tasks are executing. |
| `walking` | Natural humanoid forward locomotion cycle. In-place root motion (panning is handled by Three.js interpolator). | Looping | 1.0 - 1.2s | Waypoint pathing between departments or meeting rooms. |
| `working` | Seated typing on keyboard, hands over home row, occasional mouse movements, focused head gaze on screen. | Looping | 4.0 - 6.0s | Active code generation, API testing, or task execution. |
| `talking` | Expressive gestures with hands, nodding, collaborative posture. | Looping | 3.5 - 5.0s | Multi-agent dialogue, supervisor chat interaction. |
| `meeting` | Seated conference posture around meeting table, leaning forward slightly, taking notes. | Looping | 4.0 - 6.0s | Departmental sync, sprint planning sessions. |

---

## 5. Material & Texture Specifications

- **Workflow**: Metallic-Roughness PBR (Physically Based Rendering).
- **Texture Maps**:
  - `BaseColor` (sRGB) — 1024x1024 or 2048x2048 PNG/WebP
  - `MetallicRoughness` (Linear, Metalness in Blue channel, Roughness in Green channel) — 1024x1024
  - `Normal` (OpenGL format, +Y tangent space) — 1024x1024
  - `Emissive` (Optional, for tech visors, badges, LEDs) — 512x512
- **Compression**: Use Draco mesh compression or meshopt when packaging for production to keep file sizes under 2.5 MB.

---

## 6. React Three Fiber Integration Pipeline

### Component Implementation (`CharacterModel.tsx`):
```tsx
import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { CharacterAnimationState } from '@vac/shared';

interface CharacterProps {
  modelUrl: string;
  animationState: CharacterAnimationState;
  position: [number, number, number];
  rotationY?: number;
}

export const CharacterGLB: React.FC<CharacterProps> = ({
  modelUrl,
  animationState,
  position,
  rotationY = 0,
}) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelUrl);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Cross-fade to incoming animation state
    const currentAction = actions[animationState] || actions['idle'];
    if (currentAction) {
      currentAction.reset().fadeIn(0.3).play();
    }

    return () => {
      if (currentAction) {
        currentAction.fadeOut(0.3);
      }
    };
  }, [animationState, actions]);

  return (
    <group ref={group} position={position} rotation={[0, rotationY, 0]} dispose={null}>
      <primitive object={scene} />
    </group>
  );
};

// Pre-load character asset
useGLTF.preload('/assets/characters/alex.glb');
```

---

## 7. Storage and Directory Conventions

1. Character models are stored in:
   `apps/web/public/assets/characters/[employee-code].glb`
   Example:
   - `apps/web/public/assets/characters/alex.glb` (for Alex Mercer, `VAC-ENG-001`)
2. Database Mapping:
   The `avatarUrl` field in the `Employee` model in PostgreSQL stores the path:
   `/assets/characters/alex.glb`.
3. Fallback Mechanism:
   If the GLB file is missing or still being downloaded, the runtime seamlessly mounts the procedural stylized 3D avatar so the user experience is never broken.
