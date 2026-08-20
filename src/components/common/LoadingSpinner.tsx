/**
 * =========================================================================
 * LoadingSpinner.tsx - Responsive & Configurable Loading & Skeleton Indicators
 * =========================================================================
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  text,
  className = '',
  fullScreen = false
}) => {
  const displayLabel = label || text;
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14'
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-emerald-700 dark:text-emerald-400`} />
      {displayLabel && (
        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 animate-pulse text-center max-w-sm">
          {displayLabel}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

/**
 * Skeleton Placeholder for smooth content loading
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-4 animate-pulse">
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4" />
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`skel-row-${r}`} className="flex gap-4 py-2 border-b border-slate-100 dark:border-slate-800/60">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={`skel-col-${c}`}
                className="h-4 bg-slate-100 dark:bg-slate-800/80 rounded-md"
                style={{ width: `${100 / columns}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
