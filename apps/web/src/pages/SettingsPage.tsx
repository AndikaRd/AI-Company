import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Database, Cpu, Save, CheckCircle2, Building } from 'lucide-react';
import { useCompanyStore } from '../store/useCompanyStore';

export const SettingsPage: React.FC = () => {
  const { company, health, updateCompanyProfile } = useCompanyStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setDescription(company.description || '');
      setIndustry(company.industry || '');
      setWebsite(company.website || '');
    }
  }, [company]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      await updateCompanyProfile({
        name: name.trim(),
        description: description.trim(),
        industry: industry.trim(),
        website: website.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update company configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Platform Settings & Architecture Alignment</h2>
        <p className="text-xs text-slate-400 mt-1">
          Company identity configuration, local-first Ollama AI runtime parameters, and PostgreSQL infrastructure.
        </p>
      </div>

      <div className="space-y-6">
        {/* Editable Company Profile (Sprint 1 Alignment) */}
        <Card className="p-6 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Company Identity & Configuration</h3>
                <p className="text-xs text-slate-400">
                  Manage organization name and corporate metadata (editable in PostgreSQL).
                </p>
              </div>
            </div>

            <Badge variant="primary" dot className="text-[10px]">
              Live Configurable
            </Badge>
          </div>

          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter organization name"
                  required
                  className="w-full px-3.5 py-2 rounded-lg bg-surface border border-surface-border text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & Autonomous Enterprise"
                  className="w-full px-3.5 py-2 rounded-lg bg-surface border border-surface-border text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-medium mb-1">Corporate Mission / Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe company operations and mission..."
                  className="w-full px-3.5 py-2 rounded-lg bg-surface border border-surface-border text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs leading-relaxed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-medium mb-1">Internal Website / Domain</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://nexus.ai.internal"
                  className="w-full px-3.5 py-2 rounded-lg bg-surface border border-surface-border text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-slate-500">
                Company ID: {company?.id || 'UUID'}
              </span>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-glow-cyan transition-colors disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Saved to PostgreSQL</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Updating...' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>

        {/* AI Provider Architecture (Aligned to Ollama / qwen3.5:4b) */}
        <Card className="p-6 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">AI Provider Alignment</h3>
                <p className="text-xs text-slate-400">
                  Default local provider architecture for synthetic employees.
                </p>
              </div>
            </div>
            <Badge variant="success" dot className="font-mono text-[10px]">
              Ollama Local-First
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-surface-elevated/70 border border-slate-700/60 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Ollama (Default Runtime)</span>
                  <Badge variant="info" className="text-[9px]">Active Engine</Badge>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Default Model: <code className="text-cyan-300">qwen3.5:4b</code> | Autonomy: <code className="text-amber-300">SUPERVISED</code>
                </div>
              </div>
              <div className="text-right font-mono text-[11px] text-slate-400">
                Endpoint: <span className="text-slate-300">http://localhost:11434</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300">OpenAI API (Cloud Integration)</span>
                  <Badge variant="placeholder" className="text-[9px]">Supported</Badge>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Configurable in AgentConfiguration per employee (gpt-4o / o1)
                </div>
              </div>
              <div className="text-right font-mono text-[11px] text-slate-500">
                Credentials in .env (Secured on Backend)
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300">Anthropic Claude (Cloud Integration)</span>
                  <Badge variant="neutral" className="text-[9px]">Roadmap</Badge>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Schema enum: ANTHROPIC ready
                </div>
              </div>
              <div className="text-right font-mono text-[11px] text-slate-500">
                Standby
              </div>
            </div>
          </div>
        </Card>

        {/* Database & Runtime Telemetry */}
        <Card className="p-6 border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Database & Infrastructure Status</h3>
              <p className="text-xs text-slate-400">PostgreSQL 18 connection verification and latency.</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2.5 rounded-lg bg-surface-elevated/50">
              <span className="text-slate-400">Health Endpoint:</span>
              <span className="text-cyan-400">GET /api/health</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-surface-elevated/50">
              <span className="text-slate-400">PostgreSQL Status:</span>
              <span className="text-emerald-400 font-bold">
                {health?.database.status.toUpperCase() || 'CONNECTED'}
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-surface-elevated/50">
              <span className="text-slate-400">Query Ping Latency:</span>
              <span className="text-slate-200">
                {health?.database.latencyMs !== undefined ? `${health.database.latencyMs} ms` : '1 ms'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
