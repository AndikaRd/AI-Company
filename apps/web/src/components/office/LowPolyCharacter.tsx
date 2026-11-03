import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Employee, EmployeeActivityState, LifeBehaviorState } from '@vac/shared';
import { getCharacterStyle, LowPolyCharacterStyle } from './lowPolyCharacterConfig';
import { useOfficeStore } from '../../store/useOfficeStore';

interface LowPolyCharacterProps {
  employee: Employee;
  targetPosition: [number, number, number];
  targetRotationY?: number;
  behaviorState?: LifeBehaviorState | 'WORKING' | 'IDLE';
  activityState?: EmployeeActivityState;
  thought?: string | null;
  onSelect?: (employeeId: string) => void;
}

export const LowPolyCharacter: React.FC<LowPolyCharacterProps> = ({
  employee,
  targetPosition,
  targetRotationY = 0,
  behaviorState = 'IDLE',
  activityState = 'IDLE',
  thought,
  onSelect,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);

  const [isHovered, setIsHovered] = useState(false);
  const { selectedEmployeeId, focusPosition } = useOfficeStore();
  const isSelected = selectedEmployeeId === employee.id;

  const style: LowPolyCharacterStyle = useMemo(
    () => getCharacterStyle(employee.employeeCode, employee.firstName),
    [employee.employeeCode, employee.firstName],
  );

  // Position interpolation vector
  const currentPos = useRef(new THREE.Vector3(...targetPosition));
  const targetPos = useMemo(() => new THREE.Vector3(...targetPosition), [targetPosition]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // 1. Smoothly interpolate world position towards authoritative backend target
    const distToTarget = currentPos.current.distanceTo(targetPos);
    const isMoving = distToTarget > 0.08 || behaviorState === 'WALKING' || behaviorState === 'RETURNING_TO_DESK';

    if (distToTarget > 0.01) {
      currentPos.current.lerp(targetPos, Math.min(delta * 4, 0.2));
      groupRef.current.position.copy(currentPos.current);

      // Rotate towards movement direction when moving
      const dx = targetPos.x - currentPos.current.x;
      const dz = targetPos.z - currentPos.current.z;
      if (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.02) {
        const moveAngle = Math.atan2(dx, dz);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, moveAngle, 0.15);
      }
    } else {
      // Settle at target rotation when stationary
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.1);
    }

    // 2. Behavioral Animation State Machine
    const isSeated =
      behaviorState === 'WORKING' ||
      behaviorState === 'RESTING' ||
      behaviorState === 'ATTENDING_MEETING' ||
      activityState === 'WORKING';

    if (isMoving) {
      // WALKING STRIDE
      const walkFreq = 9;
      const legAngle = Math.sin(t * walkFreq) * 0.45;
      const armAngle = Math.cos(t * walkFreq) * 0.35;
      const bob = Math.abs(Math.sin(t * walkFreq)) * 0.05;

      if (leftLegRef.current) leftLegRef.current.rotation.x = legAngle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legAngle;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armAngle;
      if (rightArmRef.current) rightArmRef.current.rotation.x = armAngle;
      if (torsoRef.current) {
        torsoRef.current.position.y = 0.65 + bob;
        torsoRef.current.rotation.y = Math.sin(t * walkFreq) * 0.05;
      }
      if (headRef.current) headRef.current.rotation.x = 0;
    } else if (behaviorState === 'DRINKING') {
      // DRINKING AT WATER DISPENSER / COFFEE BAR
      if (torsoRef.current) torsoRef.current.position.y = 0.65;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0.1;
      // Right arm raises mug to mouth
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -1.2 + Math.sin(t * 2) * 0.15;
        rightArmRef.current.rotation.z = -0.3;
      }
      if (headRef.current) headRef.current.rotation.x = -0.15 + Math.sin(t * 2) * 0.05;
    } else if (behaviorState === 'EATING') {
      // EATING AT PANTRY / CAFETERIA
      if (torsoRef.current) torsoRef.current.position.y = 0.65;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.3 + Math.sin(t * 3) * 0.1;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.8 + Math.sin(t * 3) * 0.2;
      if (headRef.current) headRef.current.rotation.x = Math.sin(t * 3) * 0.08;
    } else if (behaviorState === 'RESTING') {
      // RESTING IN LOUNGE SOFA
      if (torsoRef.current) {
        torsoRef.current.position.y = 0.42; // Seated lower in sofa
        torsoRef.current.rotation.x = -0.15; // Lean back comfortably
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.PI / 2.3;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.PI / 2.3;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.2;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.2;
      if (headRef.current) headRef.current.rotation.x = -0.15 + Math.sin(t * 1.5) * 0.02;
    } else if (isSeated) {
      // SEATED WORKING / AT DESK / MEETING
      if (torsoRef.current) {
        torsoRef.current.position.y = 0.48; // Seated on office chair
        torsoRef.current.rotation.x = 0.05; // Slight forward focus
      }
      // Legs bent forward in seated posture
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.PI / 2.2;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.PI / 2.2;

      // Arms positioned forward at keyboard with typing animation
      const typeSpeed = 8;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -1.1 + Math.sin(t * typeSpeed) * 0.06;
        leftArmRef.current.rotation.y = 0.2;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -1.1 + Math.cos(t * typeSpeed + 1) * 0.06;
        rightArmRef.current.rotation.y = -0.2;
      }
      if (headRef.current) {
        headRef.current.rotation.x = 0.12 + Math.sin(t * 2) * 0.03;
      }
    } else if (behaviorState === 'SOCIALIZING' || activityState === 'TALKING') {
      // CONVERSING / TALKING
      if (torsoRef.current) torsoRef.current.position.y = 0.65;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.5 + Math.sin(t * 4) * 0.2;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.3 + Math.cos(t * 3) * 0.15;
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 3) * 0.15;
        headRef.current.rotation.x = Math.sin(t * 4) * 0.08;
      }
    } else {
      // NATURAL IDLE STANDING / BREATHING
      const breathe = Math.sin(t * 2) * 0.012;
      if (torsoRef.current) {
        torsoRef.current.position.y = 0.65 + breathe;
        torsoRef.current.rotation.x = 0;
        torsoRef.current.rotation.y = 0;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 1.5) * 0.05;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 1.5) * 0.05;
      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(t * 1.5) * 0.03;
        headRef.current.rotation.y = Math.sin(t * 0.8) * 0.05;
      }
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onSelect) onSelect(employee.id);
  };

  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    focusPosition([targetPosition[0], targetPosition[1], targetPosition[2]], employee.firstName);
  };

  return (
    <group
      ref={groupRef}
      position={targetPosition}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setIsHovered(true);
      }}
      onPointerOut={() => setIsHovered(false)}
    >
      {/* Selection Glow Cylinder Ring on Floor */}
      {(isSelected || isHovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.45, 24]} />
          <meshBasicMaterial
            color={isSelected ? '#10B981' : style.accentColor}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* --- TORSO & UPPER BODY --- */}
      <group ref={torsoRef} position={[0, 0.65, 0]}>
        {/* Main Torso Block */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.34, 0.42, 0.2]} />
          <meshStandardMaterial
            color={style.topColor}
            roughness={0.5}
            metalness={0.05}
          />
        </mesh>

        {/* Style-specific detailing */}
        {style.topStyle === 'hoodie' && (
          <>
            {/* Front Kangaroo Pocket for Alex Mercer's Hoodie */}
            <mesh position={[0, -0.09, 0.105]} castShadow>
              <boxGeometry args={[0.22, 0.12, 0.02]} />
              <meshStandardMaterial color={style.topColor} roughness={0.6} />
            </mesh>
            {/* Hoodie Collar Ring */}
            <mesh position={[0, 0.21, 0]}>
              <cylinderGeometry args={[0.12, 0.14, 0.05, 12]} />
              <meshStandardMaterial color={style.topColor} roughness={0.5} />
            </mesh>
          </>
        )}

        {style.topStyle === 'blazer' && (
          // Executive V-neck lapel inlay
          <mesh position={[0, 0.08, 0.102]}>
            <planeGeometry args={[0.12, 0.22]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        )}

        {style.topStyle === 'labcoat' && (
          // Scholar lab coat button seam
          <mesh position={[0, 0, 0.102]}>
            <planeGeometry args={[0.03, 0.38]} />
            <meshBasicMaterial color="#E2E8F0" />
          </mesh>
        )}

        {/* Company ID Card Badge */}
        <mesh position={[0.09, 0.1, 0.105]}>
          <boxGeometry args={[0.06, 0.09, 0.01]} />
          <meshStandardMaterial
            color={style.accessory === 'badge_gold' ? '#D97706' : '#FFFFFF'}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0.09, 0.1, 0.112]}>
          <planeGeometry args={[0.045, 0.025]} />
          <meshBasicMaterial color={style.accentColor} />
        </mesh>

        {/* --- HEAD & ACCESSORIES --- */}
        <group ref={headRef} position={[0, 0.32, 0]}>
          {/* Head Box */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.24, 0.24, 0.22]} />
            <meshStandardMaterial color={style.skinColor} roughness={0.7} />
          </mesh>

          {/* Minimalist Stylized Eyes */}
          <mesh position={[-0.05, 0.02, 0.112]}>
            <planeGeometry args={[0.03, 0.03]} />
            <meshBasicMaterial color="#1E293B" />
          </mesh>
          <mesh position={[0.05, 0.02, 0.112]}>
            <planeGeometry args={[0.03, 0.03]} />
            <meshBasicMaterial color="#1E293B" />
          </mesh>

          {/* Stylized Hair */}
          <mesh position={[0, 0.08, -0.02]} castShadow>
            <boxGeometry args={[0.26, 0.14, 0.24]} />
            <meshStandardMaterial color={style.hairColor} roughness={0.8} />
          </mesh>

          {style.hairStyle === 'swept' && (
            // Swept front fringe
            <mesh position={[0, 0.12, 0.06]}>
              <boxGeometry args={[0.22, 0.06, 0.12]} />
              <meshStandardMaterial color={style.hairColor} roughness={0.8} />
            </mesh>
          )}

          {style.hairStyle === 'bun' && (
            // Top bun for Dr. Maya Patel
            <mesh position={[0, 0.18, -0.06]} castShadow>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshStandardMaterial color={style.hairColor} roughness={0.8} />
            </mesh>
          )}

          {style.hairStyle === 'ponytail' && (
            // High ponytail for Sophia Lin
            <group position={[0, 0.06, -0.14]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.035, 0.02, 0.16, 8]} />
                <meshStandardMaterial color={style.hairColor} roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.08, 0]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshBasicMaterial color={style.accentColor} />
              </mesh>
            </group>
          )}

          {/* Specific Accessory: Wireless Headset for Alex Mercer */}
          {style.accessory === 'headset' && (
            <group position={[0, 0, 0]}>
              {/* Headband */}
              <mesh position={[0, 0.14, 0]}>
                <cylinderGeometry args={[0.13, 0.13, 0.03, 12, 1, true, -Math.PI / 2, Math.PI]} />
                <meshStandardMaterial color="#06B6D4" metalness={0.6} roughness={0.2} />
              </mesh>
              {/* Left & Right Ear Cushions */}
              <mesh position={[-0.13, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
                <meshStandardMaterial color="#0891B2" metalness={0.5} roughness={0.3} />
              </mesh>
              <mesh position={[0.13, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
                <meshStandardMaterial color="#0891B2" metalness={0.5} roughness={0.3} />
              </mesh>
            </group>
          )}

          {/* Glasses for Marcus & Maya */}
          {style.accessory === 'glasses' && (
            <group position={[0, 0.02, 0.12]}>
              <mesh position={[-0.05, 0, 0]}>
                <ringGeometry args={[0.03, 0.04, 12]} />
                <meshBasicMaterial color="#0F172A" />
              </mesh>
              <mesh position={[0.05, 0, 0]}>
                <ringGeometry args={[0.03, 0.04, 12]} />
                <meshBasicMaterial color="#0F172A" />
              </mesh>
              <mesh position={[0, 0.01, 0]}>
                <planeGeometry args={[0.03, 0.01]} />
                <meshBasicMaterial color="#0F172A" />
              </mesh>
            </group>
          )}
        </group>

        {/* --- LEFT & RIGHT ARMS --- */}
        <group ref={leftArmRef} position={[-0.21, 0.12, 0]}>
          <mesh castShadow position={[0, -0.16, 0]}>
            <boxGeometry args={[0.08, 0.32, 0.09]} />
            <meshStandardMaterial color={style.topColor} roughness={0.5} />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.34, 0]}>
            <boxGeometry args={[0.065, 0.08, 0.07]} />
            <meshStandardMaterial color={style.skinColor} roughness={0.7} />
          </mesh>
        </group>

        <group ref={rightArmRef} position={[0.21, 0.12, 0]}>
          <mesh castShadow position={[0, -0.16, 0]}>
            <boxGeometry args={[0.08, 0.32, 0.09]} />
            <meshStandardMaterial color={style.topColor} roughness={0.5} />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.34, 0]}>
            <boxGeometry args={[0.065, 0.08, 0.07]} />
            <meshStandardMaterial color={style.skinColor} roughness={0.7} />
          </mesh>
          {/* Tablet accessory for Sophia Lin */}
          {style.accessory === 'tablet' && (
            <mesh position={[0.02, -0.34, 0.06]} rotation={[0.4, 0, 0]}>
              <boxGeometry args={[0.12, 0.16, 0.015]} />
              <meshStandardMaterial color="#0F172A" metalness={0.5} />
            </mesh>
          )}
        </group>
      </group>

      {/* --- LEGS & SNEAKERS --- */}
      <group ref={leftLegRef} position={[-0.09, 0.42, 0]}>
        <mesh castShadow position={[0, -0.18, 0]}>
          <boxGeometry args={[0.11, 0.36, 0.12]} />
          <meshStandardMaterial color={style.bottomColor} roughness={0.6} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.38, 0.03]} castShadow>
          <boxGeometry args={[0.11, 0.07, 0.18]} />
          <meshStandardMaterial color={style.shoesColor} roughness={0.4} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.09, 0.42, 0]}>
        <mesh castShadow position={[0, -0.18, 0]}>
          <boxGeometry args={[0.11, 0.36, 0.12]} />
          <meshStandardMaterial color={style.bottomColor} roughness={0.6} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.38, 0.03]} castShadow>
          <boxGeometry args={[0.11, 0.07, 0.18]} />
          <meshStandardMaterial color={style.shoesColor} roughness={0.4} />
        </mesh>
      </group>

      {/* --- FLOATING 3D HTML HUD (NAME, BEHAVIOR BADGE & THOUGHT BUBBLE) --- */}
      <Html
        position={[0, 1.45, 0]}
        center
        distanceFactor={18}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex flex-col items-center select-none pointer-events-auto">
          {/* Live Thought Bubble if thinking or on break */}
          {thought && (
            <div className="mb-1 px-2.5 py-1 max-w-[180px] bg-white/95 text-slate-800 text-[10px] leading-tight font-medium rounded-lg shadow-md border border-slate-200/90 text-center animate-fade-in backdrop-blur-sm">
              <span className="line-clamp-2">"{thought}"</span>
              <div className="w-1.5 h-1.5 bg-white border-r border-b border-slate-200 rotate-45 mx-auto -mb-1 mt-0.5" />
            </div>
          )}

          {/* Employee Name Tag & Department Badge */}
          <div
            onClick={handleClick}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full shadow-sm text-[11px] font-semibold tracking-wide transition-all cursor-pointer ${
              isSelected
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 ring-offset-1'
                : isHovered
                ? 'bg-slate-900 text-white scale-105'
                : 'bg-white/90 text-slate-800 border border-slate-200/80'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: style.accentColor }}
            />
            <span>{employee.firstName} {employee.lastName[0]}.</span>
            <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-black/10 font-bold">
              {behaviorState}
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
};
