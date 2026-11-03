import React, { useState, useEffect } from 'react';
import { DepartmentWithCounts, SeniorityLevel, AutonomyLevel, AiProvider } from '@vac/shared';
import { api } from '../../services/api';
import { useCompanyStore } from '../../store/useCompanyStore';
import {
  X,
  Bot,
  Sparkles,
  Shield,
  Cpu,
  Layers,
  Wrench,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ProvisionEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments?: DepartmentWithCounts[];
  onEmployeeCreated?: () => void;
  onSuccess?: () => void;
}

export const ProvisionEmployeeModal: React.FC<ProvisionEmployeeModalProps> = ({
  isOpen,
  onClose,
  departments: propDepartments,
  onEmployeeCreated,
  onSuccess,
}) => {
  const storeDepartments = useCompanyStore((s) => s.departments);
  const departments = propDepartments && propDepartments.length > 0 ? propDepartments : storeDepartments;
  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [seniority, setSeniority] = useState<SeniorityLevel>('SENIOR');
  const [personality, setPersonality] = useState('');
  const [primaryExpertise, setPrimaryExpertise] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [workstationId, setWorkstationId] = useState('engineering-1');

  // AI Runtime Configuration
  const [provider, setProvider] = useState<AiProvider>('OLLAMA');
  const [modelName, setModelName] = useState('qwen3.5:4b');
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('SUPERVISED');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [memoryRetention, setMemoryRetention] = useState('SESSION');

  // Tools & Permissions
  const [tools, setTools] = useState<string[]>([
    'codebase_search',
    'git_commit_analyzer',
    'api_tester',
  ]);
  const [allowNetworkFetch, setAllowNetworkFetch] = useState(true);
  const [allowFileSystemWrite, setAllowFileSystemWrite] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>(['qwen3.5:4b']);

  useEffect(() => {
    if (departments.length > 0 && !departmentId) {
      const eng = departments.find((d) => d.slug === 'engineering') || departments[0];
      setDepartmentId(eng.id);
    }
  }, [departments]);

  useEffect(() => {
    if (isOpen) {
      // Query installed Ollama models
      api.getAiModels()
        .then((models) => {
          if (Array.isArray(models) && models.length > 0) {
            const names = models.map((m: any) => m.name || m);
            setAvailableModels(names);
          }
        })
        .catch(() => {
          // Fallback to default
        });
    }
  }, [isOpen]);

  const prefillAlexProfile = () => {
    const engDept = departments.find((d) => d.slug === 'engineering');
    setFirstName('Alex');
    setLastName('Mercer');
    setEmployeeCode('VAC-ENG-001');
    setJobTitle('Senior Full-Stack Software Engineer');
    if (engDept) setDepartmentId(engDept.id);
    setSeniority('SENIOR');
    setPersonality('Analytical, detail-oriented, pragmatic software architect focused on clean code, system reliability, and modular architecture.');
    setPrimaryExpertise('Full-Stack Systems & AI Runtime Integration');
    setSkillsText('React, TypeScript, NestJS, Node.js, PostgreSQL, Prisma, REST API, Three.js');
    setWorkstationId('engineering-1');
    setProvider('OLLAMA');
    setModelName('qwen3.5:4b');
    setAutonomyLevel('SUPERVISED');
    setSystemPrompt(
      'You are Alex, a Senior Software Engineer in the Engineering department at Virtual AI Company (VAC). You are analytical, detail-oriented, and focused on building robust, scalable full-stack applications. Your core technical domain includes React, Vite, TypeScript, NestJS, PostgreSQL, Prisma, Three.js, and Ollama. When answering, provide structured, technically rigorous insights with clear rationale.'
    );
    setTemperature(0.7);
    setMaxTokens(2048);
    setMemoryRetention('SESSION');
    setTools(['codebase_search', 'git_commit_analyzer', 'api_tester']);
    setAllowNetworkFetch(true);
    setAllowFileSystemWrite(false);
    setRequireApproval(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!firstName.trim() || !lastName.trim() || !employeeCode.trim() || !jobTitle.trim() || !departmentId) {
        throw new Error('Please fill in all required identity and department fields.');
      }

      const skillsArray = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        employeeCode: employeeCode.trim(),
        role: jobTitle.trim(),
        jobTitle: jobTitle.trim(),
        departmentId,
        seniority,
        personality: personality.trim() || undefined,
        primaryExpertise: primaryExpertise.trim() || undefined,
        skills: skillsArray,
        workstationId: workstationId || undefined,
        isAiAgent: true,
        status: 'ACTIVE',
        agentConfig: {
          provider,
          modelName,
          autonomyLevel,
          systemPrompt: systemPrompt.trim(),
          temperature,
          maxTokens,
          toolsEnabled: tools,
          permissionConfig: {
            allowNetworkFetch,
            allowFileSystemWrite,
            requireApprovalForExecution: requireApproval,
          },
          memoryRetention,
        },
      };

      await api.createEmployee(payload);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onEmployeeCreated?.();
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to provision employee:', err);
      setError(err.message || 'Failed to provision employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-surface-border bg-surface-elevated/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Provision AI Employee
              </h3>
              <p className="text-xs text-slate-400">
                Configure corporate identity, organizational role, and local Ollama runtime specifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prefillAlexProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-medium transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pre-fill Alex Profile</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>AI Employee successfully provisioned! Reloading directory...</span>
            </div>
          )}

          {/* Section 1: Employee Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Layers className="w-4 h-4" />
              <span>1. Corporate Identity & Department</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mercer"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Employee Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VAC-ENG-001"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Job Title / Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Department *</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.floorZone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Seniority Level</label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value as SeniorityLevel)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="INTERN">Intern</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="MID">Mid-Level</option>
                  <option value="SENIOR">Senior</option>
                  <option value="LEAD">Lead</option>
                  <option value="PRINCIPAL">Principal</option>
                  <option value="EXECUTIVE">Executive / Director</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Workstation Anchor ID</label>
                <input
                  type="text"
                  placeholder="e.g. engineering-1"
                  value={workstationId}
                  onChange={(e) => setWorkstationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Primary Expertise</label>
                <input
                  type="text"
                  placeholder="e.g. Full-Stack Systems & AI Runtime"
                  value={primaryExpertise}
                  onChange={(e) => setPrimaryExpertise(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Personality Profile</label>
              <textarea
                rows={2}
                placeholder="e.g. Analytical, detail-oriented, pragmatic software architect..."
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Technical Skills (comma-separated)</label>
              <input
                type="text"
                placeholder="React, TypeScript, NestJS, Node.js, PostgreSQL, Prisma, REST API"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="h-px bg-surface-border" />

          {/* Section 2: AI Runtime & Ollama Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Cpu className="w-4 h-4" />
              <span>2. AI Runtime & Ollama Model Configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">AI Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as AiProvider)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="OLLAMA">Ollama (Local Engine)</option>
                  <option value="OPENAI">OpenAI (Cloud API)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Model Name</label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  {!availableModels.includes('qwen3.5:4b') && (
                    <option value="qwen3.5:4b">qwen3.5:4b</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Autonomy Level</label>
                <select
                  value={autonomyLevel}
                  onChange={(e) => setAutonomyLevel(e.target.value as AutonomyLevel)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="SUPERVISED">Supervised (Approval Required)</option>
                  <option value="SEMI_AUTONOMOUS">Semi-Autonomous</option>
                  <option value="AUTONOMOUS">Autonomous</option>
                  <option value="MANUAL">Manual Execution</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">System Prompt *</label>
              <textarea
                rows={4}
                required
                placeholder="Enter system instructions defining persona, role boundaries, and response rules..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Max Output Tokens</label>
                <input
                  type="number"
                  min="256"
                  max="8192"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Memory Retention</label>
                <select
                  value={memoryRetention}
                  onChange={(e) => setMemoryRetention(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="NONE">None (Stateless)</option>
                  <option value="SESSION">Session-Only</option>
                  <option value="SHORT_TERM">Short-Term (Recent 20)</option>
                  <option value="LONG_TERM">Long-Term (Persistent)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-surface-border" />

          {/* Section 3: Tools & Permissions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Wrench className="w-4 h-4" />
              <span>3. Runtime Tools & Permission Sandbox</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'codebase_search', label: 'Codebase Search' },
                { id: 'git_commit_analyzer', label: 'Git Commit Analyzer' },
                { id: 'api_tester', label: 'API Tester' },
              ].map((tool) => (
                <label
                  key={tool.id}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-surface-border cursor-pointer hover:border-slate-700 text-xs text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={tools.includes(tool.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTools([...tools, tool.id]);
                      } else {
                        setTools(tools.filter((t) => t !== tool.id));
                      }
                    }}
                    className="accent-cyan-400 rounded"
                  />
                  <span>{tool.label}</span>
                </label>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-background/50 border border-surface-border space-y-2 text-xs text-slate-300">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Security Boundaries:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowNetworkFetch}
                    onChange={(e) => setAllowNetworkFetch(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Allow Network Fetch</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowFileSystemWrite}
                    onChange={(e) => setAllowFileSystemWrite(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Allow File System Write</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireApproval}
                    onChange={(e) => setRequireApproval(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Require Approval</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-surface border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-glow-cyan flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Provisioning Employee...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Provision Employee</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
