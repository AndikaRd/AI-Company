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
} from 'lucide-react';
import { useCompanyStore } from '../store/useCompanyStore';
import { api } from '../services/api';
import { AgentChatDrawer } from '../components/chat/AgentChatDrawer';
import { ProvisionEmployeeModal } from '../components/employees/ProvisionEmployeeModal';
import { EmployeeMemoryDrawer } from '../components/employees/EmployeeMemoryDrawer';
import { Brain } from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const { departments, fetchData } = useCompanyStore();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              AI Employees Directory
            </h2>
            <Badge variant="success" dot>
              Sprint 2 Live
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Autonomous agent personas, local Ollama execution runtimes, and workstation assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadEmployees}
            title="Refresh directory"
            className="p-2.5 rounded-lg bg-surface border border-surface-border text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsProvisionOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs sm:text-sm font-bold transition-all shadow-glow-cyan"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision AI Employee</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AI agents by name, role, code, or skill..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-surface-border text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-surface border border-surface-border text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
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
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs font-mono">Loading provisioned employees from database...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-glow-cyan">
            <Bot className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white">No AI Employees Found</h3>
          <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {searchQuery || selectedDeptId !== 'ALL'
              ? 'No AI employees matched your current search or filter criteria.'
              : 'No employees are provisioned yet. Click "Provision AI Employee" to initialize Alex Mercer.'}
          </p>
          <button
            onClick={() => setIsProvisionOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision First Employee</span>
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => {
            const agentConfig = emp.agentConfig;
            return (
              <Card
                key={emp.id}
                className="p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-all border-surface-border bg-surface-elevated/40 group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shadow-glow-cyan">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {emp.firstName} {emp.lastName}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">{emp.role}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {emp.employeeCode}
                    </span>
                  </div>

                  {/* Status & Department Badges */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${emp.department?.color || '#3b82f6'}20`,
                        color: emp.department?.color || '#60a5fa',
                        border: `1px solid ${emp.department?.color || '#3b82f6'}40`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: emp.department?.color || '#60a5fa' }}
                      />
                      {emp.department?.name || 'Department'}
                    </span>

                    <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-slate-300 uppercase">
                      {emp.seniority}
                    </span>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      ACTIVE
                    </span>
                  </div>

                  {/* Personality / Bio */}
                  {emp.personality && (
                    <p className="mt-3.5 text-xs text-slate-400 line-clamp-2 leading-relaxed italic">
                      "{emp.personality}"
                    </p>
                  )}

                  {/* Runtime Spec Details */}
                  <div className="mt-4 p-3 rounded-xl bg-background/60 border border-surface-border space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        AI Engine:
                      </span>
                      <span className="text-cyan-300 font-semibold">
                        {agentConfig?.modelName || 'qwen3.5:4b'} ({agentConfig?.provider || 'OLLAMA'})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Autonomy:
                      </span>
                      <span className="text-slate-300">
                        {agentConfig?.autonomyLevel || 'SUPERVISED'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        Workstation:
                      </span>
                      <span className="text-slate-300">
                        {emp.workstationId || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Skills Tags */}
                  {Array.isArray(emp.skills) && emp.skills.length > 0 && (
                    <div className="mt-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5">
                        Core Competencies
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(emp.skills as string[]).slice(0, 6).map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 text-[10px] text-slate-300 font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                        {(emp.skills as string[]).length > 6 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
                            +{(emp.skills as string[]).length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-4 border-t border-surface-border grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveChatEmployee(emp)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-glow-cyan"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>

                  <button
                    onClick={() => setActiveMemoryEmployee(emp)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-all"
                  >
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <span>Memory</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Provision Employee Modal */}
      <ProvisionEmployeeModal
        isOpen={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
        departments={departments}
        onEmployeeCreated={() => {
          loadEmployees();
          fetchData();
        }}
      />

      {/* Interactive Chat Slide-Over Drawer */}
      <AgentChatDrawer
        employee={activeChatEmployee}
        isOpen={Boolean(activeChatEmployee)}
        onClose={() => setActiveChatEmployee(null)}
      />

      {/* Sprint 5: Employee Memory Drawer */}
      <EmployeeMemoryDrawer
        employee={activeMemoryEmployee}
        isOpen={Boolean(activeMemoryEmployee)}
        onClose={() => setActiveMemoryEmployee(null)}
      />
    </div>
  );
};
