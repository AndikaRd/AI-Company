import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';
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

  // 2. Load GLB via Drei's pipeline
  const { scene, animations } = useGLTF(asset.glbUrl);
  const { actions, names } = useAnimations(animations, groupRef);

  // 3. Clone scene to allow multiple independent character instances if needed
  const clonedScene = React.useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  // 4. Handle Skeletal Clip Transitions
  useEffect(() => {
    if (!actions || names.length === 0) return;

    // Determine target clip based on animation mapping
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

  // 5. Procedural Secondary Animation (Breathing, Typing, Head Tilt, Talk nod)
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Seated Desk Interaction Motion
    if (animationState === 'working') {
      // Subtle typing vibration / monitor observation
      groupRef.current.position.y = position[1] + Math.sin(t * 7) * 0.005;
      groupRef.current.rotation.x = Math.sin(t * 2) * 0.02;
    } else if (animationState === 'thinking') {
      // Pensive slight head tilt
      groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.03;
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.008;
    } else if (animationState === 'talking') {
      // Expressive conversational nodding
      groupRef.current.rotation.x = Math.sin(t * 5) * 0.04;
      groupRef.current.rotation.y = rotationY + Math.sin(t * 2) * 0.05;
    } else {
      // Idle natural breathing cycle
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.006;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.z = 0;
    }
  });

  const getActivityColor = () => {
    switch (activityState) {
      case 'WORKING':
        return 'border-cyan-500 text-cyan-300 bg-cyan-950/90 shadow-cyan-500/20';
      case 'THINKING':
        return 'border-purple-500 text-purple-300 bg-purple-950/90 shadow-purple-500/20';
      case 'TALKING':
        return 'border-emerald-500 text-emerald-300 bg-emerald-950/90 shadow-emerald-500/20';
      case 'WAITING_APPROVAL':
        return 'border-amber-500 text-amber-300 bg-amber-950/90 shadow-amber-500/20';
      case 'IDLE':
      default:
        return 'border-slate-600 text-slate-300 bg-slate-900/90';
    }
  };

  const getActivityDot = () => {
    switch (activityState) {
      case 'WORKING':
        return 'bg-cyan-400 animate-pulse';
      case 'THINKING':
        return 'bg-purple-400 animate-pulse';
      case 'TALKING':
        return 'bg-emerald-400 animate-pulse';
      case 'WAITING_APPROVAL':
        return 'bg-amber-400 animate-ping';
      default:
        return 'bg-slate-400';
    }
  };

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

      {/* Floating Interactive HUD Tag */}
      <Html position={[0, 1.85, 0]} center distanceFactor={14}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectAgent) onSelectAgent(employee.id);
          }}
          className={`cursor-pointer transition-all duration-200 select-none ${
            isHovered ? 'scale-110 shadow-2xl' : 'scale-100 opacity-95'
          }`}
        >
          <div
            className={`px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-xl flex items-center gap-2 transition-all ${getActivityColor()}`}
          >
            <span className={`w-2 h-2 rounded-full ${getActivityDot()}`} />
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-white tracking-wide flex items-center gap-1.5 whitespace-nowrap">
                {employee.firstName} {employee.lastName}
                <span className="text-[9px] font-mono px-1 rounded bg-black/40 text-slate-300 border border-slate-700">
                  {employee.employeeCode}
                </span>
              </span>
              <span className="text-[9px] font-mono flex items-center gap-1">
                <span className="uppercase font-semibold tracking-wider">[{activityState}]</span>
                <span>•</span>
                <span className="text-slate-400 truncate max-w-[120px]">
                  {taskTitle || employee.role}
                </span>
              </span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};
