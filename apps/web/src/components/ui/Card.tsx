import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-surface border border-surface-border rounded-xl p-5 shadow-subtle transition-all duration-150',
        hoverable && 'hover:border-stone-300 hover:shadow-card cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
