import React from 'react';
import * as THREE from 'three';
import { useOfficeStore } from '../../store/useOfficeStore';
import { INITIAL_DEPARTMENTS } from '@vac/shared';

export const OfficeFloor: React.FC = () => {
  const { showGrid, hoveredZone, selectedZone, selectZone } = useOfficeStore();

  return (
    <group position={[0, 0, 0]}>
      {/* Foundation Base Slab */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[32, 0.4, 32]} />
        <meshStandardMaterial
          color="#0b111e"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Main Office Finished Floor Surface */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color="#131c2e"
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Central Corridor Crosswalk (Lighter Accent Path) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 30]} />
        <meshStandardMaterial color="#1a253b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 4]} />
        <meshStandardMaterial color="#1a253b" roughness={0.5} />
      </mesh>

      {/* Central AI Core Hub Platform */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.5, 3.8, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} />
      </mesh>

      {/* Subtle floor tiles / grid overlay */}
      {showGrid && (
        <gridHelper
          args={[30, 30, '#1e293b', '#182234']}
          position={[0, 0.015, 0]}
        />
      )}

      {/* Department Floor Zone Boundaries & Ambient Tints */}
      {INITIAL_DEPARTMENTS.map((dept) => {
        const isHovered = hoveredZone === dept.slug;
        const isSelected = selectedZone?.slug === dept.slug;

        return (
          <group
            key={dept.slug}
            position={[dept.zoneBounds.x, 0.01, dept.zoneBounds.z]}
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
            {/* Zone Floor Carpet Inset */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0, 0]}
              receiveShadow
            >
              <planeGeometry
                args={[dept.zoneBounds.width - 0.4, dept.zoneBounds.depth - 0.4]}
              />
              <meshStandardMaterial
                color={isSelected ? dept.color : isHovered ? dept.color : '#0f172a'}
                opacity={isSelected ? 0.35 : isHovered ? 0.25 : 0.12}
                transparent
                roughness={0.7}
              />
            </mesh>

            {/* Perimeter Zone Boundary Line */}
            <lineSegments position={[0, 0.005, 0]}>
              <edgesGeometry
                args={[
                  new (THREE as any).BoxGeometry(
                    dept.zoneBounds.width - 0.4,
                    0.02,
                    dept.zoneBounds.depth - 0.4,
                  ),
                ]}
              />
              <lineBasicMaterial
                color={dept.color}
                opacity={isSelected ? 0.9 : isHovered ? 0.7 : 0.3}
                transparent
              />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
};
