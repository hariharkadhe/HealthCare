import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'gray' | 'teal';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'blue',
  ...props
}) => {
  const variants = {
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
