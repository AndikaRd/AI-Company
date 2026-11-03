import React, { useState, useEffect } from 'react';
import { Employee, DepartmentWithCounts } from '@vac/shared';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Bot,
  UserPlus,
  Search,
  Filter,
  MessageSquare,
  Cpu,
  ShieldCheck,
  MapPin,
  RefreshCw,
  Brain,
} from 'lucide-react';
import { useCompanyStore } from '../store/useCompanyStore';
import { api } from '../services/api';
import { AgentChatDrawer } from '../components/chat/AgentChatDrawer';
import { ProvisionEmployeeModal } from '../components/employees/ProvisionEmployeeModal';
import { EmployeeMemoryDrawer } from '../components/employees/EmployeeMemoryDrawer';

export const EmployeesPage: React.FC = () => {
  const { departments } = useCompanyStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');

  // Modal & Drawer State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [activeChatEmployee, setActiveChatEmployee] = useState<Employee | null>(null);
  const [activeMemoryEmployee, setActiveMemoryEmployee] = useState<Employee | null>(null);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = selectedDeptId === 'ALL' || emp.departmentId === selectedDeptId;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesDept;

    const matchesName = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q);
    const matchesRole = emp.role.toLowerCase().includes(q);
    const matchesCode = emp.employeeCode ? emp.employeeCode.toLowerCase().includes(q) : false;
    const skillsList = Array.isArray(emp.skills) ? (emp.skills as string[]) : [];
    const matchesSkills = skillsList.some((s: string) => s.toLowerCase().includes(q));

    return matchesDept && (matchesName || matchesRole || matchesCode || matchesSkills);
  });

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-text tracking-tight">
              AI Employees Directory
            </h2>
            <Badge variant="primary">
              {employees.length} Active Employees
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-secondary-text mt-1">
            Company workforce profiles, behavioral personas, granted capabilities, and assigned workstations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadEmployees}
            title="Refresh directory"
            className="p-2.5 rounded-lg bg-surface border border-surface-border text-secondary-text hover:text-primary-text hover:bg-surface-muted transition-colors shadow-subtle"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsProvisionOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs sm:text-sm font-semibold transition-colors shadow-subtle"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision AI Employee</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-secondary-text absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees by name, role, or skills..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-surface-border text-xs sm:text-sm text-primary-text placeholder-secondary-text focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-subtle"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-secondary-text shrink-0" />
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface border border-surface-border text-xs text-primary-text focus:outline-none focus:border-primary-500 shadow-subtle"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d: DepartmentWithCounts) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-secondary-text">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-xs">Loading employee directory...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-surface-border">
          <div className="w-14 h-14 rounded-2xl bg-surface-muted text-secondary-text flex items-center justify-center mx-auto mb-4">
            <Bot className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-primary-text">No Employees Found</h3>
          <p className="mt-1 text-xs text-secondary-text max-w-md mx-auto leading-relaxed">
            {searchQuery || selectedDeptId !== 'ALL'
              ? 'No employees matched your current search or filter criteria.'
              : 'No employees are provisioned yet.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => {
            const agentConfig = emp.agentConfig;
            return (
              <Card
                key={emp.id}
                className="p-5 flex flex-col justify-between hover:border-stone-300 transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-surface-muted text-primary-700 flex items-center justify-center font-bold shadow-subtle">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-primary-text group-hover:text-primary-600 transition-colors">
                          {emp.firstName} {emp.lastName}
                        </h3>
                        <p className="text-xs text-secondary-text font-medium">{emp.role}</p>
                      </div>
                    </div>

                    <Badge variant="neutral" className="text-[10px]">
                      {emp.seniority}
                    </Badge>
                  </div>

                  {/* Status & Department Badges */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${emp.department?.color || '#4F6F64'}30`,
                        color: '#292524',
                        border: `1px solid ${emp.department?.color || '#4F6F64'}60`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: emp.department?.color || '#4F6F64' }}
                      />
                      {emp.department?.name || 'Department'}
                    </span>

                    <Badge variant="success" dot className="text-[10px]">
                      Active
                    </Badge>
                  </div>

                  {/* Personality / Bio */}
                  {emp.personality && (
                    <p className="mt-3 text-xs text-secondary-text line-clamp-2 leading-relaxed italic">
                      "{emp.personality}"
                    </p>
                  )}

                  {/* Runtime Spec Details */}
                  <div className="mt-3.5 p-3 rounded-lg bg-surface-muted/60 border border-surface-border space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-secondary-text">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-primary-600" />
                        AI Engine:
                      </span>
                      <span className="text-primary-text font-semibold">
                        {agentConfig?.modelName || 'qwen3.5:4b'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-secondary-text">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Autonomy:
                      </span>
                      <span className="text-primary-text font-medium">
                        {agentConfig?.autonomyLevel || 'SUPERVISED'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-secondary-text">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        Workstation:
                      </span>
                      <span className="text-primary-text font-medium">
                        {emp.workstationId || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Skills Pills */}
                  {emp.skills && Array.isArray(emp.skills) && emp.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(emp.skills as string[]).slice(0, 4).map((skill: string, sIdx: number) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-full bg-surface-muted text-secondary-text text-[10px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {emp.skills.length > 4 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-secondary-text">
                          +{emp.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveMemoryEmployee(emp)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface hover:bg-surface-muted text-primary-text text-xs font-semibold border border-surface-border transition shadow-subtle"
                  >
                    <Brain className="w-3.5 h-3.5 text-primary-600" />
                    <span>Memory</span>
                  </button>

                  <button
                    onClick={() => setActiveChatEmployee(emp)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition shadow-subtle"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Direct Chat</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Drawers & Modals */}
      <AgentChatDrawer
        employee={activeChatEmployee}
        isOpen={Boolean(activeChatEmployee)}
        onClose={() => setActiveChatEmployee(null)}
      />

      <EmployeeMemoryDrawer
        employee={activeMemoryEmployee}
        isOpen={Boolean(activeMemoryEmployee)}
        onClose={() => setActiveMemoryEmployee(null)}
      />

      <ProvisionEmployeeModal
        isOpen={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
        departments={departments}
        onEmployeeCreated={loadEmployees}
        onSuccess={loadEmployees}
      />
    </div>
  );
};
