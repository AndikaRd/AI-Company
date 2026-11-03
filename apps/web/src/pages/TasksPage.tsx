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
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      statuses: ['IN_PROGRESS'],
    },
    {
      id: 'waiting_approval',
      title: 'Awaiting Approval',
      statuses: ['WAITING_APPROVAL'],
    },
    {
      id: 'review',
      title: 'Review & Verification',
      statuses: ['REVIEW'],
    },
    {
      id: 'completed',
      title: 'Completed',
      statuses: ['COMPLETED'],
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-text tracking-tight">
              Task Engine & Orchestration
            </h2>
            <Badge variant="primary">
              {tasks.length} Total Tasks
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-secondary-text mt-1">
            Autonomous agent workflow execution, live tool calling logs, and CEO authorization gates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTasksAndApprovals}
            title="Refresh task queue"
            className="p-2.5 rounded-lg bg-surface border border-surface-border text-secondary-text hover:text-primary-text hover:bg-surface-muted transition-colors shadow-subtle"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs sm:text-sm font-semibold transition-colors shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch New Task</span>
          </button>
        </div>
      </div>

      {/* CEO Supervised Approvals Alert Banner */}
      {pendingApprovals.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <span>{pendingApprovals.length} Approval Request(s) Pending Review</span>
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Elevated operations ({pendingApprovals.map((a) => a.toolName).join(', ')}) require your authorization before execution.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedTaskId(pendingApprovals[0].taskId)}
            className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold transition-colors shadow-subtle shrink-0"
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
            <div key={col.id} className="p-3 bg-surface-muted/50 rounded-2xl border border-surface-border space-y-3">
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 py-1 text-xs font-bold text-primary-text">
                <span>{col.title}</span>
                <Badge variant="neutral" className="text-[10px]">
                  {colTasks.length}
                </Badge>
              </div>

              {/* Column Cards List */}
              <div className="space-y-2.5 min-h-[350px]">
                {colTasks.length === 0 ? (
                  <div className="min-h-[140px] border border-dashed border-surface-border rounded-xl flex flex-col items-center justify-center p-4 text-center">
                    <Clock className="w-4 h-4 text-secondary-text mb-1" />
                    <span className="text-[11px] text-secondary-text">No tasks</span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const execution = task.executions?.[0];
                    const toolLogs = execution?.toolLogs || [];

                    return (
                      <Card
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="p-3.5 cursor-pointer hover:border-stone-300 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              task.priority === 'CRITICAL' || task.priority === 'HIGH'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-surface-muted text-secondary-text border-surface-border'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-[10px] text-secondary-text">
                            #{task.id.slice(0, 6)}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-primary-text line-clamp-2 leading-snug">
                          {task.title}
                        </h4>

                        {/* Assignee Badge */}
                        <div className="flex items-center justify-between text-[11px] text-secondary-text border-t border-surface-border pt-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <Bot className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                            <span className="truncate">
                              {task.assignedEmployee
                                ? `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}`
                                : 'Alex Mercer'}
                            </span>
                          </div>

                          {/* Subtask Tree indicator */}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTreeTaskId(task.id);
                              }}
                              className="flex items-center gap-1 text-[10px] text-primary-600 hover:text-primary-800 font-medium"
                              title="View subtask delegation tree"
                            >
                              <GitBranch className="w-3 h-3" />
                              <span>{task.subtasks.length}</span>
                            </button>
                          )}
                        </div>

                        {/* Tool execution logs count */}
                        {toolLogs.length > 0 && (
                          <div className="flex items-center justify-between text-[10px] text-secondary-text bg-surface-muted/60 p-1.5 rounded-lg border border-surface-border">
                            <span className="flex items-center gap-1 font-mono">
                              <Terminal className="w-3 h-3 text-secondary-text" />
                              <span>{toolLogs.length} audit logs</span>
                            </span>
                            <span className="font-semibold text-primary-text">
                              {toolLogs[toolLogs.length - 1].toolName}
                            </span>
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

      {/* Task Execution Audit Drawer */}
      <TaskExecutionDrawer
        taskId={selectedTaskId}
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={loadTasksAndApprovals}
      />

      {/* Subtask Delegation Tree Drawer */}
      <TaskTreeDrawer
        taskId={selectedTreeTaskId}
        isOpen={Boolean(selectedTreeTaskId)}
        onClose={() => setSelectedTreeTaskId(null)}
      />

      {/* Dispatch Task Modal */}
      <DispatchTaskModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        employees={employees}
        onTaskCreated={loadTasksAndApprovals}
        onSuccess={loadTasksAndApprovals}
      />
    </div>
  );
};
