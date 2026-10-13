import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm';

  const variants = {
    primary:
      'bg-medicare-600 hover:bg-medicare-700 text-white focus:ring-medicare-500 shadow-medicare-500/20 active:scale-[0.99]',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 active:scale-[0.99]',
    outline:
      'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-medicare-500 active:scale-[0.99]',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-rose-500/20 active:scale-[0.99]',
    ghost:
      'hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-none focus:ring-slate-300',
    teal:
      'bg-teal-600 hover:bg-teal-700 text-white focus:ring-teal-500 shadow-teal-500/20 active:scale-[0.99]',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
