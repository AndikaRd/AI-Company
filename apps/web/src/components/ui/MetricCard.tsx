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
  statusText?: string;
  statusVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor = 'text-primary-600',
  statusText,
  statusVariant = 'success',
}) => {
  return (
    <Card className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-secondary-text">
            {label}
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold tracking-tight text-primary-text">
              {value}
            </span>
            {subValue && (
              <span className="text-xs text-secondary-text font-normal">
                {subValue}
              </span>
            )}
          </div>
        </div>

        <div className={clsx('p-2.5 rounded-xl bg-surface-muted border border-surface-border', iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {statusText && (
        <div className="mt-3 pt-2.5 border-t border-surface-border flex items-center justify-between text-xs">
          <Badge variant={statusVariant} dot className="text-[11px]">
            {statusText}
          </Badge>
        </div>
      )}
    </Card>
  );
};
