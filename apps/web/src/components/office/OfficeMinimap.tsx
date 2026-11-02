import React from 'react';
import { useOfficeStore, CAMERA_PRESETS } from '../../store/useOfficeStore';
import { useCompanyStore } from '../../store/useCompanyStore';
import { Compass } from 'lucide-react';

interface OfficeMinimapProps {
  onSelectEmployee: (employeeId: string) => void;
}

export const OfficeMinimap: React.FC<OfficeMinimapProps> = ({ onSelectEmployee }) => {
  const {
    activePreset,
    setPreset,
    focusPosition,
    employeeActivities,
    connectionState,
  } = useOfficeStore();
  const { employees } = useCompanyStore();

  // Coordinates mapping on the 2D minimap canvas (width: 180, height: 180)
  // Scene bounds approx: X from -14 to +14, Z from -14 to +14
  const mapSceneToMinimap = (x: number, z: number): [number, number] => {
    const minX = -15;
    const maxX = 15;
    const minZ = -15;
    const maxZ = 15;
    const px = ((x - minX) / (maxX - minX)) * 160 + 10;
    const pz = ((z - minZ) / (maxZ - minZ)) * 160 + 10;
    return [px, pz];
  };

  const getDepartmentCoordinates = (deptSlug: string): [number, number] => {
    switch (deptSlug) {
      case 'technology':
        return [-8, -8];
      case 'engineering':
        return [0, -8];
      case 'research':
        return [8, -8];
      case 'operations':
        return [-8, 8];
      case 'quality-assurance':
        return [0, 8];
      case 'conference':
        return [8, 8];
      default:
        return [0, 0];
    }
  };

  const getActivityColor = (employeeId: string) => {
    const act = employeeActivities[employeeId]?.activity;
    switch (act) {
      case 'WORKING':
        return 'bg-cyan-400 ring-cyan-400/50';
      case 'THINKING':
        return 'bg-purple-400 ring-purple-400/50';
      case 'TALKING':
        return 'bg-emerald-400 ring-emerald-400/50';
      case 'WAITING_APPROVAL':
        return 'bg-amber-400 ring-amber-400/50';
      case 'IDLE':
      default:
        return 'bg-slate-400 ring-slate-400/30';
    }
  };

  return (
    <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-2 select-none">
      {/* Minimap Radar Container */}
      <div className="w-52 h-52 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md p-3 flex flex-col justify-between overflow-hidden relative">
        {/* Radar Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-300 font-mono uppercase">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>HQ Radar</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionState === 'CONNECTED'
                  ? 'bg-emerald-400 animate-pulse'
                  : connectionState === 'CONNECTING'
                  ? 'bg-amber-400 animate-ping'
                  : connectionState === 'ERROR'
                  ? 'bg-rose-500'
                  : 'bg-slate-500'
              }`}
            />
            <span
              className={`font-semibold ${
                connectionState === 'CONNECTED'
                  ? 'text-emerald-400'
                  : connectionState === 'CONNECTING'
                  ? 'text-amber-400'
                  : connectionState === 'ERROR'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {connectionState}
            </span>
          </div>
        </div>

        {/* 2D Blueprint Grid Layout */}
        <div className="relative w-full h-36 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:16px_16px]" />

          {/* Department Boundary Boxes */}
          <div className="absolute top-2 left-2 w-14 h-14 rounded border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center text-[7px] text-cyan-400 font-mono">
            TECH
          </div>
          <div className="absolute top-2 left-18 w-14 h-14 rounded border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center text-[7px] text-emerald-400 font-mono">
            ENG
          </div>
          <div className="absolute top-2 right-2 w-14 h-14 rounded border border-purple-500/20 bg-purple-500/5 flex items-center justify-center text-[7px] text-purple-400 font-mono">
            RES
          </div>
          <div className="absolute bottom-2 left-2 w-14 h-14 rounded border border-blue-500/20 bg-blue-500/5 flex items-center justify-center text-[7px] text-blue-400 font-mono">
            OPS
          </div>
          <div className="absolute bottom-2 left-18 w-14 h-14 rounded border border-rose-500/20 bg-rose-500/5 flex items-center justify-center text-[7px] text-rose-400 font-mono">
            QA
          </div>
          <div className="absolute bottom-2 right-2 w-14 h-14 rounded border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-center text-[7px] text-indigo-400 font-mono">
            MEET
          </div>

          {/* Employee Blips */}
          {employees.map((emp) => {
            const [x, z] = getDepartmentCoordinates(emp.department?.slug || 'technology');
            const [px, pz] = mapSceneToMinimap(x, z);

            return (
              <button
                key={emp.id}
                onClick={() => {
                  onSelectEmployee(emp.id);
                  focusPosition([x, 0, z], `${emp.firstName}`);
                }}
                title={`${emp.firstName} ${emp.lastName} (${emp.role})`}
                style={{ left: `${px * 0.9}px`, top: `${pz * 0.75}px` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer"
              >
                <div
                  className={`w-3 h-3 rounded-full ring-2 transition-all ${getActivityColor(
                    emp.id,
                  )} group-hover:scale-150 shadow-md flex items-center justify-center`}
                >
                  <span className="text-[7px] font-bold text-black uppercase">
                    {emp.firstName[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Camera Navigation Bar */}
        <div className="flex items-center justify-between gap-1 pt-1 overflow-x-auto">
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setPreset(preset)}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-medium transition whitespace-nowrap ${
                activePreset === preset.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {preset.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
