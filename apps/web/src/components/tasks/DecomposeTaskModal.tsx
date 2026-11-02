import React, { useState, useEffect } from 'react';
import { Task, Employee } from '@vac/shared';
import { api } from '../../services/api';
import {
  GitMerge,
  X,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { clsx } from 'clsx';

interface DecomposeTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DecomposeTaskModal: React.FC<DecomposeTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [coordinatorId, setCoordinatorId] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api
        .getEmployees()
        .then((emps) => {
          setEmployees(emps);
          // Default to Elena (COO) or Marcus (CTO) or current task assignee
          const defaultCoordinator =
            emps.find((e) => e.employeeCode === 'VAC-OPS-001') ||
            emps.find((e) => e.employeeCode === 'VAC-TECH-001') ||
            emps[0];
          if (defaultCoordinator) {
            setCoordinatorId(defaultCoordinator.id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinatorId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.decomposeTask(task.id, coordinatorId, guidelines);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to decompose task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <GitMerge className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Decompose Directive</h3>
              <p className="text-xs text-slate-400">Autonomous Multi-Agent Task Orchestration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Task Summary */}
          <div className="p-3.5 rounded-xl bg-surface-elevated/70 border border-surface-border/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
              Target Directive
            </span>
            <div className="text-sm font-semibold text-white">{task.title}</div>
            <div className="text-xs text-slate-400 line-clamp-2">{task.description}</div>
          </div>

          {/* Coordinator Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Coordinating Agent (Executive Leadership)
            </label>
            <select
              value={coordinatorId}
              onChange={(e) => setCoordinatorId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              {employees
                .filter((e) => ['EXECUTIVE', 'PRINCIPAL', 'LEAD', 'SENIOR'].includes(e.seniority))
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} — {emp.jobTitle || emp.role} [{emp.employeeCode}]
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-slate-500">
              The coordinator analyzes the directive, structures subtasks, and assigns eligible team members.
            </p>
          </div>

          {/* Guidelines */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Special Decomposition Guidelines (Optional)
            </label>
            <textarea
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="e.g. Ensure QA authors automated regression assertions before engineering release."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-slate-800 text-xs text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-glow-cyan flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className={clsx('w-3.5 h-3.5', isSubmitting && 'animate-spin')} />
              <span>{isSubmitting ? 'Synthesizing Subtasks...' : 'Dispatch Multi-Agent Subtasks'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
