import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  iconColor?: string;
  isLiveDb?: boolean;
  tooltip?: string;
  statusText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor = 'text-primary-400',
  isLiveDb = false,
  statusText,
}) => {
  return (
    <Card className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">
              {label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">
              {value}
            </span>
            {subValue && (
              <span className="text-xs font-medium text-slate-400">
                {subValue}
              </span>
            )}
          </div>
        </div>

        <div className={clsx('p-3 rounded-xl bg-surface-elevated/80 border border-slate-700/60', iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        {isLiveDb ? (
          <Badge variant="success" dot className="font-mono text-[10px]">
            Live DB Verified
          </Badge>
        ) : (
          <Badge variant="placeholder" dot className="font-mono text-[10px]">
            Placeholder (Sprint 2)
          </Badge>
        )}

        <span className="text-slate-500 font-mono text-[11px]">
          {statusText || (isLiveDb ? 'PostgreSQL Query' : 'Awaiting Engine')}
        </span>
      </div>
    </Card>
  );
};
