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
} from 'lucide-react';
import { clsx } from 'clsx';
import { Badge } from '../ui/Badge';

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

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        className={clsx(
          'w-72 sm:w-80 rounded-xl p-4 transition-all duration-150 select-none relative',
          'bg-surface border border-surface-border shadow-subtle hover:border-stone-300',
        )}
      >
        {/* Top Info Bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Badge variant="neutral" className="text-[10px]">
              {emp.seniority}
            </Badge>
            <span className="text-[10px] text-secondary-text bg-surface-muted px-1.5 py-0.5 rounded border border-surface-border">
              {emp.employeeCode || 'AI'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                emp.status === 'ACTIVE' ? 'bg-success' : 'bg-warning',
              )}
            />
            <span className="text-[11px] font-semibold text-secondary-text uppercase">
              {emp.status}
            </span>
          </div>
        </div>

        {/* Identity & Role */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-muted text-primary-700 flex items-center justify-center shrink-0 border border-surface-border">
            <Bot className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-primary-text truncate">
              {emp.firstName} {emp.lastName}
            </h4>
            <p className="text-xs text-primary-600 font-medium truncate">
              {emp.jobTitle || emp.role}
            </p>
            <p className="text-[11px] text-secondary-text truncate mt-0.5">
              {emp.department?.name || 'Operations'}
            </p>
          </div>
        </div>

        {/* Workstation & Autonomy Specs */}
        <div className="mt-3 pt-2.5 border-t border-surface-border grid grid-cols-2 gap-2 text-xs text-secondary-text">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{emp.workstationId || 'Slot 1'}</span>
          </div>

          <div className="flex items-center gap-1 truncate justify-end">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{emp.agentConfig?.autonomyLevel || 'SUPERVISED'}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-3 pt-2 border-t border-surface-border flex items-center justify-between">
          <div className="text-[11px] text-secondary-text flex items-center gap-1">
            <Users className="w-3 h-3 text-secondary-text" />
            <span>{node.totalSubordinates ?? 0} subordinates</span>
          </div>

          {onChat && (
            <button
              onClick={() => onChat(emp)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-muted border border-surface-border text-primary-text text-xs font-semibold transition shadow-subtle"
            >
              <MessageSquare className="w-3 h-3 text-primary-600" />
              <span>Chat</span>
            </button>
          )}
        </div>

        {/* Expand / Collapse Subordinates Button */}
        {hasReports && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-surface border border-surface-border shadow-subtle flex items-center justify-center text-secondary-text hover:text-primary-text transition-transform"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Children Branches */}
      {hasReports && isExpanded && (
        <div className="flex flex-col items-center mt-3 w-full">
          {/* Vertical Connecting Stem */}
          <div className="w-px h-6 bg-surface-border" />

          {/* Children Container */}
          <div className="flex items-start justify-center gap-6 relative pt-4">
            {/* Horizontal Branch Crossbar */}
            {node.directReports.length > 1 && (
              <div className="absolute top-0 left-12 right-12 h-px bg-surface-border" />
            )}

            {node.directReports.map((childNode) => (
              <div key={childNode.employee.id} className="relative flex flex-col items-center">
                {/* Vertical Drop to Child Card */}
                <div className="w-px h-4 bg-surface-border -mt-4 mb-0" />
                <OrgTreeNode node={childNode} onChat={onChat} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const OrgChartView: React.FC<OrgChartViewProps> = ({
  hierarchy,
  onChatWithEmployee,
}) => {
  if (!hierarchy || hierarchy.length === 0) {
    return (
      <div className="p-12 text-center bg-surface rounded-xl border border-dashed border-surface-border">
        <Users className="w-8 h-8 text-secondary-text mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-primary-text">No Hierarchy Seeded</h4>
        <p className="mt-1 text-xs text-secondary-text">
          Initialize company organizational structure from the Executive Overview.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto p-6 bg-surface-muted/30 rounded-2xl border border-surface-border flex justify-center min-h-[500px]">
      <div className="flex flex-col items-center space-y-8 min-w-max pb-8">
        {hierarchy.map((rootNode) => (
          <OrgTreeNode
            key={rootNode.employee.id}
            node={rootNode}
            onChat={onChatWithEmployee}
          />
        ))}
      </div>
    </div>
  );
};
