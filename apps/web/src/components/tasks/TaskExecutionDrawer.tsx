import React, { useState, useEffect } from 'react';
import { Task, ToolExecutionLog, ApprovalRequest } from '@vac/shared';
import { api } from '../../services/api';
import { Badge } from '../ui/Badge';
import {
  X,
  CheckCircle2,
  Clock,
  Terminal,
  ShieldAlert,
  Bot,
  FileCode,
  RotateCcw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface TaskExecutionDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export const TaskExecutionDrawer: React.FC<TaskExecutionDrawerProps> = ({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const fetchTaskDetails = async () => {
    if (!taskId) return;
    try {
      const data = await api.getTask(taskId);
      setTask(data);
    } catch (err) {
      console.error('Failed to load task details:', err);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();

      // Poll task while in progress or waiting approval
      const interval = setInterval(() => {
        fetchTaskDetails();
      }, 3000);

      return () => clearInterval(interval);
    } else {
      setTask(null);
    }
  }, [isOpen, taskId]);

  const handleReviewApproval = async (approvalId: string, approved: boolean) => {
    setIsReviewing(true);
    try {
      await api.reviewApproval(approvalId, {
        approved,
        reviewedBy: 'CEO / Supervisor',
      });
      await fetchTaskDetails();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error('Approval review failed:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRetry = async () => {
    if (!taskId) return;
    try {
      await api.retryTask(taskId);
      await fetchTaskDetails();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  if (!isOpen || !taskId) return null;

  const execution = task?.executions?.[0];
  const toolLogs: ToolExecutionLog[] = execution?.toolLogs || [];
  const pendingApprovals: ApprovalRequest[] = task?.approvalRequests?.filter((a) => a.status === 'PENDING') || [];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success" dot>COMPLETED</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning" dot>IN PROGRESS</Badge>;
      case 'WAITING_APPROVAL':
        return <Badge variant="danger" dot>WAITING CEO APPROVAL</Badge>;
      case 'REVIEW':
        return <Badge variant="info" dot>AWAITING REVIEW</Badge>;
      case 'FAILED':
        return <Badge variant="danger" dot>FAILED</Badge>;
      default:
        return <Badge variant="neutral" dot>{status || 'PENDING'}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-3xl bg-surface border-l border-surface-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-surface-border bg-surface-elevated/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shadow-glow-cyan">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white line-clamp-1">
                  {task?.title || 'Task Details'}
                </h3>
                {getStatusBadge(task?.status)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Assigned to: <strong className="text-cyan-400">{task?.assignedEmployee ? `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}` : 'Alex Mercer'}</strong></span>
                <span>•</span>
                <span className="font-mono text-slate-500 text-[11px]">{task?.id.slice(0, 8)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRetry}
              title="Re-execute Task"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Pending Approval Alert Banner */}
          {pendingApprovals.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/50 shadow-lg space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span>CEO Supervision: Approval Required</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 uppercase font-semibold">
                  {pendingApprovals[0].riskLevel} RISK
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Alex Mercer is requesting authorization to execute <code className="text-amber-300 font-mono font-semibold">{pendingApprovals[0].toolName}</code>.
              </p>

              <div className="p-2.5 rounded-lg bg-black/40 border border-amber-800/40 text-[11px] font-mono text-slate-300 overflow-x-auto">
                <pre>{JSON.stringify(pendingApprovals[0].input, null, 2)}</pre>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => handleReviewApproval(pendingApprovals[0].id, false)}
                  disabled={isReviewing}
                  className="px-3.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  Reject Action
                </button>
                <button
                  onClick={() => handleReviewApproval(pendingApprovals[0].id, true)}
                  disabled={isReviewing}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-glow-emerald disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Resume</span>
                </button>
              </div>
            </div>
          )}

          {/* Task Objective Description */}
          <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Task Directive & Workspace
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {task?.description}
            </p>
            {task?.workspacePath && (
              <div className="pt-2 flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 truncate">
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="text-slate-500">Path:</span>
                <span className="truncate">{task.workspacePath}</span>
              </div>
            )}
          </div>

          {/* Final Deliverables / Engineering Report */}
          {task?.deliverables && (task.deliverables as any).summary && (
            <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Deliverable & Engineering Report</span>
              </div>
              <div className="p-4 rounded-lg bg-background/80 border border-emerald-800/30 text-xs leading-relaxed text-slate-200 font-sans whitespace-pre-wrap">
                {(task.deliverables as any).summary}
              </div>
            </div>
          )}

          {/* Tool Execution Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Tool Execution Audit Trail ({toolLogs.length})</span>
              </span>
              {task?.status === 'IN_PROGRESS' && (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 font-mono animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Active Execution
                </span>
              )}
            </div>

            {toolLogs.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-surface-elevated/40 border border-surface-border text-xs text-slate-500">
                No tool calls logged yet. The agent is initializing reasoning.
              </div>
            ) : (
              <div className="space-y-2.5">
                {toolLogs.map((log, idx) => {
                  const isExpanded = expandedLogId === log.id;
                  const isSuccess = log.status === 'SUCCESS';
                  const isBlocked = log.status === 'BLOCKED' || log.status === 'APPROVAL_REQUIRED';

                  return (
                    <div
                      key={log.id}
                      className="rounded-xl bg-surface-elevated border border-surface-border overflow-hidden transition-all hover:border-slate-700"
                    >
                      {/* Item Summary Bar */}
                      <div
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-3 cursor-pointer flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-500 font-mono text-[11px] w-5">
                            #{idx + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              isSuccess
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isBlocked
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {log.toolName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">
                            [{log.riskLevel}]
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {log.durationMs !== undefined && log.durationMs !== null && (
                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {log.durationMs}ms
                            </span>
                          )}

                          {log.exitCode !== undefined && log.exitCode !== null && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                log.exitCode === 0
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : 'bg-red-950 text-red-300'
                              }`}
                            >
                              exit:{log.exitCode}
                            </span>
                          )}

                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded View */}
                      {isExpanded && (
                        <div className="p-3.5 bg-black/50 border-t border-surface-border space-y-2 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-400 block mb-1">Input Parameters:</span>
                            <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(log.input, null, 2)}
                            </pre>
                          </div>

                          {log.output && (
                            <div>
                              <span className="text-slate-400 block mb-1">Execution Output:</span>
                              <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(log.output, null, 2)}
                              </pre>
                            </div>
                          )}

                          {log.error && (
                            <div className="p-2 rounded bg-red-950/60 border border-red-800 text-red-300 whitespace-pre-wrap">
                              <strong>Error:</strong> {log.error}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
