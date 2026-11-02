import React from 'react';
import { OfficeScene } from '../components/office/OfficeScene';
import { OfficeControlsOverlay } from '../components/office/OfficeControlsOverlay';

export const VirtualOfficePage: React.FC = () => {
  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <OfficeScene />
      <OfficeControlsOverlay />
    </div>
  );
};

