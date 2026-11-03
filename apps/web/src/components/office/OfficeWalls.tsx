import React from 'react';

export const OfficeWalls: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* --- EXTERIOR ARCHITECTURAL BACK WALLS (WARM WHITE & CREAM) --- */}
      {/* North Wall (Back) */}
      <mesh position={[0, 1.8, -15]} receiveShadow castShadow>
        <boxGeometry args={[30.4, 3.6, 0.4]} />
        <meshStandardMaterial
          color="#FFFFFF" // Warm White Wall
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* North Wall Natural Wood Baseboard */}
      <mesh position={[0, 0.12, -14.78]}>
        <boxGeometry args={[30.4, 0.24, 0.05]} />
        <meshStandardMaterial color="#DCC6A5" roughness={0.5} />
      </mesh>

      {/* West Wall (Left) */}
      <mesh position={[-15, 1.8, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 3.6, 30.4]} />
        <meshStandardMaterial
          color="#F4EBDD" // Warm Cream Architectural Surface
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* West Wall Natural Wood Baseboard */}
      <mesh position={[-14.78, 0.12, 0]}>
        <boxGeometry args={[0.05, 0.24, 30.4]} />
        <meshStandardMaterial color="#DCC6A5" roughness={0.5} />
      </mesh>

      {/* Large Floor-to-Ceiling Corporate Windows on North Wall */}
      <group position={[0, 2.1, -14.78]}>
        {/* Sunny Daylight Sky Backdrop */}
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[26, 1.8]} />
          <meshBasicMaterial color="#E0F2FE" />
        </mesh>
        {/* Clear Insulated Window Panes */}
        <mesh>
          <boxGeometry args={[26, 1.8, 0.04]} />
          <meshStandardMaterial
            color="#BAE6FD"
            roughness={0.05}
            metalness={0.15}
            transparent
            opacity={0.35}
          />
        </mesh>
        {/* Clean White Window Mullions / Frames */}
        {[-10, -5, 0, 5, 10].map((xOff, idx) => (
          <mesh key={`mullion-${idx}`} position={[xOff, 0, 0.03]}>
            <boxGeometry args={[0.1, 1.85, 0.06]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* --- MODERN NATURAL WOOD & FROSTED GLASS INTERIOR DIVIDERS --- */}
      {/* Technology / Engineering Low Partition */}
      <group position={[-4, 0.5, -8]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 1.0, 5.8]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.04, 0.25, 5.8]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.15}
            transparent
            opacity={0.55}
          />
        </mesh>
      </group>

      {/* Engineering / Research Low Partition */}
      <group position={[4, 0.5, -8]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 1.0, 5.8]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.04, 0.25, 5.8]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.15} transparent opacity={0.55} />
        </mesh>
      </group>

      {/* Operations / QA Low Partition */}
      <group position={[-4, 0.5, 8]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 1.0, 5.8]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.04, 0.25, 5.8]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.15} transparent opacity={0.55} />
        </mesh>
      </group>

      {/* Executive Conference Room Glass Wall with Natural Wood Door Frame */}
      <group position={[8, 1.25, 4]}>
        {/* Clear Glass Wall */}
        <mesh castShadow>
          <boxGeometry args={[6.2, 2.5, 0.05]} />
          <meshStandardMaterial
            color="#E0F2FE"
            roughness={0.08}
            metalness={0.1}
            transparent
            opacity={0.3}
          />
        </mesh>
        {/* Natural Wood Top & Bottom Transom Frames */}
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[6.3, 0.08, 0.08]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.5} />
        </mesh>
        <mesh position={[0, -1.25, 0]}>
          <boxGeometry args={[6.3, 0.08, 0.08]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.5} />
        </mesh>
      </group>

      {/* Architectural Pillars (Soft Off-White Round Columns with Natural Wood Base) */}
      {[
        [-4, 1.8, -4],
        [4, 1.8, -4],
        [-4, 1.8, 4],
        [4, 1.8, 4],
      ].map(([px, py, pz], idx) => (
        <group key={`col-${idx}`} position={[px, py, pz]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.3, 0.3, 3.6, 24]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
          </mesh>
          <mesh position={[0, -1.7, 0]}>
            <cylinderGeometry args={[0.36, 0.38, 0.2, 24]} />
            <meshStandardMaterial color="#DCC6A5" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
