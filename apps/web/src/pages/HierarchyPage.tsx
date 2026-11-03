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
            <h2 className="text-xl sm:text-2xl font-bold text-primary-text tracking-tight flex items-center gap-2">
              <Network className="w-6 h-6 text-primary-600" />
              <span>Multi-Agent Organization & Delegation</span>
            </h2>
            <Badge variant="primary">
              Executive Hierarchy
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-secondary-text mt-1">
            Supervisory reporting lines, cross-department task delegation, and correlated inter-agent communications.
          </p>
        </div>

        <button
          onClick={loadHierarchy}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-lg bg-surface border border-surface-border hover:bg-surface-muted text-xs font-semibold text-primary-text flex items-center gap-2 transition-colors self-start sm:self-auto shadow-subtle"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5 text-primary-600', isLoading && 'animate-spin')} />
          <span>Refresh Structure</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2">
        <button
          onClick={() => setActiveTab('TREE')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors',
            activeTab === 'TREE'
              ? 'bg-surface border border-surface-border text-primary-text shadow-subtle'
              : 'text-secondary-text hover:text-primary-text hover:bg-surface-muted',
          )}
        >
          <GitBranch className="w-4 h-4 text-primary-600" />
          <span>Organizational Chart</span>
        </button>

        <button
          onClick={() => setActiveTab('COMMS')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors',
            activeTab === 'COMMS'
              ? 'bg-surface border border-surface-border text-primary-text shadow-subtle'
              : 'text-secondary-text hover:text-primary-text hover:bg-surface-muted',
          )}
        >
          <MessageSquare className="w-4 h-4 text-primary-600" />
          <span>Agent-to-Agent Messages</span>
        </button>
      </div>

      {/* Content View */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-secondary-text">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-xs">Resolving organizational reporting structure...</p>
        </div>
      ) : activeTab === 'TREE' ? (
        <OrgChartView
          hierarchy={hierarchy}
          onChatWithEmployee={(emp) => setActiveChatEmployee(emp)}
        />
      ) : (
        <InternalAgentCommsView />
      )}

      {/* Chat Drawer */}
      <AgentChatDrawer
        employee={activeChatEmployee}
        isOpen={Boolean(activeChatEmployee)}
        onClose={() => setActiveChatEmployee(null)}
      />
    </div>
  );
};
