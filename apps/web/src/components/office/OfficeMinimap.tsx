import React from 'react';
import { useOfficeStore } from '../../store/useOfficeStore';
import { useCompanyStore } from '../../store/useCompanyStore';
import { Map } from 'lucide-react';

interface OfficeMinimapProps {
  onSelectEmployee: (employeeId: string) => void;
}

export const OfficeMinimap: React.FC<OfficeMinimapProps> = ({ onSelectEmployee }) => {
  const { focusPosition, employeeActivities, isSocketConnected } = useOfficeStore();
  const { employees } = useCompanyStore();

  const mapSceneToMinimap = (x: number, z: number): [number, number] => {
    const minX = -15;
    const maxX = 15;
    const minZ = -15;
    const maxZ = 15;
    const px = ((x - minX) / (maxX - minX)) * 160 + 10;
    const pz = ((z - minZ) / (maxZ - minZ)) * 160 + 10;
    return [px, pz];
  };

  const getAgentPosition = (employee: any): [number, number] => {
    const ws = (employee.workstationId || '').toLowerCase();
    if (ws.includes('tech') || employee.department?.slug === 'technology') return [-9, -9];
    if (ws.includes('eng') || employee.department?.slug === 'engineering') return [-1, -9];
    if (ws.includes('res') || employee.department?.slug === 'research') return [7, -9];
    if (ws.includes('ops') || employee.department?.slug === 'operations') return [-8, 7];
    if (ws.includes('qa') || employee.department?.slug === 'quality-assurance') return [-1, 8];
    return [0, 0];
  };

  const getActivityColor = (employeeId: string) => {
    const act = employeeActivities[employeeId]?.activity;
    switch (act) {
      case 'WORKING':
        return 'bg-emerald-500 text-white';
      case 'THINKING':
        return 'bg-purple-500 text-white';
      case 'TALKING':
        return 'bg-cyan-500 text-white';
      case 'WAITING_APPROVAL':
        return 'bg-amber-500 text-white';
      case 'IDLE':
      default:
        return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-2 select-none pointer-events-auto">
      {/* 2D Architectural Floorplan Container */}
      <div className="w-56 h-56 rounded-2xl bg-white/95 border border-amber-200/80 shadow-xl backdrop-blur-md p-3 flex flex-col justify-between overflow-hidden relative">
        {/* Floorplan Header */}
        <div className="flex items-center justify-between z-10 pb-1.5 border-b border-amber-100">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight text-slate-800">
            <Map className="w-3.5 h-3.5 text-amber-600" />
            <span>Office Floorplan</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isSocketConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="font-medium text-slate-500">
              {isSocketConnected ? 'Live' : 'Connecting'}
            </span>
          </div>
        </div>

        {/* 2D Architectural Floor Layout */}
        <div className="relative w-full h-36 bg-[#F4EBDD] rounded-xl border border-amber-200/60 overflow-hidden shadow-inner">
          {/* Main Corridor Crosswalks */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-white/60" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-6 bg-white/60" />

          {/* Department Boundary Tiles */}
          {/* Technology */}
          <div className="absolute top-1.5 left-1.5 w-14 h-12 rounded bg-cyan-100/60 border border-cyan-300/60 flex items-center justify-center text-[8px] font-bold text-cyan-800">
            Tech
          </div>
          {/* Engineering */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-12 rounded bg-emerald-100/60 border border-emerald-300/60 flex items-center justify-center text-[8px] font-bold text-emerald-800">
            Eng
          </div>
          {/* Research */}
          <div className="absolute top-1.5 right-1.5 w-14 h-12 rounded bg-purple-100/60 border border-purple-300/60 flex items-center justify-center text-[8px] font-bold text-purple-800">
            Research
          </div>

          {/* Lounge */}
          <div className="absolute top-1/2 -translate-y-1/2 left-1.5 w-14 h-10 rounded bg-stone-100/60 border border-stone-300/60 flex items-center justify-center text-[8px] font-bold text-stone-700">
            Lounge
          </div>
          {/* Central Atrium */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-emerald-200/70 border border-emerald-400 flex items-center justify-center text-[7px] font-bold text-emerald-800">
            Tree
          </div>
          {/* Pantry */}
          <div className="absolute top-1/2 -translate-y-1/2 right-1.5 w-14 h-10 rounded bg-amber-100/60 border border-amber-300/60 flex items-center justify-center text-[8px] font-bold text-amber-800">
            Pantry
          </div>

          {/* Operations */}
          <div className="absolute bottom-1.5 left-1.5 w-14 h-12 rounded bg-orange-100/60 border border-orange-300/60 flex items-center justify-center text-[8px] font-bold text-orange-800">
            Ops
          </div>
          {/* QA */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-14 h-12 rounded bg-pink-100/60 border border-pink-300/60 flex items-center justify-center text-[8px] font-bold text-pink-800">
            QA
          </div>
          {/* Meeting Room */}
          <div className="absolute bottom-1.5 right-1.5 w-14 h-12 rounded bg-amber-100/60 border border-amber-300/60 flex items-center justify-center text-[8px] font-bold text-amber-800">
            Meeting
          </div>

          {/* Real-time Employee Avatars */}
          {employees.map((emp) => {
            const [wx, wz] = getAgentPosition(emp);
            const [px, pz] = mapSceneToMinimap(wx, wz);

            return (
              <button
                key={`minimap-emp-${emp.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  focusPosition([wx, 0, wz], `Focus: ${emp.firstName}`);
                  onSelectEmployee(emp.id);
                }}
                title={`${emp.firstName} ${emp.lastName} (${emp.jobTitle || emp.role})`}
                style={{
                  left: `${(px / 180) * 100}%`,
                  top: `${(pz / 180) * 100}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-md flex items-center justify-center text-[8px] font-bold border border-white hover:scale-125 transition-transform ${getActivityColor(
                  emp.id,
                )}`}
              >
                {emp.firstName.charAt(0)}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-amber-100">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Working
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> Thinking
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> Available
          </span>
        </div>
      </div>
    </div>
  );
};
