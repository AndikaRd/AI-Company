import React, { useState } from 'react';
import { OrganizationHierarchyNode, Employee } from '@vac/shared';
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Bot,
  MapPin,
  MessageSquare,
  Users,
  Briefcase,
  Layers,
} from 'lucide-react';
import { clsx } from 'clsx';

interface OrgChartViewProps {
  hierarchy: OrganizationHierarchyNode[];
  onSelectEmployee?: (employee: Employee) => void;
  onChatWithEmployee?: (employee: Employee) => void;
}

const OrgTreeNode: React.FC<{
  node: OrganizationHierarchyNode;
  onChat?: (employee: Employee) => void;
}> = ({ node, onChat }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const emp = node.employee;
  const hasReports = node.directReports && node.directReports.length > 0;

  const seniorityColors: Record<string, string> = {
    EXECUTIVE: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    PRINCIPAL: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    LEAD: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    SENIOR: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    MID: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    JUNIOR: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
    INTERN: 'border-slate-600/40 bg-slate-600/10 text-slate-400',
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        className={clsx(
          'w-72 sm:w-80 rounded-xl p-4 transition-all duration-200 select-none relative',
          'bg-surface-elevated/90 border backdrop-blur-md shadow-lg',
          emp.seniority === 'EXECUTIVE'
            ? 'border-amber-500/40 shadow-glow-amber/20'
            : emp.seniority === 'PRINCIPAL'
              ? 'border-purple-500/40'
              : 'border-surface-border hover:border-slate-500',
        )}
      >
        {/* Top Info Bar */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className={clsx(
                'text-[10px] font-mono font-semibold px-2 py-0.5 rounded border',
                seniorityColors[emp.seniority] || 'border-slate-700 bg-slate-800 text-slate-300',
              )}
            >
              {emp.seniority}
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
              {emp.employeeCode || 'AI'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                emp.status === 'ACTIVE'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : emp.status === 'BUSY'
                    ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                    : 'bg-slate-500',
              )}
            />
            <span className="text-[11px] font-mono text-slate-400 uppercase">{emp.status}</span>
          </div>
        </div>

        {/* Identity & Role */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 p-[1.5px] shrink-0 shadow-md">
            <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">
              {emp.firstName} {emp.lastName}
            </h4>
            <p className="text-xs text-cyan-300/90 font-medium truncate">
              {emp.jobTitle || emp.role}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-slate-500" />
              <span>{node.department?.name || 'Department'}</span>
            </p>
          </div>
        </div>

        {/* Responsibilities count & Workstation */}
        <div className="mt-3 pt-2.5 border-t border-surface-border/70 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span className="font-mono">{emp.workstationId || 'Remote Zone'}</span>
          </span>

          <div className="flex items-center gap-2">
            {onChat && (
              <button
                onClick={() => onChat(emp)}
                className="px-2 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-colors"
                title="Open Agent Chat"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Chat</span>
              </button>
            )}

            {hasReports && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors"
              >
                <Users className="w-3 h-3 text-indigo-400" />
                <span className="font-mono">{node.directReports.length}</span>
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Child Reports Connection Line */}
      {hasReports && isExpanded && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical connecting line from parent */}
          <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-500/60 to-indigo-500/60" />

          {/* Children container */}
          <div className="flex items-start gap-6 sm:gap-10 pt-2 relative">
            {node.directReports.map((childNode) => (
              <div key={childNode.employee.id} className="relative flex flex-col items-center">
                <OrgTreeNode node={childNode} onChat={onChat} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const OrgChartView: React.FC<OrgChartViewProps> = ({ hierarchy, onChatWithEmployee }) => {
  if (!hierarchy || hierarchy.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 bg-surface-elevated/40 rounded-2xl border border-surface-border">
        <Layers className="w-10 h-10 mx-auto text-slate-500 mb-2 opacity-50" />
        <p className="text-sm">No organizational hierarchy records available.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-8 px-4 flex justify-center min-h-[500px]">
      <div className="flex flex-col items-center space-y-8">
        {/* CEO Root Anchor */}
        <div className="flex flex-col items-center">
          <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-primary-500/20 to-indigo-500/20 border border-amber-500/40 text-center shadow-lg shadow-amber-500/10">
            <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-semibold">
              Executive Leadership
            </div>
            <div className="text-sm font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
              <span>Chief Executive Officer (CEO)</span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-[11px] text-slate-400">Human Supervision & Ultimate Authority</div>
          </div>
          <div className="w-0.5 h-8 bg-gradient-to-b from-amber-500/60 to-cyan-500/60" />
        </div>

        {/* Tree Roots (COO / Direct Reports) */}
        <div className="flex items-start gap-12 justify-center">
          {hierarchy.map((rootNode) => (
            <OrgTreeNode
              key={rootNode.employee.id}
              node={rootNode}
              onChat={onChatWithEmployee}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
