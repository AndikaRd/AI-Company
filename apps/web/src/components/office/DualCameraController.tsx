import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useOfficeStore } from '../../store/useOfficeStore';

export const OVERVIEW_POSITION: [number, number, number] = [24, 26, 24];
export const OVERVIEW_TARGET: [number, number, number] = [0, 0, 0];

export const DualCameraController: React.FC = () => {
  const { cameraMode, cameraPosition, cameraTarget } = useOfficeStore();
  const controlsRef = useRef<any>(null);
  const targetVec = useRef(new THREE.Vector3(...cameraTarget));
  const posVec = useRef(new THREE.Vector3(...cameraPosition));
  const isTransitioning = useRef(true);

  // Update target vectors when store changes
  useEffect(() => {
    targetVec.current.set(...cameraTarget);
    posVec.current.set(...cameraPosition);
    isTransitioning.current = true;
  }, [cameraPosition, cameraTarget, cameraMode]);

  useFrame(({ camera }) => {
    if (!controlsRef.current) return;

    if (cameraMode === 'overview') {
      // In Overview mode: smoothly enforce isometric whole-office framing
      camera.position.lerp(new THREE.Vector3(...OVERVIEW_POSITION), 0.06);
      controlsRef.current.target.lerp(new THREE.Vector3(...OVERVIEW_TARGET), 0.06);
      controlsRef.current.update();
    } else {
      // In Explore mode: smoothly interpolate to target preset or focused entity
      if (isTransitioning.current) {
        camera.position.lerp(posVec.current, 0.06);
        controlsRef.current.target.lerp(targetVec.current, 0.06);
        controlsRef.current.update();

        // Stop active lerp when close enough to allow free user manipulation
        if (
          camera.position.distanceTo(posVec.current) < 0.1 &&
          controlsRef.current.target.distanceTo(targetVec.current) < 0.1
        ) {
          isTransitioning.current = false;
        }
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      enablePan={cameraMode === 'explore'}
      enableZoom={true}
      enableRotate={cameraMode === 'explore'}
      minDistance={6}
      maxDistance={65}
      maxPolarAngle={Math.PI / 2.05} // Prevent clipping under floor
      minPolarAngle={0.2}
      panSpeed={1.0}
      rotateSpeed={0.7}
      zoomSpeed={0.9}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
};
