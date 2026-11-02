import React, { useState, useEffect } from 'react';
import { OrganizationHierarchyNode, Employee } from '@vac/shared';
import { api } from '../services/api';
import { OrgChartView } from '../components/hierarchy/OrgChartView';
import { InternalAgentCommsView } from '../components/hierarchy/InternalAgentCommsView';
import { AgentChatDrawer } from '../components/chat/AgentChatDrawer';
import { Badge } from '../components/ui/Badge';
import {
  Network,
  MessageSquare,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { clsx } from 'clsx';

export const HierarchyPage: React.FC = () => {
  const [hierarchy, setHierarchy] = useState<OrganizationHierarchyNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TREE' | 'COMMS'>('TREE');
  const [activeChatEmployee, setActiveChatEmployee] = useState<Employee | null>(null);

  const loadHierarchy = async () => {
    setIsLoading(true);
    try {
      const data = await api.getOrganizationHierarchy();
      setHierarchy(data);
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHierarchy();
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Network className="w-6 h-6 text-cyan-400" />
              <span>Multi-Agent Organizational Hierarchy</span>
            </h2>
            <Badge variant="primary" dot>
              Sprint 4 Live
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Supervisory reporting lines, cross-department task delegation, and internal agent communication.
          </p>
        </div>

        <button
          onClick={loadHierarchy}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-surface border border-surface-border hover:border-cyan-500/40 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 transition-all self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5 text-cyan-400', isLoading && 'animate-spin')} />
          <span>Refresh Structure</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2">
        <button
          onClick={() => setActiveTab('TREE')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'TREE'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated',
          )}
        >
          <GitBranch className="w-4 h-4" />
          <span>Organizational Chart</span>
        </button>

        <button
          onClick={() => setActiveTab('COMMS')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'COMMS'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated',
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Internal Agent Communications</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'TREE' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-mono text-xs space-y-2">
              <div className="w-6 h-6 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
              <span>Resolving Organizational Reporting Trees...</span>
            </div>
          ) : (
            <div className="bg-surface/50 rounded-2xl border border-surface-border p-2 sm:p-6 backdrop-blur-sm">
              <OrgChartView
                hierarchy={hierarchy}
                onChatWithEmployee={(emp) => setActiveChatEmployee(emp)}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'COMMS' && <InternalAgentCommsView />}

      {/* Chat Drawer */}
      <AgentChatDrawer
        employee={activeChatEmployee}
        isOpen={Boolean(activeChatEmployee)}
        onClose={() => setActiveChatEmployee(null)}
      />
    </div>
  );
};
