import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glow?: 'blue' | 'cyan' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  glow = 'none',
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-surface/80 backdrop-blur-md border border-surface-border rounded-xl p-5 shadow-lg transition-all duration-200',
        hoverable && 'hover:border-slate-500 hover:bg-surface/90 cursor-pointer',
        glow === 'blue' && 'shadow-glow-blue border-primary-500/40',
        glow === 'cyan' && 'shadow-glow-cyan border-cyan-500/40',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
