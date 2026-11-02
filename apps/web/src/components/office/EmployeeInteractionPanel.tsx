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
} from 'lucide-react';
import { Employee, Memory, Task, TaskPriority } from '@vac/shared';
import { useOfficeStore } from '../../store/useOfficeStore';
import { api } from '../../services/api';
import { CharacterAssetsService } from '../../services/character-assets.service';

type ActiveTab = 'overview' | 'profile' | 'tasks' | 'permissions';

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

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

      // Refresh task list
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

  // Action 7: Focus Camera
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
    <div className="absolute top-4 right-4 z-40 w-[420px] max-h-[92vh] bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-start justify-between bg-slate-950/50">
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
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">{employee.role}</p>
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

      {/* Navigation Tabs (Overview, Profile, Tasks, Permissions) */}
      <div className="flex border-b border-slate-800 bg-slate-950/30 px-3 pt-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
            activeTab === 'profile'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
            activeTab === 'tasks'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
            activeTab === 'permissions'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
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
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    Granted Tool Capabilities ({agentConfig.toolsEnabled.length})
                  </span>
                  <button
                    onClick={() => setActiveTab('permissions')}
                    className="text-cyan-400 hover:text-cyan-300 lowercase underline"
                  >
                    view matrix
                  </button>
                </div>
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

            {/* Recent Institutional Memory */}
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
                  {recentMemories.slice(0, 2).map((m) => (
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
        )}

        {/* =========================================================
            TAB 2: PROFILE (Action 1: View Profile)
           ========================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-3.5 text-xs">
            {/* Identity details */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Executive Identity
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block">Seniority</span>
                  <span className="font-semibold text-white">{employee.seniority}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Department</span>
                  <span className="font-semibold text-cyan-300">{employee.department?.name || 'Operations'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Direct Supervisor</span>
                  <span className="font-semibold text-slate-200">
                    {employee.supervisor
                      ? `${employee.supervisor.firstName} ${employee.supervisor.lastName}`
                      : 'Executive Leadership (CEO)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Corporate Email</span>
                  <span className="font-mono text-slate-300 text-[11px] truncate block">
                    {employee.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Expertise */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Primary Expertise & Domain
              </span>
              <p className="text-slate-200 leading-relaxed font-sans">
                {employee.primaryExpertise || 'Core operational and strategic architecture.'}
              </p>
            </div>

            {/* Personality Persona */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Behavioral Persona
              </span>
              <p className="text-slate-300 leading-relaxed italic font-sans">
                "{employee.personality || 'Rigorous, systematic, analytical, and execution-oriented.'}"
              </p>
            </div>

            {/* Core Responsibilities */}
            {employee.responsibilities && (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Mandated Responsibilities
                </span>
                <ul className="space-y-1 text-slate-300">
                  {Array.isArray(employee.responsibilities) &&
                    employee.responsibilities.map((resp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-cyan-400 mt-0.5">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 3: TASKS (Action 3: Assign Task & Action 4: Task History)
           ========================================================= */}
        {activeTab === 'tasks' && (
          <div className="space-y-3.5">
            {/* Header / Assign Button */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-cyan-400" />
                Task Lifecycle & History
              </span>
              <button
                onClick={() => setShowAssignForm(!showAssignForm)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {showAssignForm ? 'Cancel' : 'Assign Task'}
              </button>
            </div>

            {taskSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{taskSuccessMsg}</span>
              </div>
            )}

            {/* Assign Task Inline Form */}
            {showAssignForm && (
              <form onSubmit={handleCreateTask} className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Assign New Task to {employee.firstName}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Target: {employee.employeeCode}</span>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Audit workspace sandbox bounds"
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Task Directives / Description
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Provide specific instructions for this AI employee..."
                    rows={3}
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingTask || !taskTitle.trim() || !taskDescription.trim()}
                    className="self-end flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-bold transition shadow-glow-cyan"
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
              <div className="text-center py-6 text-xs text-slate-500 font-mono">Loading task history...</div>
            ) : tasks.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                No tasks assigned to this employee yet.
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-white leading-tight">{t.title}</span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                          t.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse'
                            : t.status === 'WAITING_APPROVAL'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
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
            TAB 4: PERMISSIONS (Action 6: View Permissions)
           ========================================================= */}
        {activeTab === 'permissions' && (
          <div className="space-y-3.5 text-xs">
            {/* Autonomy Level Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Autonomy & Enforcement Level
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {agentConfig?.autonomyLevel || 'SUPERVISED'}
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Backend Verified
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {agentConfig?.autonomyLevel === 'AUTONOMOUS'
                  ? 'All non-critical operations execute automatically. Only high-risk and permanent system state changes require CEO review.'
                  : agentConfig?.autonomyLevel === 'SUPERVISED'
                  ? 'Standard engineering operations proceed with audit logging. Shell command executions and critical file operations prompt supervisor confirmation.'
                  : 'All tool invocations require explicit human review and approval prior to execution.'}
              </p>
            </div>

            {/* Tool Matrix */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Granted Tool Capabilities
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {(agentConfig?.toolsEnabled as string[])?.length || 0} active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {((agentConfig?.toolsEnabled as string[]) || []).map((tool, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                  >
                    <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    <span className="truncate">{tool}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prohibited Operations Policy */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-red-950/60 space-y-1.5">
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Hard Security Boundaries
              </span>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li className="flex items-start gap-1">
                  <span className="text-red-400">•</span>
                  <span>Path traversal outside assigned workspace sandbox is strictly blocked.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-red-400">•</span>
                  <span>Unauthorized task delegation beyond reporting chain is rejected.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-red-400">•</span>
                  <span>Direct modification of production secrets or company database is prohibited.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer 7-Action Toolbar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/70 grid grid-cols-4 gap-1.5">
        {/* Action 2: Open Conversation */}
        <button
          onClick={() => onOpenChat(employee)}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-bold transition shadow-glow-cyan"
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
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold transition"
        >
          <PlusCircle className="w-3.5 h-3.5 mb-0.5 text-cyan-400" />
          <span>Assign</span>
        </button>

        {/* Action 5: View Memory */}
        <button
          onClick={() => onOpenMemory(employee)}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-500/40 text-[10px] font-semibold transition"
        >
          <Brain className="w-3.5 h-3.5 mb-0.5 text-purple-400" />
          <span>Memory</span>
        </button>

        {/* Action 7: Focus Camera */}
        <button
          onClick={handleFocusCamera}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition"
        >
          <Crosshair className="w-3.5 h-3.5 mb-0.5 text-slate-400" />
          <span>Focus</span>
        </button>
      </div>
    </div>
  );
};
