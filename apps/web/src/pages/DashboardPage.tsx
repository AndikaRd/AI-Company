import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Layers,
  Box,
  ArrowRight,
  Users,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useCompanyStore } from '../store/useCompanyStore';
import { useOfficeStore } from '../store/useOfficeStore';
import { api } from '../services/api';
import { Task } from '@vac/shared';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { company, departments, employees } = useCompanyStore();
  const { employeeActivities, selectZone } = useOfficeStore();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.getTasks().then(setTasks).catch((err) => {
      console.warn('Could not load tasks for dashboard metrics', err);
    });
  }, []);

  const totalEmployees = employees.length || 5;
  const workingCount = Object.values(employeeActivities).filter(
    (a) => a.activity === 'WORKING',
  ).length;
  const meetingCount = Object.values(employeeActivities).filter(
    (a) => a.activity === 'TALKING',
  ).length;

  const inProgressTasks = tasks.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'WAITING_APPROVAL' || t.status === 'PLANNING',
  ).length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;

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
    <div className="h-full overflow-y-auto p-6 sm:p-8 space-y-6 bg-background max-w-7xl mx-auto">
      {/* Executive Welcome Banner */}
      <Card className="p-6 bg-surface border-surface-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-secondary-text">
                Company Executive Overview
              </span>
              <Badge variant="success" dot className="text-[10px]">
                Operating
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-primary-text">
              {company?.name || 'Nexus AI Dynamics'}
            </h2>
            <p className="text-sm text-secondary-text max-w-2xl leading-relaxed">
              {company?.description ||
                'Autonomous virtual enterprise platform where AI employees collaborate inside a modern 3D office environment.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/office')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm transition-colors shadow-subtle"
            >
              <Box className="w-4 h-4" />
              <span>Enter Virtual Office 3D</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Core Company KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-secondary-text uppercase tracking-wider">
            Workforce & Operations Telemetry
          </h3>
          <span className="text-xs text-secondary-text">
            {totalEmployees} provisioned employees
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Workforce */}
          <MetricCard
            label="Total AI Workforce"
            value={totalEmployees}
            subValue="Employees"
            icon={Users}
            iconColor="text-primary-600"
            statusText="Fully Provisioned"
            statusVariant="success"
          />

          {/* Working Employees */}
          <MetricCard
            label="Employees Working"
            value={workingCount}
            subValue="Active"
            icon={Activity}
            iconColor="text-emerald-600"
            statusText={workingCount > 0 ? 'Executing Tasks' : 'Standing By'}
            statusVariant={workingCount > 0 ? 'success' : 'neutral'}
          />

          {/* Employees in Discussion / Meetings */}
          <MetricCard
            label="In Discussion"
            value={meetingCount}
            subValue="Collaborating"
            icon={MessageSquare}
            iconColor="text-sky-600"
            statusText="Inter-Agent Sync"
            statusVariant="info"
          />

          {/* Completed Tasks */}
          <MetricCard
            label="Completed Tasks"
            value={completedTasks}
            subValue={`${inProgressTasks} In Queue`}
            icon={CheckCircle2}
            iconColor="text-primary-700"
            statusText={`${completedTasks} Finished`}
            statusVariant="success"
          />
        </div>
      </div>

      {/* Departments Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-bold text-primary-text">
                Company Departments ({departments.length || 8})
              </h3>
            </div>
            <span className="text-xs text-secondary-text">
              Allocated Workspaces
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(departments.length > 0 ? departments : []).map((dept) => {
              const count = dept._count?.employees ?? 0;
              return (
                <Card
                  key={dept.id}
                  hoverable
                  onClick={() => handleInspectDepartment(dept)}
                  className="p-4 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: dept.color || '#4F6F64' }}
                        />
                        <div>
                          <h4 className="font-semibold text-primary-text text-sm group-hover:text-primary-600 transition-colors">
                            {dept.name}
                          </h4>
                          <span className="text-xs text-secondary-text">
                            {dept.floorZone || 'Workplace Zone'}
                          </span>
                        </div>
                      </div>

                      <Badge variant="neutral" className="text-[11px]">
                        {count} {count === 1 ? 'Employee' : 'Employees'}
                      </Badge>
                    </div>

                    <p className="mt-2.5 text-xs text-secondary-text line-clamp-2 leading-relaxed">
                      {dept.description || 'Department workplace allocated in virtual headquarters.'}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-surface-border flex items-center justify-between text-xs font-medium text-primary-600 group-hover:translate-x-0.5 transition-transform">
                    <span>View in 3D Office</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Company Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary-text">
              Recent Activity
            </h3>
            <span className="text-xs text-secondary-text">
              Live Feed
            </span>
          </div>

          <Card className="p-4 space-y-3">
            {Object.keys(employeeActivities).length > 0 ? (
              <div className="space-y-3">
                {employees.map((emp) => {
                  const act = employeeActivities[emp.id];
                  const state = act?.activity || 'IDLE';
                  return (
                    <div
                      key={emp.id}
                      className="p-2.5 rounded-lg bg-surface-muted/60 border border-surface-border text-xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-semibold text-primary-text block">
                          {emp.firstName} {emp.lastName}
                        </span>
                        <span className="text-[11px] text-secondary-text truncate max-w-[180px] block">
                          {act?.taskTitle || emp.role}
                        </span>
                      </div>
                      <Badge
                        variant={
                          state === 'WORKING'
                            ? 'success'
                            : state === 'THINKING'
                            ? 'primary'
                            : state === 'WAITING_APPROVAL'
                            ? 'warning'
                            : 'neutral'
                        }
                        dot
                        className="text-[10px]"
                      >
                        {state === 'WORKING' ? 'Working' : state === 'THINKING' ? 'Thinking' : 'Available'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 px-3 rounded-lg bg-surface-muted/30 border border-dashed border-surface-border">
                <Sparkles className="w-6 h-6 text-secondary-text mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-primary-text">
                  Workforce Available
                </h4>
                <p className="mt-1 text-xs text-secondary-text leading-relaxed">
                  All 5 AI employees are situated at their workstations and ready for task assignments.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
