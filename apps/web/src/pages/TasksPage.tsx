import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Task, ApprovalRequest } from '@vac/shared';
import { api } from '../services/api';
import { useCompanyStore } from '../store/useCompanyStore';
import { TaskExecutionDrawer } from '../components/tasks/TaskExecutionDrawer';
import { TaskTreeDrawer } from '../components/tasks/TaskTreeDrawer';
import { DispatchTaskModal } from '../components/tasks/DispatchTaskModal';
import {
  Plus,
  Clock,
  RefreshCw,
  Terminal,
  ShieldAlert,
  Bot,
  GitBranch,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { employees, fetchData } = useCompanyStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTreeTaskId, setSelectedTreeTaskId] = useState<string | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  const loadTasksAndApprovals = async () => {
    try {
      const [tasksData, approvalsData] = await Promise.all([
        api.getTasks(),
        api.getPendingApprovals(),
      ]);
      setTasks(tasksData);
      setPendingApprovals(approvalsData);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasksAndApprovals();
    fetchData();

    // Auto-polling for active agent task updates
    const interval = setInterval(() => {
      loadTasksAndApprovals();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const KANBAN_COLUMNS = [
    {
      id: 'backlog',
      title: 'Backlog / Planning',
      statuses: ['PENDING', 'PLANNING'],
      color: 'text-slate-400',
      border: 'border-slate-800',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      statuses: ['IN_PROGRESS'],
      color: 'text-amber-400',
      border: 'border-amber-500/30',
    },
    {
      id: 'waiting_approval',
      title: 'Waiting CEO Approval',
      statuses: ['WAITING_APPROVAL'],
      color: 'text-rose-400',
      border: 'border-rose-500/40',
    },
    {
      id: 'review',
      title: 'Review & Verification',
      statuses: ['REVIEW'],
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
    },
    {
      id: 'completed',
      title: 'Completed',
      statuses: ['COMPLETED'],
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Task Orchestration & Tool Execution
            </h2>
            <Badge variant="success" dot>
              Engine Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Autonomous agent sandbox execution, live tool calling audit trail, and human-in-the-loop CEO approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTasksAndApprovals}
            title="Refresh task queue"
            className="p-2.5 rounded-lg bg-surface border border-surface-border text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs sm:text-sm font-bold transition-all shadow-glow-cyan"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch New Task</span>
          </button>
        </div>
      </div>

      {/* CEO Supervised Approvals Alert Banner */}
      {pendingApprovals.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/50 shadow-xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{pendingApprovals.length} Approval Request(s) Pending CEO Authorization</span>
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              </h4>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Risky actions ({pendingApprovals.map((a) => a.toolName).join(', ')}) require your explicit confirmation before proceeding.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedTaskId(pendingApprovals[0].taskId)}
            className="px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-black text-xs font-bold transition-all shrink-0"
          >
            Review & Authorize
          </button>
        </div>
      )}

      {/* Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => col.statuses.includes(t.status));

          return (
            <div key={col.id} className="space-y-3">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-300">
                <span className={`flex items-center gap-1.5 ${col.color}`}>
                  <span>{col.title}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Dropzone / Cards List */}
              <div className="space-y-3 min-h-[350px]">
                {colTasks.length === 0 ? (
                  <Card className={`min-h-[160px] border-dashed ${col.border} bg-surface/30 flex flex-col items-center justify-center p-4 text-center`}>
                    <Clock className="w-5 h-5 text-slate-600 mb-1.5" />
                    <span className="text-[11px] text-slate-500 font-medium">No tasks in this lane</span>
                  </Card>
                ) : (
                  colTasks.map((task) => {
                    const execution = task.executions?.[0];
                    const toolLogs = execution?.toolLogs || [];

                    return (
                      <Card
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`p-4 cursor-pointer hover:border-cyan-500/50 transition-all bg-surface-elevated/60 border ${col.border} group space-y-3 shadow-md hover:shadow-cyan-950/20`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                                task.priority === 'CRITICAL' || task.priority === 'HIGH'
                                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {task.id.slice(0, 6)}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors mt-2 line-clamp-2">
                            {task.title}
                          </h4>
                        </div>

                        {/* Assignee Badge */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                          <div className="flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5 text-cyan-400" />
                            <span>
                              {task.assignedEmployee
                                ? `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}`
                                : 'Alex Mercer'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTreeTaskId(task.id);
                              }}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                              title="View Multi-Agent Task Tree"
                            >
                              <GitBranch className="w-3.5 h-3.5" />
                            </button>
                            {toolLogs.length > 0 && (
                              <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                                <Terminal className="w-3 h-3 text-cyan-400" />
                                {toolLogs.length}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Latest Tool Activity Pill */}
                        {toolLogs.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {toolLogs.slice(0, 2).map((log, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-cyan-300 truncate max-w-[120px]"
                              >
                                {log.toolName}
                              </span>
                            ))}
                            {toolLogs.length > 2 && (
                              <span className="text-[9px] font-mono text-slate-500 self-center">
                                +{toolLogs.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Execution Detail Drawer */}
      <TaskExecutionDrawer
        taskId={selectedTaskId}
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={loadTasksAndApprovals}
      />

      {/* Multi-Agent Task Tree Drawer */}
      <TaskTreeDrawer
        taskId={selectedTreeTaskId}
        isOpen={Boolean(selectedTreeTaskId)}
        onClose={() => setSelectedTreeTaskId(null)}
        onRefresh={loadTasksAndApprovals}
      />

      {/* Dispatch New Task Modal */}
      <DispatchTaskModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        employees={employees}
        onTaskCreated={() => {
          loadTasksAndApprovals();
        }}
      />
    </div>
  );
};
