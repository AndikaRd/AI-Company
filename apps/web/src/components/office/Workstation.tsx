import React from 'react';
import { CharacterAnchor } from './CharacterAnchor';
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
  screenColor = '#66B8C5',
  departmentSlug,
  slotIndex,
  assignedAgent = null,
  onSelectAgent,
}) => {
  const { employeeActivities } = useOfficeStore();
  const activityInfo = assignedAgent ? employeeActivities[assignedAgent.id] : null;
  const activityState = activityInfo?.activity || 'IDLE';

  // Warm, pleasant screen display based on real-time activity
  let displayColor = screenColor;
  if (activityState === 'WORKING') displayColor = '#79AD78'; // Natural Green
  else if (activityState === 'THINKING') displayColor = '#A18BC7'; // Lavender
  else if (activityState === 'WAITING_APPROVAL') displayColor = '#E99A50'; // Warm Orange
  else if (activityState === 'TALKING') displayColor = '#66B8C5'; // Subtle Cyan

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        if (assignedAgent && onSelectAgent) {
          e.stopPropagation();
          onSelectAgent(assignedAgent.id);
        }
      }}
    >
      {/* --- DESK SURFACE (NATURAL WOOD #DCC6A5) --- */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.04, 0.8]} />
        <meshStandardMaterial
          color="#DCC6A5" // Natural Wood
          roughness={0.45}
          metalness={0.05}
        />
      </mesh>

      {/* Desk Metal Frame & Legs (Clean Warm White Steel) */}
      <mesh position={[-0.7, 0.35, 0]} castShadow>
        <boxGeometry args={[0.04, 0.7, 0.74]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[0.7, 0.35, 0]} castShadow>
        <boxGeometry args={[0.04, 0.7, 0.74]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.15} />
      </mesh>

      {/* Under-Desk Cable Tray & Privacy Modesty Panel (Warm Cream #F4EBDD) */}
      <mesh position={[0, 0.45, -0.34]}>
        <boxGeometry args={[1.36, 0.35, 0.02]} />
        <meshStandardMaterial color="#F4EBDD" roughness={0.6} />
      </mesh>

      {/* --- SLIM MODERN WHITE MONITOR --- */}
      {/* Monitor Stand */}
      <mesh position={[0, 0.82, -0.22]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.16, 8]} />
        <meshStandardMaterial color="#E5E1D8" metalness={0.5} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.745, -0.22]}>
        <boxGeometry args={[0.2, 0.01, 0.16]} />
        <meshStandardMaterial color="#E5E1D8" metalness={0.5} roughness={0.25} />
      </mesh>

      {/* Monitor Bezel Frame (Clean Warm White) */}
      <mesh position={[0, 0.95, -0.22]} castShadow>
        <boxGeometry args={[0.82, 0.4, 0.015]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
      </mesh>

      {/* Friendly Dashboard Screen Display */}
      <mesh position={[0, 0.95, -0.21]}>
        <planeGeometry args={[0.78, 0.36]} />
        <meshBasicMaterial color={displayColor} />
      </mesh>

      {/* --- DESK ACCESSORIES (KEYBOARD, MOUSE, COFFEE MUG, SUCCULENT) --- */}
      {/* Keyboard (Soft Warm White) */}
      <mesh position={[0, 0.745, 0.1]}>
        <boxGeometry args={[0.42, 0.012, 0.14]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      {/* Mouse Pad & Ergonomic Mouse */}
      <mesh position={[0.3, 0.743, 0.1]}>
        <boxGeometry args={[0.18, 0.005, 0.22]} />
        <meshStandardMaterial color="#E5E1D8" roughness={0.8} />
      </mesh>
      <mesh position={[0.3, 0.75, 0.1]}>
        <boxGeometry args={[0.06, 0.015, 0.1]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>

      {/* Ceramic Coffee Mug (Warm White) */}
      <mesh position={[-0.45, 0.78, 0.1]} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.08, 12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
      </mesh>

      {/* Small Desk Succulent / Mini Plant in Ceramic Pot */}
      <mesh position={[0.55, 0.76, -0.2]} castShadow>
        <cylinderGeometry args={[0.04, 0.03, 0.06, 10]} />
        <meshStandardMaterial color="#E5E1D8" roughness={0.7} />
      </mesh>
      <mesh position={[0.55, 0.81, -0.2]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#79AD78" roughness={0.8} />
      </mesh>

      {/* --- MODERN ERGONOMIC OFFICE CHAIR --- */}
      <group position={[0, 0, 0.55]}>
        {/* Base Star Legs (Silver/White) */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.04, 5]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Chair Central Piston */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.3, 8]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Seat Cushion (Soft Charcoal Fabric) */}
        <mesh position={[0, 0.44, 0]} castShadow>
          <boxGeometry args={[0.46, 0.08, 0.44]} />
          <meshStandardMaterial color="#454545" roughness={0.8} />
        </mesh>
        {/* Chair Backrest (Ergonomic Breathable Mesh) */}
        <mesh position={[0, 0.72, 0.2]} castShadow>
          <boxGeometry args={[0.42, 0.5, 0.04]} />
          <meshStandardMaterial color="#454545" roughness={0.7} />
        </mesh>
        {/* Clean White Chair Outer Shell */}
        <mesh position={[0, 0.72, 0.22]}>
          <boxGeometry args={[0.44, 0.52, 0.015]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>
      </group>

      {/* Workstation Anchor indicator when unoccupied */}
      {!assignedAgent && (
        <CharacterAnchor
          position={[0, 0, 0.55]}
          departmentSlug={departmentSlug}
          slotIndex={slotIndex}
        />
      )}
    </group>
  );
};
