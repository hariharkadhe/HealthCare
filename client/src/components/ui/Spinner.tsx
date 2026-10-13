import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return <Loader2 className={cn('animate-spin text-medicare-600', sizes[size], className)} />;
};

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading hospital records...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <Spinner size="lg" />
      <p className="text-sm text-slate-500 font-medium animate-pulse">{message}</p>
    </div>
  );
};
