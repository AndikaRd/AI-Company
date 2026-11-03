import React from 'react';
import { useOfficeStore } from '../../store/useOfficeStore';

export const OfficeLighting: React.FC = () => {
  const { lightingMode } = useOfficeStore();

  const lightConfigs = {
    daylight: {
      ambient: '#FFF8EE',
      ambientIntensity: 1.05,
      sunlight: '#FFF7EB',
      sunIntensity: 1.45,
      bounce: '#F4EBDD',
      bounceIntensity: 0.55,
    },
    warm: {
      ambient: '#FFF3E2',
      ambientIntensity: 1.15,
      sunlight: '#FFE4C4',
      sunIntensity: 1.35,
      bounce: '#F4EBDD',
      bounceIntensity: 0.6,
    },
    soft: {
      ambient: '#FBF7F0',
      ambientIntensity: 1.1,
      sunlight: '#FFF9F2',
      sunIntensity: 1.3,
      bounce: '#E5E1D8',
      bounceIntensity: 0.5,
    },
  };

  const current = (lightConfigs as any)[lightingMode] || lightConfigs.daylight;

  return (
    <group>
      {/* Soft, Warm Ambient Fill Light across entire floor */}
      <ambientLight color={current.ambient} intensity={current.ambientIntensity} />

      {/* Main Directional Natural Sunlight streaming through architectural windows */}
      <directionalLight
        position={[22, 34, 18]}
        intensity={current.sunIntensity}
        color={current.sunlight}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={90}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />

      {/* Warm Fill / Bounce Light (eliminates harsh dark shadows underneath desks) */}
      <directionalLight
        position={[-18, 22, -18]}
        intensity={current.bounceIntensity}
        color={current.bounce}
      />

      {/* Soft Overhead Ceiling Lights over central walkways */}
      <pointLight position={[0, 7.5, 0]} color="#FFF8F0" intensity={0.45} distance={18} />
      <pointLight position={[-8, 7, -8]} color="#FFF8F0" intensity={0.35} distance={14} />
      <pointLight position={[8, 7, -8]} color="#FFF8F0" intensity={0.35} distance={14} />
      <pointLight position={[-8, 7, 8]} color="#FFF8F0" intensity={0.35} distance={14} />
      <pointLight position={[8, 7, 8]} color="#FFF8F0" intensity={0.35} distance={14} />
    </group>
  );
};
