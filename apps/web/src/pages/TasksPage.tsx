import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Plus, Clock } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const KANBAN_COLUMNS = [
    { title: 'Backlog', count: 0, color: 'text-slate-400' },
    { title: 'In Progress', count: 0, color: 'text-amber-400' },
    { title: 'Review & Verification', count: 0, color: 'text-cyan-400' },
    { title: 'Completed', count: 0, color: 'text-emerald-400' },
  ];

  return (
    <div className="h-full overflow-y-auto p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Task Orchestration Queue</h2>
            <Badge variant="placeholder" dot>
              Sprint 2 Roadmap
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Asynchronous agent task execution, multi-agent collaboration pipelines, and deliverable reviews.
          </p>
        </div>

        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated border border-slate-700 text-slate-500 cursor-not-allowed text-xs font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Dispatch Task (Sprint 2)</span>
        </button>
      </div>

      {/* Kanban Board Placeholder Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.title} className="space-y-3">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-300">
              <span className={col.color}>{col.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
                {col.count}
              </span>
            </div>

            <Card className="min-h-[220px] border-dashed border-slate-800/80 bg-surface/40 flex flex-col items-center justify-center p-4 text-center">
              <Clock className="w-6 h-6 text-slate-600 mb-2" />
              <span className="text-xs text-slate-400 font-medium">Queue Empty</span>
              <span className="text-[10px] text-slate-500 mt-1">
                Awaiting Agent Dispatch Engine
              </span>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
