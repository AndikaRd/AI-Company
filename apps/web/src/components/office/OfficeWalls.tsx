import React from 'react';

export const OfficeWalls: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* --- EXTERIOR ARCHITECTURAL BACK WALLS --- */}
      {/* North Wall (Back) */}
      <mesh position={[0, 1.8, -15]} receiveShadow castShadow>
        <boxGeometry args={[30.4, 3.6, 0.4]} />
        <meshStandardMaterial
          color="#0d1424"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* West Wall (Left) */}
      <mesh position={[-15, 1.8, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 3.6, 30.4]} />
        <meshStandardMaterial
          color="#0d1424"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Modern Horizontal Glass Ribbon / Window Inset on North Wall */}
      <mesh position={[0, 2.2, -14.78]}>
        <boxGeometry args={[26, 1.2, 0.05]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* --- LOW INTERIOR ROOM PARTITIONS & GLASS DIVIDERS --- */}
      {/* Technology / Engineering Divider */}
      <mesh position={[-4, 0.6, -8]} castShadow>
        <boxGeometry args={[0.1, 1.2, 6]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.3}
          metalness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Engineering / Research Divider */}
      <mesh position={[4, 0.6, -8]} castShadow>
        <boxGeometry args={[0.1, 1.2, 6]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.3}
          metalness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Operations / QA Divider */}
      <mesh position={[-4, 0.6, 8]} castShadow>
        <boxGeometry args={[0.1, 1.2, 6]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.3}
          metalness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* QA / Administration Divider */}
      <mesh position={[4, 0.6, 8]} castShadow>
        <boxGeometry args={[0.1, 1.2, 6]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.3}
          metalness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Executive Suite Frosted Glass Enclosure (Administration) */}
      <mesh position={[8, 1.2, 4]} castShadow>
        <boxGeometry args={[6, 2.4, 0.08]} />
        <meshStandardMaterial
          color="#818cf8"
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Central Architectural Columns (Structural Pillars) */}
      {[
        [-5, 1.8, -5],
        [5, 1.8, -5],
        [-5, 1.8, 5],
        [5, 1.8, 5],
      ].map(([x, y, z], idx) => (
        <group key={`column-${idx}`} position={[x, y, z]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.25, 0.25, 3.6, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Base Trim Ring */}
          <mesh position={[0, -1.75, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.1, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

