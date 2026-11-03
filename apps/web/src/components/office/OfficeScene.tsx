import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { OfficeFloor } from './OfficeFloor';
import { OfficeWalls } from './OfficeWalls';
import { OfficeFurniture } from './OfficeFurniture';
import { OfficeLighting } from './OfficeLighting';
import { OfficeCharactersLayer } from './OfficeCharactersLayer';
import { DualCameraController } from './DualCameraController';
import { DepartmentZoneTags } from './DepartmentZoneTag';

interface OfficeSceneProps {
  onSelectAgent?: (employeeId: string) => void;
}

export const OfficeScene: React.FC<OfficeSceneProps> = ({ onSelectAgent }) => {
  return (
    <div className="w-full h-full relative bg-[#F4EBDD]">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
        }}
      >
        {/* Warm Cream Sky / Horizon Color */}
        <color attach="background" args={['#F4EBDD']} />

        {/* Soft atmospheric fog blending distant boundaries */}
        <fog attach="fog" args={['#F4EBDD', 42, 95]} />

        {/* Perspective Camera with Default Isometric Vantage Point */}
        <PerspectiveCamera
          makeDefault
          position={[24, 26, 24]}
          fov={35}
          near={0.1}
          far={1000}
        />

        {/* Dual Camera Controller: Overview (fixed isometric) vs Explore (orbit/pan/zoom) */}
        <DualCameraController />

        {/* Warm Natural Daylight & Fill Lighting */}
        <OfficeLighting />

        {/* 3D Office Modular Environment Elements */}
        <OfficeFloor />
        <OfficeWalls />
        <OfficeFurniture onSelectAgent={onSelectAgent} />

        {/* Autonomous AI Employee Characters Layer */}
        <OfficeCharactersLayer onSelectAgent={onSelectAgent} />

        {/* 3D Floating Zone Tags */}
        <DepartmentZoneTags />
      </Canvas>
    </div>
  );
};
