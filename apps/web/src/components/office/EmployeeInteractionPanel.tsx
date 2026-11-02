import React, { useEffect, useState } from 'react';
import {
  X,
  Bot,
  Cpu,
  ShieldCheck,
  MapPin,
  MessageSquare,
  Brain,
  Crosshair,
  Layers,
  Wrench,
  Clock,
} from 'lucide-react';
import { Employee, Memory } from '@vac/shared';
import { useOfficeStore } from '../../store/useOfficeStore';
import { api } from '../../services/api';
import { CharacterAssetsService } from '../../services/character-assets.service';

interface EmployeeInteractionPanelProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (employee: Employee) => void;
  onOpenMemory: (employee: Employee) => void;
}

export const EmployeeInteractionPanel: React.FC<EmployeeInteractionPanelProps> = ({
  employee,
  isOpen,
  onClose,
  onOpenChat,
  onOpenMemory,
}) => {
  const { employeeActivities, focusPosition } = useOfficeStore();
  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  useEffect(() => {
    if (employee && isOpen) {
      loadEmployeeMemories(employee.id);
    }
  }, [employee, isOpen]);

  const loadEmployeeMemories = async (id: string) => {
    setLoadingMemories(true);
    try {
      const res = await api.getEmployeeMemories(id, { limit: 3 });
      setRecentMemories(res.all || []);
    } catch (err) {
      console.warn('Failed to load recent memories for interaction panel', err);
    } finally {
      setLoadingMemories(false);
    }
  };

  if (!isOpen || !employee) return null;

  const activityInfo = employeeActivities[employee.id];
  const activityState = activityInfo?.activity || 'IDLE';
  const asset = CharacterAssetsService.getAssetForEmployee(employee);
  const agentConfig = employee.agentConfig;

  const handleFocusCamera = () => {
    // Map known department workstation coordinates
    const dept = employee.department?.slug;
    let pos: [number, number, number] = [0, 0, 0];
    if (dept === 'technology') pos = [-9, 0, -9];
    else if (dept === 'engineering') pos = [-1, 0, -9];
    else if (dept === 'research') pos = [7, 0, -9];
    else if (dept === 'operations') pos = [-8, 0, 7];
    else if (dept === 'quality-assurance') pos = [-1, 0, 8];

    focusPosition(pos, `Workstation: ${employee.firstName}`);
  };

  const getActivityBadgeClass = () => {
    switch (activityState) {
      case 'WORKING':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'THINKING':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'TALKING':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'WAITING_APPROVAL':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse';
      case 'IDLE':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="absolute top-4 right-4 z-40 w-96 max-h-[92vh] bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-start justify-between bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-primary-600 to-indigo-600 p-[1.5px] shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-white leading-tight">
                {employee.firstName} {employee.lastName}
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {employee.employeeCode}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[210px]">{employee.role}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${getActivityBadgeClass()}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {activityState}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {employee.department?.name || 'Department'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Real-time Task / Activity status */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Live Execution Status
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Active Sync
            </span>
          </div>
          <p className="text-xs text-white font-medium leading-relaxed">
            {activityInfo?.details || 'Standing by at assigned workstation anchor.'}
          </p>
          {activityInfo?.taskTitle && (
            <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200">
              <span className="text-[10px] text-cyan-400 block font-mono uppercase tracking-wider">
                Current Task:
              </span>
              <span>{activityInfo.taskTitle}</span>
            </div>
          )}
        </div>

        {/* Workstation & Model Specs */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-1">Workstation</span>
            <div className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">{employee.workstationId || 'ws-slot-1'}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-1">AI Engine</span>
            <div className="flex items-center gap-1 text-cyan-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate">{agentConfig?.modelName || 'qwen3.5:4b'}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-1">Autonomy</span>
            <div className="flex items-center gap-1 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{agentConfig?.autonomyLevel || 'SUPERVISED'}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-1">3D Rig</span>
            <div className="flex items-center gap-1 text-purple-300">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span className="truncate">{asset.slug}</span>
            </div>
          </div>
        </div>

        {/* Granted Tools Preview */}
        {agentConfig?.toolsEnabled && Array.isArray(agentConfig.toolsEnabled) && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Wrench className="w-3 h-3" />
              Granted Tool Capabilities ({agentConfig.toolsEnabled.length})
            </span>
            <div className="flex flex-wrap gap-1">
              {(agentConfig.toolsEnabled as string[]).slice(0, 6).map((tool, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700/60"
                >
                  {tool}
                </span>
              ))}
              {agentConfig.toolsEnabled.length > 6 && (
                <span className="px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
                  +{agentConfig.toolsEnabled.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Recent Episodic/Semantic Memory */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3 text-purple-400" />
              Institutional Memory
            </span>
            <button
              onClick={() => onOpenMemory(employee)}
              className="text-purple-400 hover:text-purple-300 font-semibold lowercase underline"
            >
              view all
            </button>
          </div>

          {loadingMemories ? (
            <div className="text-center py-3 text-xs text-slate-500 font-mono">Loading memories...</div>
          ) : recentMemories.length === 0 ? (
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
              No recent memories recorded.
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentMemories.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200 truncate max-w-[200px]">
                      {m.title}
                    </span>
                    <span className="text-[9px] font-mono text-purple-300 bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-800/40">
                      {m.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                    {m.summary || m.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 grid grid-cols-3 gap-2">
        <button
          onClick={() => onOpenChat(employee)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition shadow-glow-cyan"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => onOpenMemory(employee)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition"
        >
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span>Memory</span>
        </button>

        <button
          onClick={handleFocusCamera}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          <Crosshair className="w-3.5 h-3.5 text-slate-400" />
          <span>Focus</span>
        </button>
      </div>
    </div>
  );
};
