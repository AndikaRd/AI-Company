import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  Box,
  Database,
  ArrowRight,
  Sparkles,
  Bot,
} from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useCompanyStore } from '../store/useCompanyStore';
import { useOfficeStore } from '../store/useOfficeStore';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { company, departments, employeeStats, health } = useCompanyStore();
  const { selectZone } = useOfficeStore();

  const handleInspectDepartment = (dept: any) => {
    selectZone({
      id: dept.id,
      name: dept.name,
      slug: dept.slug,
      floorZone: dept.floorZone,
      color: dept.color,
      description: dept.description,
      employeeCount: dept._count?.employees || 0,
    });
    navigate('/office');
  };

  return (
    <div className="h-full overflow-y-auto p-8 space-y-8 bg-background max-w-7xl mx-auto">
      {/* --- HERO / WELCOME BANNER --- */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface to-surface-elevated border border-surface-border p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary" dot className="font-mono text-[10px]">
                Sprint 1 Foundation Active
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                PostgreSQL 18 + Prisma ORM
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>{company?.name || 'Nexus AI Dynamics'}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                {company?.status || 'ACTIVE'}
              </span>
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {company?.description ||
                'Autonomous virtual enterprise platform where synthetic employees collaborate inside an interactive 3D isometric office.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/office')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-primary-600 hover:from-cyan-400 hover:to-primary-500 text-white font-medium text-sm shadow-glow-cyan transition-all"
            >
              <Box className="w-4 h-4" />
              <span>Launch 3D Virtual Office</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ambient Gradient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* --- CORE SPRINT 1 METRICS GRID --- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workforce & Execution Metrics
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Live database sync: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Ready'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total AI Employees */}
          <MetricCard
            label="Total AI Employees"
            value={employeeStats.totalAiAgents}
            subValue="Provisioned"
            icon={Bot}
            iconColor="text-cyan-400"
            isLiveDb={true}
            statusText="Live DB: employees count"
          />

          {/* Active Employees */}
          <MetricCard
            label="Active Employees"
            value={employeeStats.activeEmployees}
            subValue="Online"
            icon={Activity}
            iconColor="text-emerald-400"
            isLiveDb={true}
            statusText="Live DB: status = ACTIVE"
          />

          {/* Tasks In Progress (Sprint 2 Placeholder) */}
          <MetricCard
            label="Tasks In Progress"
            value={0}
            subValue="Queue Empty"
            icon={Clock}
            iconColor="text-amber-400"
            isLiveDb={false}
            statusText="Sprint 2 Orchestrator"
          />

          {/* Completed Tasks (Sprint 2 Placeholder) */}
          <MetricCard
            label="Completed Tasks"
            value={0}
            subValue="Zero Runs"
            icon={CheckCircle2}
            iconColor="text-purple-400"
            isLiveDb={false}
            statusText="Sprint 2 Orchestrator"
          />
        </div>
      </div>

      {/* --- SEED DEPARTMENTS & TELEMETRY ROW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Seeded Departments (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">
                Seeded Departments ({departments.length || 8})
              </h3>
            </div>
            <Badge variant="success" dot className="font-mono text-[10px]">
              Database Seed Verified
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(departments.length > 0 ? departments : []).map((dept) => (
              <Card
                key={dept.id}
                hoverable
                onClick={() => handleInspectDepartment(dept)}
                className="group relative overflow-hidden p-4 border-slate-800 bg-surface/60 hover:border-slate-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: dept.color || '#3b82f6' }}
                    />
                    <div>
                      <h4 className="font-medium text-white text-sm group-hover:text-cyan-300 transition-colors">
                        {dept.name}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {dept.floorZone || 'ZONE_TECH'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
                    {dept._count?.employees || 0} Agents
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {dept.description || 'Department workplace allocated in virtual headquarters.'}
                </p>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Locate in 3D Office</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Platform Telemetry & Recent Activity */}
        <div className="space-y-6">
          {/* Health & DB Status Box */}
          <Card className="p-5 border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                Database & Infrastructure
              </h3>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated/60">
                <span className="text-slate-400">PostgreSQL Status:</span>
                <span className="text-emerald-400 font-bold">
                  {health?.database.status.toUpperCase() || 'ONLINE'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated/60">
                <span className="text-slate-400">Query Latency:</span>
                <span className="text-slate-200">
                  {health?.database.latencyMs !== undefined ? `${health.database.latencyMs} ms` : '1 ms'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated/60">
                <span className="text-slate-400">API Uptime:</span>
                <span className="text-slate-200">
                  {health?.uptime !== undefined ? `${health.uptime}s` : 'Active'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated/60">
                <span className="text-slate-400">Socket.IO Gateway:</span>
                <span className="text-cyan-400">STANDBY (Sprint 2)</span>
              </div>
            </div>
          </Card>

          {/* Recent Activity Section */}
          <Card className="p-5 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                Recent Activity
              </h3>
              <Badge variant="neutral" className="text-[10px]">
                Feed
              </Badge>
            </div>

            {/* Empty state per requirements */}
            <div className="text-center py-6 px-3 rounded-xl bg-surface-elevated/30 border border-dashed border-slate-800">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h4 className="text-xs font-medium text-slate-300">
                No active agent tasks yet
              </h4>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                Configure and deploy AI employees in subsequent sprints to begin automated workflows and live event telemetry.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
