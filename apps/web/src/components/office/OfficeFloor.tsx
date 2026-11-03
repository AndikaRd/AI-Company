import React from 'react';
import * as THREE from 'three';
import { useOfficeStore } from '../../store/useOfficeStore';
import { INITIAL_DEPARTMENTS } from '@vac/shared';

export const OfficeFloor: React.FC = () => {
  const { showGrid, hoveredZone, selectedZone, selectZone } = useOfficeStore();

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Soft Warm Sandstone Base Foundation Slab */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[32, 0.4, 32]} />
        <meshStandardMaterial
          color="#E5E1D8" // Soft Gray Foundation
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* 2. Main Office Natural Light Wood Flooring */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color="#DCC6A5" // Natural Wood Flooring
          roughness={0.45}
          metalness={0.05}
        />
      </mesh>

      {/* 3. Central Polished Warm Cream Circulation Walkways */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.2, 30]} />
        <meshStandardMaterial color="#F4EBDD" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 4.2]} />
        <meshStandardMaterial color="#F4EBDD" roughness={0.4} />
      </mesh>

      {/* 4. Central Welcome Atrium & Planter Bench Round Inlay */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.2, 32]} />
        <meshStandardMaterial color="#EDE3D5" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.0, 3.2, 32]} />
        <meshBasicMaterial color="#DCC6A5" />
      </mesh>

      {/* 5. Optional Subtle Guide Grid (Hidden by default for clean life-sim look) */}
      {showGrid && (
        <gridHelper
          args={[30, 30, '#DCC6A5', '#E5E1D8']}
          position={[0, 0.01, 0]}
        />
      )}

      {/* 6. Subtle Room Carpets & Department Zones */}
      {INITIAL_DEPARTMENTS.map((dept) => {
        const isHovered = hoveredZone === dept.slug;
        const isSelected = selectedZone?.slug === dept.slug;

        return (
          <group
            key={dept.slug}
            position={[dept.zoneBounds.x, 0.004, dept.zoneBounds.z]}
            onClick={(e) => {
              e.stopPropagation();
              selectZone({
                id: dept.slug,
                name: dept.name,
                slug: dept.slug,
                floorZone: dept.floorZone,
                color: dept.color,
                description: dept.description,
                employeeCount: 0,
              });
            }}
          >
            {/* Soft Neutral Woven Carpet Rug with subtle pastel tint */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0, 0]}
              receiveShadow
            >
              <planeGeometry
                args={[dept.zoneBounds.width - 0.4, dept.zoneBounds.depth - 0.4]}
              />
              <meshStandardMaterial
                color={isSelected ? dept.color : isHovered ? dept.color : '#FFFFFF'}
                opacity={isSelected ? 0.3 : isHovered ? 0.2 : 0.88}
                transparent
                roughness={0.75}
              />
            </mesh>

            {/* Subtle Natural Wood / Pastel Edging Border (No neon!) */}
            <lineSegments position={[0, 0.005, 0]}>
              <edgesGeometry
                args={[
                  new (THREE as any).BoxGeometry(
                    dept.zoneBounds.width - 0.4,
                    0.008,
                    dept.zoneBounds.depth - 0.4,
                  ),
                ]}
              />
              <lineBasicMaterial
                color={dept.color}
                linewidth={isSelected ? 2.5 : 1.5}
                transparent
                opacity={isSelected ? 0.85 : isHovered ? 0.65 : 0.35}
              />
            </lineSegments>

            {/* Corner Markers (Subtle, tasteful dots) */}
            {[
              [-(dept.zoneBounds.width - 0.4) / 2, -(dept.zoneBounds.depth - 0.4) / 2],
              [(dept.zoneBounds.width - 0.4) / 2, -(dept.zoneBounds.depth - 0.4) / 2],
              [-(dept.zoneBounds.width - 0.4) / 2, (dept.zoneBounds.depth - 0.4) / 2],
              [(dept.zoneBounds.width - 0.4) / 2, (dept.zoneBounds.depth - 0.4) / 2],
            ].map(([cx, cz], cIdx) => (
              <mesh key={`corner-${cIdx}`} position={[cx, 0.006, cz]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.15, 16]} />
                <meshBasicMaterial color={dept.color} transparent opacity={0.65} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};
