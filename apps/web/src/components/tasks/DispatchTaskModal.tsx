import React, { useState } from 'react';
import { Employee, TaskPriority } from '@vac/shared';
import { api } from '../../services/api';
import { useCompanyStore } from '../../store/useCompanyStore';
import {
  X,
  Play,
  Sparkles,
  AlertCircle,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

interface DispatchTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: Employee[];
  onTaskCreated?: () => void;
  onSuccess?: () => void;
}

export const DispatchTaskModal: React.FC<DispatchTaskModalProps> = ({
  isOpen,
  onClose,
  employees: propEmployees,
  onTaskCreated,
  onSuccess,
}) => {
  const storeEmployees = useCompanyStore((s) => s.employees);
  const employees = propEmployees && propEmployees.length > 0 ? propEmployees : storeEmployees;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(
    employees[0]?.id || 'ab4620cd-0eaa-468f-930c-712ec7496797',
  );
  const [workspacePath, setWorkspacePath] = useState(
    'c:\\Users\\AndikaRd\\Documents\\AI Company\\infrastructure\\test-workspaces\\react-counter-app',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (presetType: 'fix-bug' | 'run-audit' | 'deploy') => {
    if (presetType === 'fix-bug') {
      setTitle('Fix TypeScript compile error in React Counter App');
      setDescription(
        'Inspect this project in the authorized workspace. The project is currently failing to build with a TypeScript type error. 1) List and inspect the files to understand the project structure. 2) Run the build to examine the exact compile error. 3) Read the offending file and fix the bug with edit_file. 4) Run the build again to confirm exit code 0. 5) Output a final engineering summary with the verified build results.',
      );
      setWorkspacePath(
        'c:\\Users\\AndikaRd\\Documents\\AI Company\\infrastructure\\test-workspaces\\react-counter-app',
      );
      setPriority('HIGH');
    } else if (presetType === 'run-audit') {
      setTitle('Workspace Security & Dependency Audit');
      setDescription(
        'Inspect the project in the workspace. Read package.json, verify all dependency constraints, check git status, and execute run_build to ensure compile stability.',
      );
      setPriority('MEDIUM');
    } else if (presetType === 'deploy') {
      setTitle('Deploy React Counter App to Staging');
      setDescription(
        'Please verify the application build and deploy the tested artifact to the staging environment using the deploy_application tool.',
      );
      setPriority('HIGH');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !assignedEmployeeId) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.createTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        assignedEmployeeId,
        workspacePath: workspacePath.trim() || undefined,
      });

      onTaskCreated?.();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to create task:', err);
      setError(err.message || 'Failed to dispatch task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-surface-border bg-surface-elevated/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dispatch Engineering Task</h3>
              <p className="text-xs text-slate-400">
                Assign an autonomous software engineering directive to Alex Mercer.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-6 pt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 uppercase">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('fix-bug')}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Fix TypeScript Bug</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('deploy')}
            className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-mono transition-all flex items-center gap-1"
          >
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            <span>Staging Deploy</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Task Directive Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Fix TypeScript compile error in React Counter App"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assignee</label>
              <select
                value={assignedEmployeeId}
                onChange={(e) => setAssignedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Workspace Sandbox Path</label>
            <div className="relative">
              <FileCode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={workspacePath}
                onChange={(e) => setWorkspacePath(e.target.value)}
                placeholder="Relative or absolute path to authorized workspace directory"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-surface-border text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              All tool file reading, editing, and execution commands will be strictly sandboxed to this path.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Objective & Execution Instructions *</label>
            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed engineering requirements, files to inspect, expected tests or build verification..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none font-sans"
            />
          </div>

          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-surface border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-glow-cyan flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black" />
                  <span>Dispatch to Agent</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
