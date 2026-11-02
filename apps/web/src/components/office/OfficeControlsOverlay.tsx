import React from 'react';
import {
  Compass,
  RotateCcw,
  Grid,
  Tag,
  Sun,
  X,
  Cpu,
} from 'lucide-react';
import { useOfficeStore, CAMERA_PRESETS } from '../../store/useOfficeStore';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const OfficeControlsOverlay: React.FC = () => {
  const {
    activePreset,
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
      {/* --- TOP BAR: CAMERA PRESETS & HUD --- */}
      <div className="flex items-start justify-between w-full pointer-events-auto">
        {/* Camera Views Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/90 backdrop-blur-md border border-surface-border shadow-lg">
          <div className="px-2.5 py-1 text-slate-400 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Camera:</span>
          </div>

          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setPreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePreset === preset.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-surface-elevated'
              }`}
            >
              {preset.name}
            </button>
          ))}

          <button
            onClick={resetCamera}
            title="Reset Default Isometric Angle"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors ml-1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* View Options Toggle Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/90 backdrop-blur-md border border-surface-border shadow-lg">
          <button
            onClick={toggleGrid}
            title={showGrid ? 'Hide Floor Grid' : 'Show Floor Grid'}
            className={`p-2 rounded-lg text-xs font-medium transition-colors ${
              showGrid
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
                : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={toggleLabels}
            title={showLabels ? 'Hide Zone Labels' : 'Show Zone Labels'}
            className={`p-2 rounded-lg text-xs font-medium transition-colors ${
              showLabels
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
                : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
            }`}
          >
            <Tag className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const modes: Array<'daylight' | 'cyberpunk' | 'warm'> = [
                'daylight',
                'cyberpunk',
                'warm',
              ];
              const next = modes[(modes.indexOf(lightingMode) + 1) % modes.length];
              setLightingMode(next);
            }}
            title={`Lighting: ${lightingMode}`}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors capitalize text-xs flex items-center gap-1.5"
          >
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline font-mono text-[11px]">{lightingMode}</span>
          </button>
        </div>
      </div>

      {/* --- BOTTOM AREA: CONTROLS HINT & SELECTED ZONE INSPECTOR --- */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* Interaction Hints Pill */}
        <div className="hidden lg:flex items-center gap-4 px-3.5 py-2 rounded-xl bg-surface/80 backdrop-blur-md border border-surface-border text-xs text-slate-400 font-mono shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
              Left Click + Drag
            </span>
            <span>Rotate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
              Right Click + Drag
            </span>
            <span>Pan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
              Scroll Wheel
            </span>
            <span>Zoom</span>
          </div>
        </div>

        {/* Selected Department Inspector Card */}
        {selectedZone && (
          <Card className="w-80 border-cyan-500/40 shadow-glow-cyan bg-slate-950/95 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full shadow-md"
                  style={{ backgroundColor: selectedZone.color || '#3b82f6' }}
                />
                <div>
                  <h3 className="font-semibold text-white text-sm">
                    {selectedZone.name}
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {selectedZone.floorZone || 'OFFICE_ZONE'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => selectZone(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              {selectedZone.description || 'Department office zone for designated AI workforce.'}
            </p>

            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Active Workforce:</span>
              <Badge variant="primary" dot>
                {selectedZone.employeeCount} AI Agents
              </Badge>
            </div>

            <div className="mt-2 text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>3D AI Employee Visual Rig Active</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
