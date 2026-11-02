import React from 'react';
import { Html } from '@react-three/drei';

interface CharacterAnchorProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  departmentSlug: string;
  slotIndex: number;
  assignedAgentName?: string | null;
}

/**
 * CharacterAnchor
 * Defines designated 3D spawn and sitting coordinates where GLB Agent character models
 * will be instantiated and mounted during upcoming sprints.
 */
export const CharacterAnchor: React.FC<CharacterAnchorProps> = ({
  position,
  rotation = [0, 0, 0],
  departmentSlug,
  slotIndex,
  assignedAgentName = null,
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Visual docking ring on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.3, 0.36, 16]} />
        <meshBasicMaterial
          color="#06b6d4"
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Subtle holographic anchor pillar */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 8]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Future GLB Mount Indicator */}
      {assignedAgentName ? (
        <Html position={[0, 1.2, 0]} center distanceFactor={15}>
          <div className="px-2 py-0.5 rounded bg-surface/90 border border-cyan-500/40 text-[10px] text-cyan-300 font-mono whitespace-nowrap shadow-md pointer-events-none">
            {assignedAgentName}
          </div>
        </Html>
      ) : (
        <Html position={[0, 0.7, 0]} center distanceFactor={18}>
          <div className="opacity-0 hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-[9px] text-slate-400 font-mono whitespace-nowrap pointer-events-none">
            Anchor: {departmentSlug}-{slotIndex} (Ready for GLB)
          </div>
        </Html>
      )}
    </group>
  );
};
