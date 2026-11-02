import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Users,
  CheckSquare,
  Settings,
  Bot,
  Activity,
  Network,
  BookOpen,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useCompanyStore } from '../../store/useCompanyStore';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Virtual Office 3D', path: '/office', icon: Box },
  { name: 'AI Employees', path: '/employees', icon: Users },
  { name: 'Org & Delegation', path: '/hierarchy', icon: Network, badge: 'Sprint 4' },
  { name: 'Task Engine', path: '/tasks', icon: CheckSquare, badge: 'Sprint 4' },
  { name: 'Knowledge Base', path: '/knowledge', icon: BookOpen, badge: 'Sprint 5', highlight: true },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { health, company } = useCompanyStore();
  const isHealthy = health?.status === 'ok';

  return (
    <aside className="w-64 bg-surface border-r border-surface-border flex flex-col h-screen select-none shrink-0 z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-surface-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-primary-600 to-indigo-600 p-[1.5px] shadow-glow-cyan">
          <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
            <Bot className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="font-bold text-sm tracking-wider text-white uppercase flex items-center gap-1.5">
            <span>VAC</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
              v0.1
            </span>
          </div>
          <div className="text-xs text-slate-400 truncate max-w-[140px]">
            {company?.name || 'Virtual AI Company'}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Workforce Hub
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-600/15 text-primary-300 border border-primary-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated/60',
                  item.highlight && !isActive && 'text-cyan-400/90 hover:text-cyan-300',
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-surface-border bg-background/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>PostgreSQL Backend</span>
          </div>
          <span
            className={clsx(
              'w-2 h-2 rounded-full',
              isHealthy ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
            )}
          />
        </div>

        <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <span>Latency:</span>
          <span>{health?.database.latencyMs !== undefined ? `${health.database.latencyMs}ms` : '--'}</span>
        </div>
        <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <span>Departments:</span>
          <span>{company?.departments?.length || 8} zones</span>
        </div>
      </div>
    </aside>
  );
};
