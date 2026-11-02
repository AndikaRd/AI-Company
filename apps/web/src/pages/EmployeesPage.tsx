import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Bot, UserPlus, Search, Filter } from 'lucide-react';
import { useCompanyStore } from '../store/useCompanyStore';

export const EmployeesPage: React.FC = () => {
  const { employeeStats } = useCompanyStore();

  return (
    <div className="h-full overflow-y-auto p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">AI Employees Directory</h2>
            <Badge variant="placeholder" dot>
              Sprint 2 Roadmap
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous agent personas, LLM system prompts, memory retention, and tool permissions.
          </p>
        </div>

        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated border border-slate-700 text-slate-500 cursor-not-allowed text-xs font-medium"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Agent (Sprint 2)</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            disabled
            placeholder="Search AI agents by name, role, or department..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-surface-border text-xs text-slate-400 placeholder-slate-600 cursor-not-allowed focus:outline-none"
          />
        </div>
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-surface-border text-slate-500 text-xs cursor-not-allowed"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>
      </div>

      {/* Directory Placeholder Empty State */}
      <Card className="p-12 text-center border-dashed border-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-glow-cyan">
          <Bot className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-white">
          No AI Employees Provisioned Yet
        </h3>
        <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          The database schema for <code className="text-cyan-300 font-mono">Employee</code> and{' '}
          <code className="text-cyan-300 font-mono">AgentConfiguration</code> is fully initialized and migrated in PostgreSQL.
          Interactive provisioning, prompt assignment, and 3D avatar GLB binding will be activated in Sprint 2.
        </p>

        <div className="mt-6 inline-flex items-center gap-4 text-xs font-mono text-slate-500 border border-slate-800 p-2.5 rounded-lg bg-background/50">
          <span>Total Database Agents: {employeeStats.totalAiAgents}</span>
          <span>•</span>
          <span>Ready Workstations: 14</span>
        </div>
      </Card>
    </div>
  );
};
