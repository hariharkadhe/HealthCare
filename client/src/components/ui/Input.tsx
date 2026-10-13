import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors',
              'focus:border-medicare-500 focus:outline-none focus:ring-2 focus:ring-medicare-500/20',
              leftIcon && 'pl-10',
              error && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20',
              props.disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
