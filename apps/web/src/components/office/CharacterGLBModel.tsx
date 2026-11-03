import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CharacterAssetsService } from '../../services/character-assets.service';
import { Employee, CharacterAnimationState, EmployeeActivityState } from '@vac/shared';

interface CharacterGLBModelProps {
  employee: Employee;
  position: [number, number, number];
  rotationY?: number;
  animationState?: CharacterAnimationState;
  activityState?: EmployeeActivityState;
  taskTitle?: string | null;
  onSelectAgent?: (employeeId: string) => void;
}

export const CharacterGLBModel: React.FC<CharacterGLBModelProps> = ({
  employee,
  position,
  rotationY = Math.PI,
  animationState = 'working',
  activityState = 'IDLE',
  taskTitle,
  onSelectAgent,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 1. Resolve character asset metadata from registry
  const asset = CharacterAssetsService.getAssetForEmployee(employee);

  // 2. Load GLB via Drei's pipeline with local Draco decoder support
  const { scene, animations } = useGLTF(asset.glbUrl, '/draco/');
  const { actions, names } = useAnimations(animations, groupRef);

  // 3. Clone scene using SkeletonUtils to properly preserve skinned meshes and bone bindings
  const clonedScene = React.useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    const isAlex = employee.employeeCode === 'VAC-ENG-001' || asset.slug === 'alex-mercer';

    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (isAlex) {
          // Runtime visual customization for Alex Mercer
          if (child.name === 'vanguard_visor') {
            child.material = new THREE.MeshStandardMaterial({
              color: '#06b6d4',
              emissive: '#0891b2',
              emissiveIntensity: 0.25,
              roughness: 0.3,
              metalness: 0.6,
            });
          } else if (child.name === 'vanguard_Mesh') {
            // Apply navy blue palette tint to match canonical tech hoodie
            const mat = child.material.clone();
            mat.color = new THREE.Color('#1e3a8a');
            mat.roughness = 0.6;
            child.material = mat;
          }
        }
      }
    });
    return clone;
  }, [scene, employee, asset]);

  // 4. Handle Skeletal Clip Transitions
  useEffect(() => {
    if (!actions || names.length === 0) return;

    let targetClipName: string | undefined;
    const upperKey = animationState.toUpperCase();
    const mapping = asset.animationMapping[upperKey];

    if (mapping && mapping.type === 'clip' && mapping.clipName && actions[mapping.clipName]) {
      targetClipName = mapping.clipName;
    } else if (actions['idle'] || actions['Idle']) {
      targetClipName = actions['idle'] ? 'idle' : 'Idle';
    }

    if (targetClipName) {
      const action = actions[targetClipName];
      if (action) {
        action.reset().fadeIn(0.3).play();

        return () => {
          action.fadeOut(0.3);
        };
      }
    }
  }, [actions, names, animationState, asset]);

  // 5. Procedural Secondary Animation
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (animationState === 'working') {
      groupRef.current.position.y = position[1] + Math.sin(t * 7) * 0.005;
      groupRef.current.rotation.x = Math.sin(t * 2) * 0.02;
    } else if (animationState === 'thinking') {
      groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.03;
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.008;
    } else if (animationState === 'talking') {
      groupRef.current.rotation.x = Math.sin(t * 5) * 0.04;
      groupRef.current.rotation.y = rotationY + Math.sin(t * 2) * 0.05;
    } else {
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.006;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.z = 0;
    }
  });

  const getActivityBadge = () => {
    switch (activityState) {
      case 'WORKING':
        return {
          label: 'Working',
          pill: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500 animate-pulse',
        };
      case 'THINKING':
        return {
          label: 'Thinking',
          pill: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-500 animate-pulse',
        };
      case 'TALKING':
        return {
          label: 'Discussing',
          pill: 'bg-cyan-50 text-cyan-800 border-cyan-200',
          dot: 'bg-cyan-500',
        };
      case 'WAITING_APPROVAL':
        return {
          label: 'Review Needed',
          pill: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500 animate-ping',
        };
      case 'IDLE':
      default:
        return {
          label: 'Available',
          pill: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const activityBadge = getActivityBadge();

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={asset.scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        setIsHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setIsHovered(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelectAgent) {
          onSelectAgent(employee.id);
        }
      }}
    >
      {/* 3D Rigged Humanoid GLB Asset */}
      <primitive object={clonedScene} />

      {/* Alex Mercer Stylized Accessories */}
      {(employee.employeeCode === 'VAC-ENG-001' || asset.slug === 'alex-mercer') && (
        <group position={[0, 0, 0]}>
          <group position={[0, 1.62, 0]}>
            <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.12, 0.015, 8, 16, Math.PI]} />
              <meshStandardMaterial color="#334155" metalness={0.9} />
            </mesh>
            <mesh position={[-0.12, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.03, 8]} />
              <meshStandardMaterial color="#0284c7" />
            </mesh>
            <mesh position={[0.12, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.03, 8]} />
              <meshStandardMaterial color="#0284c7" />
            </mesh>
          </group>
          <mesh position={[0.08, 1.25, 0.14]} rotation={[0, 0, -0.05]}>
            <boxGeometry args={[0.06, 0.08, 0.005]} />
            <meshStandardMaterial color="#38bdf8" />
          </mesh>
        </group>
      )}

      {/* Clean, Bright Floating HUD Card (Name, Role, Activity) */}
      <Html position={[0, 1.85, 0]} center distanceFactor={16} zIndexRange={[100, 50]}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectAgent) onSelectAgent(employee.id);
          }}
          className={`cursor-pointer transition-all duration-200 select-none ${
            isHovered ? 'scale-110 shadow-xl' : 'scale-100 opacity-95'
          }`}
        >
          <div className="px-3 py-1.5 rounded-xl bg-white/95 border border-amber-200/80 shadow-md backdrop-blur-md flex items-center gap-2.5 transition-all">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${activityBadge.dot}`} />
            <div className="flex flex-col text-left">
              <span className="text-[12px] font-bold text-slate-800 tracking-tight whitespace-nowrap leading-tight">
                {employee.firstName} {employee.lastName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">
                  {taskTitle || employee.jobTitle || employee.role}
                </span>
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${activityBadge.pill}`}
                >
                  {activityBadge.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};

// Preload all 5 employee GLB assets with local Draco decoder
useGLTF.preload('/assets/characters/elena-rostova/character.glb', '/draco/');
useGLTF.preload('/assets/characters/marcus-vance/character.glb', '/draco/');
useGLTF.preload('/assets/characters/alex-mercer/character.glb', '/draco/');
useGLTF.preload('/assets/characters/maya-patel/character.glb', '/draco/');
useGLTF.preload('/assets/characters/sophia-lin/character.glb', '/draco/');
