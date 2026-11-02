import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  RefreshCw,
  Server,
  Building,
  Radio,
} from 'lucide-react';
import { useCompanyStore } from '../../store/useCompanyStore';
import { Badge } from '../ui/Badge';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Executive Overview', subtitle: 'AI workforce capacity and operational telemetry' },
  '/office': { title: '3D Isometric Virtual Office', subtitle: 'Spatial interaction & workstation floor layout' },
  '/employees': { title: 'AI Employees & Agents', subtitle: 'Autonomous agent directory and system prompts' },
  '/tasks': { title: 'Task Orchestration Queue', subtitle: 'Real-time workflow execution engine' },
  '/settings': { title: 'Platform Settings', subtitle: 'LLM providers, graphics fidelity, and database config' },
};

export const TopNav: React.FC = () => {
  const location = useLocation();
  const { company, health, isLoading, fetchData } = useCompanyStore();
  const pageMeta = PAGE_TITLES[location.pathname] || {
    title: 'Virtual AI Company',
    subtitle: 'Autonomous Enterprise Architecture',
  };

  const isConnected = health?.status === 'ok';

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-surface-border px-6 flex items-center justify-between z-10 shrink-0">
      {/* Current Page Title */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-semibold text-white tracking-wide">
            {pageMeta.title}
          </h1>
          <p className="text-xs text-slate-400">
            {pageMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Action / Telemetry Controls */}
      <div className="flex items-center gap-4">
        {/* Company Active Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated/70 border border-slate-700/60 text-xs">
          <Building className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-slate-300 font-medium">
            {company?.name || 'Nexus AI Dynamics'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            [Seed v1]
          </span>
        </div>

        {/* Live Backend Connection Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated/70 border border-slate-700/60 text-xs font-mono">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300">API:</span>
          {isConnected ? (
            <Badge variant="success" dot className="text-[10px]">
              {health?.database.status === 'connected' ? 'DB CONNECTED' : 'ONLINE'}
            </Badge>
          ) : (
            <Badge variant="danger" dot className="text-[10px]">
              CONNECTING...
            </Badge>
          )}
        </div>

        {/* Workforce Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated/50 border border-slate-700/40 text-xs font-mono">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="text-slate-400">RUNTIME:</span>
          <span className="text-amber-300 font-medium">IDLE</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => fetchData()}
          disabled={isLoading}
          title="Refresh Backend Data"
          className="p-2 rounded-lg bg-surface-elevated/70 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
