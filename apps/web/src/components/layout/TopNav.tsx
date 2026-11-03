import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import {
  RefreshCw,
  Building,
  Activity,
  Bell,
  Users,
} from 'lucide-react';
import { useCompanyStore } from '../../store/useCompanyStore';
import { useOfficeStore } from '../../store/useOfficeStore';
import { Badge } from '../ui/Badge';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Executive Dashboard', subtitle: 'Company workforce capacity and strategic operations' },
  '/office': { title: 'Virtual Office 3D', subtitle: 'Spatial workplace simulation and real-time employee presence' },
  '/employees': { title: 'AI Employees', subtitle: 'Company workforce directory and specialized configurations' },
  '/hierarchy': { title: 'Organization & Delegation', subtitle: 'Reporting structure and multi-agent coordination' },
  '/tasks': { title: 'Task Engine', subtitle: 'Workflow execution, decomposition, and supervisory approval' },
  '/knowledge': { title: 'Knowledge Base', subtitle: 'Institutional memory and collective company intelligence' },
  '/health': { title: 'System Health', subtitle: 'Infrastructure telemetry, database connection, and AI runtime' },
  '/settings': { title: 'Settings', subtitle: 'Company workspace preferences and platform configuration' },
};

export const TopNav: React.FC = () => {
  const location = useLocation();
  const { company, health, isLoading, fetchData, employees } = useCompanyStore();
  const { employeeActivities } = useOfficeStore();

  const pageMeta = PAGE_TITLES[location.pathname] || {
    title: 'Virtual AI Company',
    subtitle: 'Autonomous Enterprise Architecture',
  };

  const isHealthy = health?.status === 'ok';

  // Compute live workforce numbers
  const totalEmployees = employees.length;
  const workingCount = Object.values(employeeActivities).filter(
    (a) => a.activity === 'WORKING',
  ).length;
  const meetingCount = Object.values(employeeActivities).filter(
    (a) => a.activity === 'TALKING',
  ).length;

  return (
    <header className="h-16 bg-surface border-b border-surface-border px-6 flex items-center justify-between z-10 shrink-0 text-primary-text">
      {/* Current Page Title */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-bold text-primary-text tracking-tight">
            {pageMeta.title}
          </h1>
          <p className="text-xs text-secondary-text">
            {pageMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Action & Metric Controls */}
      <div className="flex items-center gap-3">
        {/* Company Active Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-muted border border-surface-border text-xs">
          <Building className="w-4 h-4 text-primary-600" />
          <span className="font-semibold text-primary-text">
            {company?.name || 'Nexus AI Dynamics'}
          </span>
          <Badge variant="success" dot className="text-[10px]">
            Operating
          </Badge>
        </div>

        {/* Live Workforce Counter */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-muted border border-surface-border text-xs text-secondary-text">
          <span className="flex items-center gap-1 font-medium text-primary-text">
            <Users className="w-3.5 h-3.5 text-primary-600" />
            <span>{totalEmployees || 5} Employees</span>
          </span>
          <span className="text-surface-border">•</span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>{workingCount} Working</span>
          </span>
          <span className="text-surface-border">•</span>
          <span className="text-sky-700 font-medium">
            <span>{meetingCount} In Meeting</span>
          </span>
        </div>

        {/* System Health Link */}
        <NavLink
          to="/health"
          title="System Health & Infrastructure"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-muted border border-surface-border text-secondary-text hover:text-primary-text text-xs font-medium transition-colors"
        >
          <Activity className="w-3.5 h-3.5 text-primary-600" />
          <span className="hidden md:inline">System Health</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? 'bg-success' : 'bg-warning animate-pulse'
            }`}
          />
        </NavLink>

        {/* Notifications Icon Button */}
        <button
          title="Notifications"
          className="p-2 rounded-lg hover:bg-surface-muted border border-surface-border text-secondary-text hover:text-primary-text transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Refresh Button */}
        <button
          onClick={() => fetchData()}
          disabled={isLoading}
          title="Refresh Backend Data"
          className="p-2 rounded-lg hover:bg-surface-muted border border-surface-border text-secondary-text hover:text-primary-text transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
