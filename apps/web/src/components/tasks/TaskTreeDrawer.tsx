import React, { useState, useEffect } from 'react';
import { AgentMessage } from '@vac/shared';
import { api } from '../../services/api';
import {
  X,
  GitMerge,
  GitBranch,
  Bot,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { clsx } from 'clsx';
import { DecomposeTaskModal } from './DecomposeTaskModal';

interface TaskTreeDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const TaskTreeDrawer: React.FC<TaskTreeDrawerProps> = ({
  taskId,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [taskData, setTaskData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDecomposeOpen, setIsDecomposeOpen] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);

  const loadTree = async () => {
    if (!taskId) return;
    setIsLoading(true);
    try {
      const data = await api.getTaskTree(taskId);
      setTaskData(data);
    } catch (err) {
      console.error('Failed to load task tree:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      loadTree();
    }
  }, [isOpen, taskId]);

  if (!isOpen) return null;

  const handleConsolidate = async () => {
    if (!taskId) return;
    setIsConsolidating(true);
    try {
      await api.consolidateTask(taskId);
      await loadTree();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to consolidate task:', err);
    } finally {
      setIsConsolidating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="primary" dot>IN PROGRESS</Badge>;
      case 'WAITING_APPROVAL':
        return <Badge variant="warning">WAITING APPROVAL</Badge>;
      case 'REVIEW':
        return <Badge variant="neutral">IN REVIEW</Badge>;
      case 'FAILED':
        return <Badge variant="danger">FAILED</Badge>;
      default:
        return <Badge variant="neutral">PENDING</Badge>;
    }
  };

  const subtasks: any[] = taskData?.subtasks || [];
  const messages: AgentMessage[] = taskData?.agentMessages || [];
  const allSubtasksDone =
    subtasks.length > 0 && subtasks.every((st) => st.status === 'COMPLETED');

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[580px] bg-surface border-l border-surface-border shadow-2xl flex flex-col animate-slide-left">
        {/* Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Task Orchestration Tree</span>
                {taskData && getStatusBadge(taskData.status)}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Depth: {taskData?.delegationDepth ?? 0} | Subtasks: {subtasks.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadTree}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isLoading && !taskData ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-mono text-xs space-y-2">
              <div className="w-6 h-6 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
              <span>Loading Task Tree Hierarchy...</span>
            </div>
          ) : taskData ? (
            <>
              {/* Parent Task Overview Card */}
              <div className="p-4 rounded-xl bg-surface-elevated/80 border border-surface-border space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                      Executive Directive
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">{taskData.title}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-amber-300 border border-amber-500/30">
                    {taskData.priority}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#070b14] p-3 rounded-lg border border-slate-800 font-sans">
                  {taskData.description}
                </p>

                {/* Primary Assignee Info */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-border/50">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span>
                      Assignee:{' '}
                      <strong className="text-white">
                        {taskData.assignedEmployee
                          ? `${taskData.assignedEmployee.firstName} ${taskData.assignedEmployee.lastName}`
                          : 'Unassigned'}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(taskData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Subtasks Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <GitMerge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Delegated Subtasks ({subtasks.length})</span>
                  </h5>

                  {subtasks.length === 0 && (
                    <button
                      onClick={() => setIsDecomposeOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-[11px] font-semibold text-white flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Decompose Directive</span>
                    </button>
                  )}

                  {allSubtasksDone && taskData.status !== 'COMPLETED' && (
                    <button
                      onClick={handleConsolidate}
                      disabled={isConsolidating}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold text-white flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isConsolidating ? 'Consolidating...' : 'Consolidate Report'}</span>
                    </button>
                  )}
                </div>

                {subtasks.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-surface-elevated/30 border border-surface-border/60 text-slate-400 space-y-2">
                    <p className="text-xs">This directive has not yet been decomposed into subtasks.</p>
                    <button
                      onClick={() => setIsDecomposeOpen(true)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline"
                    >
                      Trigger Autonomous Multi-Agent Decomposition
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {subtasks.map((st, index) => (
                      <div
                        key={st.id}
                        className="p-3.5 rounded-xl bg-surface border border-surface-border hover:border-slate-600 transition-colors space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono text-cyan-300 flex items-center justify-center border border-slate-700">
                              {index + 1}
                            </span>
                            <span className="text-xs font-semibold text-white truncate max-w-[280px]">
                              {st.title}
                            </span>
                          </div>
                          {getStatusBadge(st.status)}
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 pl-7 font-sans">
                          {st.description}
                        </p>

                        <div className="flex items-center justify-between text-[11px] pl-7 pt-1 border-t border-surface-border/40 text-slate-500 font-mono">
                          <span className="text-cyan-300/90 font-medium">
                            {st.assignedEmployee
                              ? `${st.assignedEmployee.firstName} ${st.assignedEmployee.lastName} (${st.assignedEmployee.role})`
                              : 'Pending'}
                          </span>
                          <span>Depth {st.delegationDepth}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Internal Communication Messages for this Task */}
              {messages.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Delegation & Activity Feed ({messages.length})</span>
                  </h5>

                  <div className="space-y-2">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-lg bg-[#070b14] border border-slate-800/80 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-cyan-400 font-semibold font-mono">
                            {m.senderEmployee?.firstName || 'Agent'} &rarr;{' '}
                            {m.recipientEmployee?.firstName || 'Agent'}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-300 font-sans leading-relaxed">{m.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </aside>

      {/* Decompose Modal */}
      <DecomposeTaskModal
        task={taskData}
        isOpen={isDecomposeOpen}
        onClose={() => setIsDecomposeOpen(false)}
        onSuccess={async () => {
          await loadTree();
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
};
