import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { OfficeFloor } from './OfficeFloor';
import { OfficeWalls } from './OfficeWalls';
import { OfficeFurniture } from './OfficeFurniture';
import { OfficeLighting } from './OfficeLighting';
import { DepartmentZoneTags } from './DepartmentZoneTag';
import { useOfficeStore } from '../../store/useOfficeStore';

// Camera transition controller
const CameraController: React.FC = () => {
  const { cameraPosition, cameraTarget } = useOfficeStore();
  const controlsRef = useRef<any>(null);

  useFrame(({ camera }) => {
    if (controlsRef.current) {
      // Smoothly interpolate camera position towards target preset
      camera.position.lerp(new THREE.Vector3(...cameraPosition), 0.05);
      controlsRef.current.target.lerp(new THREE.Vector3(...cameraTarget), 0.05);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={6}
      maxDistance={65}
      maxPolarAngle={Math.PI / 2.05} // Prevent camera clipping below floor plane
      panSpeed={1.2}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
    />
  );
};

export const OfficeScene: React.FC = () => {
  return (
    <div className="w-full h-full relative bg-[#070b14]">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        {/* Isometric Perspective Camera */}
        <PerspectiveCamera
          makeDefault
          position={[24, 26, 24]}
          fov={35}
          near={0.1}
          far={1000}
        />

        {/* Orbit Controls & Camera Transition */}
        <CameraController />

        {/* Environment Lights & Shadows */}
        <OfficeLighting />

        {/* 3D Office Geometry Elements */}
        <OfficeFloor />
        <OfficeWalls />
        <OfficeFurniture />

        {/* 3D Floating Zone Tags */}
        <DepartmentZoneTags />
      </Canvas>
    </div>
  );
};
