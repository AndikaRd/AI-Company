import React from 'react';
import { useOfficeStore } from '../../store/useOfficeStore';

export const OfficeLighting: React.FC = () => {
  const { lightingMode } = useOfficeStore();

  const lightConfigs = {
    daylight: {
      ambient: '#94a3b8',
      ambientIntensity: 0.6,
      main: '#f8fafc',
      mainIntensity: 1.2,
      accent: '#38bdf8',
    },
    cyberpunk: {
      ambient: '#1e1b4b',
      ambientIntensity: 0.4,
      main: '#06b6d4',
      mainIntensity: 1.0,
      accent: '#ec4899',
    },
    warm: {
      ambient: '#78716c',
      ambientIntensity: 0.5,
      main: '#fed7aa',
      mainIntensity: 1.1,
      accent: '#f59e0b',
    },
  };

  const current = lightConfigs[lightingMode] || lightConfigs.daylight;

  return (
    <group>
      {/* Base Ambient Light */}
      <ambientLight color={current.ambient} intensity={current.ambientIntensity} />

      {/* Main Directional Sunlight / Office Overhead Cast Light */}
      <directionalLight
        position={[20, 30, 20]}
        intensity={current.mainIntensity}
        color={current.main}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0005}
      />

      {/* Fill Light (Soft cool shadow fill) */}
      <directionalLight
        position={[-15, 20, -15]}
        intensity={0.35}
        color="#38bdf8"
      />

      {/* Central Node Overhead Downlight */}
      <spotLight
        position={[0, 10, 0]}
        target-position={[0, 0, 0]}
        intensity={1.8}
        color={current.accent}
        angle={Math.PI / 4}
        penumbra={0.6}
        distance={20}
      />
    </group>
  );
};
