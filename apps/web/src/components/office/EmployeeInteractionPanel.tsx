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
  User,
  ListTodo,
  ShieldAlert,
  PlusCircle,
  CheckCircle2,
  Send,
  Loader2,
  Lock,
  Heart,
  Droplets,
  Utensils,
  Coffee,
  Smile,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Employee, Memory, Task, TaskPriority } from '@vac/shared';
import { useOfficeStore } from '../../store/useOfficeStore';
import { api } from '../../services/api';
import { CharacterAssetsService } from '../../services/character-assets.service';

type ActiveTab = 'overview' | 'wellbeing' | 'profile' | 'tasks' | 'permissions';

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
  const { employeeActivities, employeeNeeds, employeeLifeStates, focusPosition } = useOfficeStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isIntervening, setIsIntervening] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as ActiveTab;
    if (tabParam && ['overview', 'wellbeing', 'profile', 'tasks', 'permissions'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const lifeState = employee ? employeeLifeStates[employee.id] : null;
  const needs = employee ? employeeNeeds[employee.id] : null;

  const handleIntervention = async (action: 'drink' | 'eat' | 'rest' | 'work' | 'reset') => {
    if (!employee) return;
    setIsIntervening(true);
    try {
      await api.interveneEmployee(employee.id, action);
    } catch (err) {
      console.error('Failed to intervene employee:', err);
    } finally {
      setIsIntervening(false);
    }
  };

  // Memory state
  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  // Task history state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Assign task form state
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskSuccessMsg, setTaskSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (employee && isOpen) {
      loadEmployeeMemories(employee.id);
      loadEmployeeTasks(employee.id);
      setShowAssignForm(false);
      setTaskSuccessMsg(null);
    }
  }, [employee, isOpen]);

  const loadEmployeeMemories = async (id: string) => {
    setLoadingMemories(true);
    try {
      const res = await api.getEmployeeMemories(id, { limit: 4 });
      setRecentMemories(res.all || []);
    } catch (err) {
      console.warn('Failed to load recent memories for interaction panel', err);
    } finally {
      setLoadingMemories(false);
    }
  };

  const loadEmployeeTasks = async (id: string) => {
    setLoadingTasks(true);
    try {
      const res = await api.getTasks({ employeeId: id });
      setTasks(res || []);
    } catch (err) {
      console.warn('Failed to load tasks for interaction panel', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !taskTitle.trim() || !taskDescription.trim()) return;

    setSubmittingTask(true);
    setTaskSuccessMsg(null);
    try {
      await api.createTask({
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        priority: taskPriority,
        assignedEmployeeId: employee.id,
      });

      setTaskTitle('');
      setTaskDescription('');
      setTaskSuccessMsg('Task successfully assigned and queued for execution!');
      setShowAssignForm(false);
      await loadEmployeeTasks(employee.id);
    } catch (err: any) {
      alert(`Failed to assign task: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmittingTask(false);
    }
  };

  if (!isOpen || !employee) return null;

  const activityInfo = employeeActivities[employee.id];
  const activityState = activityInfo?.activity || 'IDLE';
  const asset = CharacterAssetsService.getAssetForEmployee(employee);
  const agentConfig = employee.agentConfig;

  // Action 7: Focus Camera on Employee Workstation
  const handleFocusCamera = () => {
    const dept = employee.department?.slug;
    let pos: [number, number, number] = [0, 0, 0];
    if (dept === 'technology') pos = [-9, 0, -9];
    else if (dept === 'engineering') pos = [-1, 0, -9];
    else if (dept === 'research') pos = [7, 0, -9];
    else if (dept === 'operations') pos = [-8, 0, 7];
    else if (dept === 'quality-assurance') pos = [-1, 0, 8];

    focusPosition(pos, `Workstation: ${employee.firstName}`);
  };

  const getActivityBadge = () => {
    switch (activityState) {
      case 'WORKING':
        return {
          label: 'Working',
          class: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500 animate-pulse',
        };
      case 'THINKING':
        return {
          label: 'Thinking',
          class: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-500 animate-pulse',
        };
      case 'TALKING':
        return {
          label: 'Discussing',
          class: 'bg-cyan-50 text-cyan-800 border-cyan-200',
          dot: 'bg-cyan-500',
        };
      case 'WAITING_APPROVAL':
        return {
          label: 'Review Needed',
          class: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500 animate-ping',
        };
      case 'IDLE':
      default:
        return {
          label: 'Available',
          class: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const badge = getActivityBadge();

  return (
    <div className="absolute top-4 right-4 z-40 w-[420px] max-h-[92vh] bg-white/95 border border-amber-200/80 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden animate-slide-in-right text-slate-800 pointer-events-auto">
      {/* Header */}
      <div className="p-4 border-b border-amber-100 flex items-start justify-between bg-amber-50/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 p-[1.5px] shadow-sm">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Bot className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {employee.firstName} {employee.lastName}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                {employee.department?.name || 'Operations'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">{employee.jobTitle || employee.role}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.class}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-amber-100/60 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs (Overview, Profile, Tasks, Permissions) */}
      <div className="flex border-b border-amber-100 bg-white px-3 pt-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-amber-600 text-amber-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('wellbeing')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
            activeTab === 'wellbeing'
              ? 'border-amber-600 text-amber-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          Well-Being & Needs
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
            activeTab === 'profile'
              ? 'border-amber-600 text-amber-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
            activeTab === 'tasks'
              ? 'border-amber-600 text-amber-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
            activeTab === 'permissions'
              ? 'border-amber-600 text-amber-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Permissions
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* =========================================================
            TAB 1: OVERVIEW
           ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Live Simulation Behavioral State & Thought Bubble */}
            {lifeState && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50/70 to-emerald-50/50 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Life State & Behavior
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    {lifeState.behavior}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>Location: <strong>{lifeState.currentLocationName || 'Workstation'}</strong></span>
                </div>
                {lifeState.currentThought && (
                  <div className="p-2.5 rounded-lg bg-white/90 border border-amber-200/70 text-xs italic text-slate-700 shadow-sm flex items-start gap-2">
                    <span className="text-amber-500 font-bold text-sm not-italic leading-none">“</span>
                    <span>{lifeState.currentThought}</span>
                  </div>
                )}
              </div>
            )}

            {/* Live Activity status */}
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Current Workplace Activity
                </span>
                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {activityInfo?.details || 'At assigned office workstation.'}
              </p>
              {activityInfo?.taskTitle && (
                <div className="p-2 rounded-lg bg-white border border-amber-200 text-[11px] text-amber-900 shadow-sm">
                  <span className="text-[10px] text-amber-700 block font-semibold uppercase tracking-wider">
                    Current Task:
                  </span>
                  <span>{activityInfo.taskTitle}</span>
                </div>
              )}
            </div>

            {/* Workstation & System Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-500 block mb-1">Workstation</span>
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span className="truncate">{employee.workstationId || 'Slot 1'}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-500 block mb-1">AI Engine</span>
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <Cpu className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="truncate">{agentConfig?.modelName || 'qwen3.5:4b'}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-500 block mb-1">Autonomy</span>
                <div className="flex items-center gap-1 font-semibold text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{agentConfig?.autonomyLevel || 'SUPERVISED'}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] text-slate-500 block mb-1">3D Visual Asset</span>
                <div className="flex items-center gap-1 font-semibold text-purple-800">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span className="truncate">{asset.slug}</span>
                </div>
              </div>
            </div>

            {/* Granted Tools Preview */}
            {agentConfig?.toolsEnabled && Array.isArray(agentConfig.toolsEnabled) && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-amber-600" />
                    Granted Tools ({agentConfig.toolsEnabled.length})
                  </span>
                  <button
                    onClick={() => setActiveTab('permissions')}
                    className="text-amber-700 hover:text-amber-900 underline text-[10px]"
                  >
                    view permissions
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(agentConfig.toolsEnabled as string[]).slice(0, 6).map((tool, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] border border-slate-200 font-medium"
                    >
                      {tool}
                    </span>
                  ))}
                  {agentConfig.toolsEnabled.length > 6 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-slate-500">
                      +{agentConfig.toolsEnabled.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Recent Institutional Memory */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <Brain className="w-3 h-3 text-purple-600" />
                  Recent Memories
                </span>
                <button
                  onClick={() => onOpenMemory(employee)}
                  className="text-purple-700 hover:text-purple-900 underline text-[10px]"
                >
                  open full memory
                </button>
              </div>

              {loadingMemories ? (
                <div className="text-center py-3 text-xs text-slate-400">Loading memories...</div>
              ) : recentMemories.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50/30 border border-amber-200/50 text-center text-xs text-slate-500">
                  No recent memories recorded.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentMemories.slice(0, 2).map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {m.title}
                        </span>
                        <span className="text-[9px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          {m.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {m.summary || m.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB: WELL-BEING & LIFE STATE (Sprint 7)
           ========================================================= */}
        {activeTab === 'wellbeing' && (
          <div className="space-y-4 text-xs">
            {/* Overall Morale & Mood Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Smile className="w-4 h-4 text-amber-600" />
                  Overall Morale & Mood
                </span>
                <span className="font-mono font-bold text-sm text-amber-900">
                  {needs?.mood !== undefined ? `${needs.mood}%` : '100%'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-amber-200/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-amber-500"
                  style={{ width: `${needs?.mood ?? 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-600">
                {needs && needs.mood > 75
                  ? 'Highly motivated, focused, and satisfied with workplace environment.'
                  : needs && needs.mood > 40
                  ? 'Moderate morale. Balanced work intensity with occasional breaks.'
                  : 'Low morale. Experiencing fatigue or unmet internal needs.'}
              </p>
            </div>

            {/* Individual Need Meters (Higher = Healthier) */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Internal Condition Meters (Higher = Healthier)
              </span>

              {/* Energy */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Physical & Cognitive Energy
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {needs?.energy ?? 100}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      (needs?.energy ?? 100) < 25 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${needs?.energy ?? 100}%` }}
                  />
                </div>
              </div>

              {/* Hydration / Thirst */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    Hydration Level
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {needs?.thirst ?? 100}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      (needs?.thirst ?? 100) < 25 ? 'bg-rose-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${needs?.thirst ?? 100}%` }}
                  />
                </div>
              </div>

              {/* Nutrition / Hunger */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Utensils className="w-3.5 h-3.5 text-orange-600" />
                    Nutritional Satiety
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {needs?.hunger ?? 100}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      (needs?.hunger ?? 100) < 25 ? 'bg-rose-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${needs?.hunger ?? 100}%` }}
                  />
                </div>
              </div>

              {/* Focus */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Brain className="w-3.5 h-3.5 text-purple-600" />
                    Deep Work Focus
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {needs?.focus ?? 100}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      (needs?.focus ?? 100) < 25 ? 'bg-rose-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${needs?.focus ?? 100}%` }}
                  />
                </div>
              </div>

              {/* Social */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    Social Fulfillment
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {needs?.social ?? 100}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      (needs?.social ?? 100) < 25 ? 'bg-rose-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${needs?.social ?? 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Current Behavioral State */}
            {lifeState && (
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Current Autonomous Activity
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Behavioral Action:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-200">
                    {lifeState.behavior}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Physical Location:</span>
                  <span className="font-medium text-slate-800">{lifeState.currentLocationName}</span>
                </div>
                {lifeState.currentThought && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-xs italic text-slate-700">
                    “{lifeState.currentThought}”
                  </div>
                )}
              </div>
            )}

            {/* Quick Intervention Controls */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Manual Supervisor Intervention
              </span>
              <p className="text-[11px] text-slate-500">
                Override autonomous decision engine to dispatch a wellness directive:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={isIntervening}
                  onClick={() => handleIntervention('drink')}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 text-[11px] font-semibold transition disabled:opacity-50"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  Drink Water
                </button>
                <button
                  disabled={isIntervening}
                  onClick={() => handleIntervention('eat')}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-[11px] font-semibold transition disabled:opacity-50"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  Eat Snack
                </button>
                <button
                  disabled={isIntervening}
                  onClick={() => handleIntervention('rest')}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-[11px] font-semibold transition disabled:opacity-50"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  Rest in Lounge
                </button>
                <button
                  disabled={isIntervening}
                  onClick={() => handleIntervention('reset')}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold transition disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to 100%
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: PROFILE
           ========================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Employee Information
              </span>
              <div className="grid grid-cols-2 gap-2.5 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-500 block">Seniority</span>
                  <span className="font-bold text-slate-900">{employee.seniority}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Department</span>
                  <span className="font-bold text-amber-800">{employee.department?.name || 'Operations'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Reports To</span>
                  <span className="font-semibold text-slate-800">
                    {employee.supervisor
                      ? `${employee.supervisor.firstName} ${employee.supervisor.lastName}`
                      : 'Executive Leadership (CEO)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Company Email</span>
                  <span className="text-slate-800 text-[11px] truncate block">
                    {employee.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Expertise */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Primary Expertise & Domain
              </span>
              <p className="text-slate-700 leading-relaxed">
                {employee.primaryExpertise || 'Core operational and strategic architecture.'}
              </p>
            </div>

            {/* Behavioral Persona */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Behavioral Style
              </span>
              <p className="text-slate-700 leading-relaxed italic">
                "{employee.personality || 'Rigorous, systematic, analytical, and execution-oriented.'}"
              </p>
            </div>

            {/* Responsibilities */}
            {employee.responsibilities && (
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Key Responsibilities
                </span>
                <ul className="space-y-1 text-slate-700">
                  {Array.isArray(employee.responsibilities) &&
                    employee.responsibilities.map((resp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 3: TASKS
           ========================================================= */}
        {activeTab === 'tasks' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-amber-600" />
                Task History
              </span>
              <button
                onClick={() => setShowAssignForm(!showAssignForm)}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {showAssignForm ? 'Cancel' : 'Assign Task'}
              </button>
            </div>

            {taskSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{taskSuccessMsg}</span>
              </div>
            )}

            {/* Assign Task Inline Form */}
            {showAssignForm && (
              <form onSubmit={handleCreateTask} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-300 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Assign New Task to {employee.firstName}</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Audit workspace sandbox bounds"
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Task Directives / Description
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Provide specific instructions for this AI employee..."
                    rows={3}
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                      className="px-2 py-1 rounded-lg bg-white border border-amber-200 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-medium shadow-sm"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingTask || !taskTitle.trim() || !taskDescription.trim()}
                    className="self-end flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm"
                  >
                    {submittingTask ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Task</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Task List */}
            {loadingTasks ? (
              <div className="text-center py-6 text-xs text-slate-400">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50/30 border border-amber-200/50 text-center text-xs text-slate-500">
                No tasks assigned to this employee yet.
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-amber-300 transition text-xs space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 leading-tight">{t.title}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          t.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                            : t.status === 'WAITING_APPROVAL'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Priority: {t.priority}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 4: PERMISSIONS
           ========================================================= */}
        {activeTab === 'permissions' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Autonomy Level
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {agentConfig?.autonomyLevel || 'SUPERVISED'}
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Backend Verified
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {agentConfig?.autonomyLevel === 'AUTONOMOUS'
                  ? 'All standard tasks execute automatically. High-risk actions notify leadership.'
                  : agentConfig?.autonomyLevel === 'SUPERVISED'
                  ? 'Standard operations proceed with logging. Critical operations require confirmation.'
                  : 'All actions require explicit human review.'}
              </p>
            </div>

            {/* Tool Matrix */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Granted Capabilities
                </span>
                <span className="text-[10px] font-semibold text-amber-800">
                  {(agentConfig?.toolsEnabled as string[])?.length || 0} active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {((agentConfig?.toolsEnabled as string[]) || []).map((tool, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-50/50 border border-amber-200/60 text-[11px] text-slate-800 font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{tool}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Boundaries */}
            <div className="p-3.5 rounded-xl bg-amber-50/30 border border-amber-200/60 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-700" />
                Security Boundaries
              </span>
              <ul className="space-y-1 text-[11px] text-slate-600">
                <li className="flex items-start gap-1">
                  <span className="text-amber-700">•</span>
                  <span>Path traversal outside assigned workspace sandbox is strictly blocked.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-amber-700">•</span>
                  <span>Unauthorized task delegation beyond reporting chain is rejected.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-amber-700">•</span>
                  <span>Direct modification of production secrets is prohibited.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer 7-Action Toolbar */}
      <div className="p-3 border-t border-amber-100 bg-amber-50/30 grid grid-cols-4 gap-2">
        {/* Action 2: Chat */}
        <button
          onClick={() => onOpenChat(employee)}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold transition shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5 mb-0.5" />
          <span>Chat</span>
        </button>

        {/* Action 3: Assign Task */}
        <button
          onClick={() => {
            setActiveTab('tasks');
            setShowAssignForm(true);
          }}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold transition shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5 mb-0.5 text-amber-700" />
          <span>Assign</span>
        </button>

        {/* Action 5: View Memory */}
        <button
          onClick={() => onOpenMemory(employee)}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-bold transition shadow-sm"
        >
          <Brain className="w-3.5 h-3.5 mb-0.5 text-purple-700" />
          <span>Memory</span>
        </button>

        {/* Action 7: Focus Camera */}
        <button
          onClick={handleFocusCamera}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-200 transition shadow-sm"
        >
          <Crosshair className="w-3.5 h-3.5 mb-0.5 text-slate-600" />
          <span>Focus</span>
        </button>
      </div>
    </div>
  );
};
