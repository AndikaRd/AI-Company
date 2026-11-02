import React, { Suspense } from 'react';
import { CharacterAnchor } from './CharacterAnchor';
import { CharacterModel } from './CharacterModel';
import { CharacterGLBModel } from './CharacterGLBModel';
import { useOfficeStore } from '../../store/useOfficeStore';
import { Employee } from '@vac/shared';

interface WorkstationProps {
  position: [number, number, number];
  rotationY?: number;
  screenColor?: string;
  departmentSlug: string;
  slotIndex: number;
  assignedAgent?: Employee | null;
  onSelectAgent?: (employeeId: string) => void;
}

export const Workstation: React.FC<WorkstationProps> = ({
  position,
  rotationY = 0,
  screenColor = '#38bdf8',
  departmentSlug,
  slotIndex,
  assignedAgent = null,
  onSelectAgent,
}) => {
  const { employeeActivities } = useOfficeStore();
  const activityInfo = assignedAgent ? employeeActivities[assignedAgent.id] : null;
  const activityState = activityInfo?.activity || 'IDLE';
  const animationState = activityInfo?.animationState || 'working';
  const taskTitle = activityInfo?.taskTitle || null;

  // Dynamic screen glow based on real-time activity
  let displayColor = screenColor;
  if (activityState === 'WORKING') displayColor = '#06b6d4';
  else if (activityState === 'THINKING') displayColor = '#a855f7';
  else if (activityState === 'WAITING_APPROVAL') displayColor = '#f59e0b';
  else if (activityState === 'TALKING') displayColor = '#10b981';

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* --- DESK SURFACE --- */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.05, 0.8]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Desk Legs (Metal frame) */}
      <mesh position={[-0.7, 0.35, 0]} castShadow>
        <boxGeometry args={[0.04, 0.7, 0.76]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.7, 0.35, 0]} castShadow>
        <boxGeometry args={[0.04, 0.7, 0.76]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* --- PRIMARY MONITOR --- */}
      {/* Monitor Stand */}
      <mesh position={[0, 0.82, -0.22]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.16, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.75, -0.22]}>
        <boxGeometry args={[0.2, 0.01, 0.16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>

      {/* Monitor Frame */}
      <mesh position={[0, 0.95, -0.22]} castShadow>
        <boxGeometry args={[0.8, 0.38, 0.02]} />
        <meshStandardMaterial color="#090d16" roughness={0.2} />
      </mesh>

      {/* Glowing Screen Display */}
      <mesh position={[0, 0.95, -0.205]}>
        <planeGeometry args={[0.76, 0.34]} />
        <meshBasicMaterial color={displayColor} />
      </mesh>

      {/* Subtle Screen Light Glow */}
      <pointLight
        position={[0, 0.95, -0.1]}
        color={displayColor}
        intensity={0.25}
        distance={1.5}
      />

      {/* --- KEYBOARD & MOUSE --- */}
      <mesh position={[0, 0.75, 0.1]}>
        <boxGeometry args={[0.42, 0.015, 0.14]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.3, 0.75, 0.1]}>
        <boxGeometry args={[0.08, 0.015, 0.12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* --- SWIVEL CHAIR --- */}
      <group position={[0, 0, 0.55]}>
        {/* Base Star Legs */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.04, 5]} />
          <meshStandardMaterial color="#090d16" metalness={0.8} />
        </mesh>
        {/* Chair Central Piston */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Seat Cushion */}
        <mesh position={[0, 0.44, 0]} castShadow>
          <boxGeometry args={[0.46, 0.08, 0.44]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {/* Chair Backrest */}
        <mesh position={[0, 0.72, 0.2]} castShadow>
          <boxGeometry args={[0.42, 0.5, 0.06]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </group>

      {/* Render Character GLB Model if an Agent is assigned to this workstation */}
      {assignedAgent ? (
        <Suspense
          fallback={
            <CharacterModel
              employeeId={assignedAgent.id}
              employeeCode={assignedAgent.employeeCode ?? undefined}
              name={`${assignedAgent.firstName} ${assignedAgent.lastName}`}
              modelUrl={assignedAgent.avatarUrl || '/assets/characters/alex.glb'}
              animationState={animationState}
              position={[0, 0, 0.55]}
              rotationY={Math.PI}
              onSelectAgent={onSelectAgent}
            />
          }
        >
          <CharacterGLBModel
            employee={assignedAgent}
            position={[0, 0, 0.55]}
            rotationY={Math.PI}
            animationState={animationState}
            activityState={activityState}
            taskTitle={taskTitle}
            onSelectAgent={onSelectAgent}
          />
        </Suspense>
      ) : (
        /* Anchor coordinates indicator for empty workstation */
        <CharacterAnchor
          position={[0, 0, 0.55]}
          departmentSlug={departmentSlug}
          slotIndex={slotIndex}
        />
      )}
    </group>
  );
};
