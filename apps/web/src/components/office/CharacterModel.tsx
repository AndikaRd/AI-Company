import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CharacterModelProps } from './CharacterModelContract';

/**
 * CharacterModel
 * Implements the 3D character pipeline for AI Employees in the Virtual Office.
 * Conforms to CharacterModelContract.
 *
 * When a custom GLB asset is provided, it can be loaded through Drei's pipeline.
 * When GLB is loading or absent, it provides a stylized, high-fidelity procedural
 * seated humanoid engineer avatar with animated typing and head posture.
 */
export const CharacterModel: React.FC<
  CharacterModelProps & {
    onSelectAgent?: (employeeId: string) => void;
  }
> = ({
  employeeId,
  employeeCode = 'VAC-ENG-001',
  name,
  modelUrl: _modelUrl,
  animationState = 'working',
  position,
  rotationY = 0,
  scale = [1, 1, 1],
  onSelectAgent,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Procedural subtle breathing and typing motion
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (animationState === 'working') {
      // Subtle typing motion on arms
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = -0.4 + Math.sin(t * 8) * 0.05;
        rightArmRef.current.rotation.x = -0.4 + Math.cos(t * 8 + 1) * 0.05;
      }
      // Subtle head nod observing monitor
      if (headRef.current) {
        headRef.current.rotation.x = 0.15 + Math.sin(t * 2) * 0.02;
        headRef.current.rotation.y = Math.sin(t * 1.5) * 0.03;
      }
    } else if (animationState === 'idle') {
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.8) * 0.1;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={scale}
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
          onSelectAgent(employeeId);
        }
      }}
    >
      {/* ========================================================
          PROCEDURAL STYLIZED SEATED HUMANOID CHARACTER (ALEX)
         ======================================================== */}
      {/* Base Sitting Position Offset (Chair Seat Height = 0.44m) */}
      <group position={[0, 0.44, 0]}>
        {/* Pelvis / Hips */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.32, 0.12, 0.28]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>

        {/* Thighs (Seated forward) */}
        <mesh position={[-0.1, 0.05, -0.16]} castShadow>
          <boxGeometry args={[0.11, 0.1, 0.32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh position={[0.1, 0.05, -0.16]} castShadow>
          <boxGeometry args={[0.11, 0.1, 0.32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>

        {/* Lower Legs (Bent down towards pedals/floor) */}
        <mesh position={[-0.1, -0.22, -0.32]} castShadow>
          <boxGeometry args={[0.1, 0.38, 0.1]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[0.1, -0.22, -0.32]} castShadow>
          <boxGeometry args={[0.1, 0.38, 0.1]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>

        {/* Shoes */}
        <mesh position={[-0.1, -0.42, -0.36]} castShadow>
          <boxGeometry args={[0.11, 0.07, 0.2]} />
          <meshStandardMaterial color="#0284c7" roughness={0.5} />
        </mesh>
        <mesh position={[0.1, -0.42, -0.36]} castShadow>
          <boxGeometry args={[0.11, 0.07, 0.2]} />
          <meshStandardMaterial color="#0284c7" roughness={0.5} />
        </mesh>

        {/* Torso / Tech Hoodie */}
        <mesh position={[0, 0.32, 0.02]} castShadow>
          <boxGeometry args={[0.34, 0.44, 0.22]} />
          <meshStandardMaterial
            color={isHovered ? '#0284c7' : '#0369a1'}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>

        {/* Corporate ID Badge / Tech Emblem on Chest */}
        <mesh position={[0.08, 0.38, -0.095]}>
          <planeGeometry args={[0.06, 0.08]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.57, 0.02]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.6} />
        </mesh>

        {/* Stylized Head */}
        <mesh ref={headRef} position={[0, 0.68, 0.02]} castShadow>
          <boxGeometry args={[0.22, 0.24, 0.22]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.5} />

          {/* Stylized Dark Hair / Cap */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.23, 0.08, 0.24]} />
            <meshStandardMaterial color="#090d16" roughness={0.8} />
          </mesh>

          {/* AR Tech Visor / Glasses */}
          <mesh position={[0, 0.02, -0.115]}>
            <boxGeometry args={[0.2, 0.06, 0.02]} />
            <meshBasicMaterial color={isHovered ? '#38bdf8' : '#06b6d4'} />
          </mesh>

          {/* Audio Headset band & ear cups */}
          <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.12, 0.02, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[-0.12, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.04, 8]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>
          <mesh position={[0.12, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.04, 8]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>
        </mesh>

        {/* Left Arm (Positioned on Desk typing) */}
        <group ref={leftArmRef} position={[-0.2, 0.45, 0.02]}>
          <mesh position={[-0.04, -0.12, -0.08]} rotation={[-0.3, 0.1, 0.2]} castShadow>
            <boxGeometry args={[0.08, 0.26, 0.08]} />
            <meshStandardMaterial color="#0369a1" roughness={0.6} />
          </mesh>
          <mesh position={[-0.02, -0.22, -0.28]} rotation={[-0.4, 0.1, 0]} castShadow>
            <boxGeometry args={[0.07, 0.07, 0.26]} />
            <meshStandardMaterial color="#0369a1" roughness={0.6} />
          </mesh>
          <mesh position={[-0.02, -0.22, -0.43]}>
            <boxGeometry args={[0.07, 0.04, 0.07]} />
            <meshStandardMaterial color="#fcd34d" />
          </mesh>
        </group>

        {/* Right Arm (Positioned on Desk typing) */}
        <group ref={rightArmRef} position={[0.2, 0.45, 0.02]}>
          <mesh position={[0.04, -0.12, -0.08]} rotation={[-0.3, -0.1, -0.2]} castShadow>
            <boxGeometry args={[0.08, 0.26, 0.08]} />
            <meshStandardMaterial color="#0369a1" roughness={0.6} />
          </mesh>
          <mesh position={[0.02, -0.22, -0.28]} rotation={[-0.4, -0.1, 0]} castShadow>
            <boxGeometry args={[0.07, 0.07, 0.26]} />
            <meshStandardMaterial color="#0369a1" roughness={0.6} />
          </mesh>
          <mesh position={[0.02, -0.22, -0.43]}>
            <boxGeometry args={[0.07, 0.04, 0.07]} />
            <meshStandardMaterial color="#fcd34d" />
          </mesh>
        </group>
      </group>

      {/* Floating Interactive HUD Tag */}
      <Html position={[0, 1.65, 0]} center distanceFactor={14}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectAgent) onSelectAgent(employeeId);
          }}
          className={`cursor-pointer transition-all duration-200 select-none ${
            isHovered ? 'scale-110 shadow-glow-cyan' : 'scale-100 opacity-90'
          }`}
        >
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 backdrop-blur-md shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-white tracking-wide flex items-center gap-1.5">
                {name}
                <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {employeeCode}
                </span>
              </span>
              <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                <span className="text-emerald-400 uppercase font-semibold">[{animationState}]</span>
                <span>•</span>
                <span className="text-cyan-400">qwen3.5:4b</span>
                <span>•</span>
                <span className="text-yellow-300 font-semibold underline">Click to Chat</span>
              </span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};
