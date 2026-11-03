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
  { name: 'Org & Delegation', path: '/hierarchy', icon: Network },
  { name: 'Task Engine', path: '/tasks', icon: CheckSquare },
  { name: 'Knowledge Base', path: '/knowledge', icon: BookOpen },
  { name: 'System Health', path: '/health', icon: Activity },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { health, company } = useCompanyStore();
  const isHealthy = health?.status === 'ok';

  return (
    <aside className="w-60 bg-surface border-r border-surface-border flex flex-col h-screen select-none shrink-0 z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-surface-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-subtle shrink-0">
          <Bot className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-primary-text tracking-tight truncate">
            {company?.name || 'Nexus AI Dynamics'}
          </div>
          <div className="text-xs text-secondary-text truncate">
            Enterprise Workspace
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-secondary-text">
          Platform
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-surface-muted text-primary-text font-semibold border border-surface-border'
                    : 'text-secondary-text hover:text-primary-text hover:bg-surface-muted/60',
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-secondary-text" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-3.5 border-t border-surface-border bg-surface-muted/40 text-xs">
        <NavLink
          to="/health"
          className="flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors"
        >
          <div className="flex items-center gap-2 text-secondary-text">
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                isHealthy ? 'bg-success' : 'bg-warning animate-pulse',
              )}
            />
            <span className="font-medium text-primary-text">System Status</span>
          </div>
          <span className="text-[11px] text-secondary-text">
            {isHealthy ? 'All Systems Online' : 'Connecting'}
          </span>
        </NavLink>
      </div>
    </aside>
  );
};
