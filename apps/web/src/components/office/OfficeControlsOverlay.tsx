import React from 'react';
import {
  RotateCcw,
  Grid,
  Tag,
  Sun,
  X,
  Users,
} from 'lucide-react';
import { useOfficeStore, CAMERA_PRESETS } from '../../store/useOfficeStore';
import { Card } from '../ui/Card';

export const OfficeControlsOverlay: React.FC = () => {
  const {
    activePreset,
    cameraMode,
    setCameraMode,
    setPreset,
    resetCamera,
    showGrid,
    toggleGrid,
    showLabels,
    toggleLabels,
    lightingMode,
    setLightingMode,
    selectedZone,
    selectZone,
  } = useOfficeStore();

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
      {/* --- TOP BAR: DUAL CAMERA MODES, PRESETS & VIEW TOGGLES --- */}
      <div className="flex items-start justify-between w-full pointer-events-auto">
        {/* Dual Camera Mode & Presets (Offset left to make room for 2D/3D toggle) */}
        <div className="ml-56 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-amber-200/80 shadow-md">
          {/* Dual Camera Mode Switcher (Overview vs Explore) */}
          <div className="flex items-center bg-amber-50 p-0.5 rounded-xl border border-amber-200/70 mr-1">
            <button
              onClick={() => setCameraMode('overview')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                cameraMode === 'overview'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCameraMode('explore')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                cameraMode === 'explore'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Explore
            </button>
          </div>

          {/* Quick Preset Jumps (Available in Explore Mode) */}
          {cameraMode === 'explore' && (
            <div className="hidden md:flex items-center gap-1">
              {CAMERA_PRESETS.filter((p) => p.id !== 'iso-default').map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setPreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    activePreset === preset.id
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-amber-50'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={resetCamera}
            title="Reset to Overview Angle"
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-amber-50 transition-colors ml-1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* View Options Toggle Controls */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-amber-200/80 shadow-md">
          <button
            onClick={toggleGrid}
            title={showGrid ? 'Hide Floor Grid' : 'Show Floor Grid'}
            className={`p-2 rounded-xl text-xs font-medium transition-colors ${
              showGrid
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-slate-500 hover:text-slate-800 hover:bg-amber-50'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={toggleLabels}
            title={showLabels ? 'Hide Zone Labels' : 'Show Zone Labels'}
            className={`p-2 rounded-xl text-xs font-medium transition-colors ${
              showLabels
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-slate-500 hover:text-slate-800 hover:bg-amber-50'
            }`}
          >
            <Tag className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const modes: Array<'daylight' | 'warm' | 'soft'> = ['daylight', 'warm', 'soft'];
              const next = modes[(modes.indexOf(lightingMode) + 1) % modes.length];
              setLightingMode(next);
            }}
            title={`Lighting: ${lightingMode}`}
            className="px-2.5 py-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-amber-50 transition-colors capitalize text-xs flex items-center gap-1.5 font-medium"
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline">{lightingMode}</span>
          </button>
        </div>
      </div>

      {/* --- BOTTOM AREA: CONTROLS HINT & SELECTED ZONE INSPECTOR --- */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* Interaction Hints Pill */}
        <div className="hidden lg:flex items-center gap-3.5 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-amber-200/70 text-xs text-slate-600 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 font-semibold text-slate-700">
              Click
            </span>
            <span>Select Agent / Desk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 font-semibold text-slate-700">
              Double Click
            </span>
            <span>Focus Camera</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 font-semibold text-slate-700">
              Drag
            </span>
            <span>{cameraMode === 'explore' ? 'Orbit / Pan' : 'Switch to Explore to Orbit'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 font-semibold text-slate-700">
              Scroll
            </span>
            <span>Zoom</span>
          </div>
        </div>

        {/* Selected Department Inspector Card */}
        {selectedZone && (
          <Card className="w-80 border-amber-200/80 shadow-xl bg-white/95 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full shadow-sm"
                  style={{ backgroundColor: selectedZone.color || '#E99A50' }}
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedZone.name}
                  </h3>
                  <span className="text-[11px] font-medium text-amber-700">
                    {selectedZone.floorZone || 'Office Department'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => selectZone(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
              {selectedZone.description || 'Department office area for designated AI workforce.'}
            </p>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Team Size:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200/60 text-[11px]">
                <Users className="w-3 h-3 text-amber-600" />
                {selectedZone.employeeCount} {selectedZone.employeeCount === 1 ? 'AI Member' : 'AI Members'}
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
