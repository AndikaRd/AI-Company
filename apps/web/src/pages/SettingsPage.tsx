import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Settings, Database, Cpu } from 'lucide-react';
import { useCompanyStore } from '../store/useCompanyStore';

export const SettingsPage: React.FC = () => {
  const { company, health } = useCompanyStore();

  return (
    <div className="h-full overflow-y-auto p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Platform Settings & Architecture</h2>
        <p className="text-xs text-slate-400 mt-1">
          Infrastructure parameters, AI model provider integrations, and 3D rendering configuration.
        </p>
      </div>

      <div className="space-y-4">
        {/* Company Identity */}
        <Card className="p-5 border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Virtual Company Identity</h3>
              <p className="text-xs text-slate-400">Corporate slug, metadata, and active organization profile.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-surface-elevated/70">
              <span className="text-slate-500 block mb-1">Company Name</span>
              <span className="text-slate-200 font-semibold">{company?.name || 'Nexus AI Dynamics'}</span>
            </div>
            <div className="p-3 rounded-lg bg-surface-elevated/70">
              <span className="text-slate-500 block mb-1">Slug Identifier</span>
              <span className="text-slate-200 font-semibold">{company?.slug || 'nexus-ai-dynamics'}</span>
            </div>
            <div className="p-3 rounded-lg bg-surface-elevated/70">
              <span className="text-slate-500 block mb-1">Industry</span>
              <span className="text-slate-200 font-semibold">{company?.industry || 'Autonomous Enterprise'}</span>
            </div>
            <div className="p-3 rounded-lg bg-surface-elevated/70">
              <span className="text-slate-500 block mb-1">Database Primary Key</span>
              <span className="text-cyan-400 text-[11px] truncate block">{company?.id || 'UUID'}</span>
            </div>
          </div>
        </Card>

        {/* AI Provider Config */}
        <Card className="p-5 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Agent Model Providers</h3>
                <p className="text-xs text-slate-400">Default runtime providers for autonomous employees.</p>
              </div>
            </div>
            <Badge variant="placeholder" dot>Sprint 2 Roadmap</Badge>
          </div>

          <div className="space-y-3">
            {[
              { name: 'OpenAI API (GPT-4o / o1)', status: 'Configured in Schema' },
              { name: 'Anthropic Claude (Claude 3.5 Sonnet)', status: 'Planned' },
              { name: 'Google Gemini (Gemini 1.5 Pro)', status: 'Planned' },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/50 text-xs">
                <span className="text-slate-300 font-medium">{p.name}</span>
                <span className="text-slate-500 font-mono text-[11px]">{p.status}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Database & Runtime Telemetry */}
        <Card className="p-5 border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Database & Backend Telemetry</h3>
              <p className="text-xs text-slate-400">PostgreSQL engine connection status and latency.</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded bg-surface-elevated/50">
              <span className="text-slate-400">Health Endpoint:</span>
              <span className="text-cyan-400">GET /api/health</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-elevated/50">
              <span className="text-slate-400">PostgreSQL Status:</span>
              <span className="text-emerald-400 font-bold">{health?.database.status.toUpperCase() || 'CONNECTED'}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-elevated/50">
              <span className="text-slate-400">Round-trip Query Latency:</span>
              <span className="text-slate-200">{health?.database.latencyMs !== undefined ? `${health.database.latencyMs} ms` : '1 ms'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
