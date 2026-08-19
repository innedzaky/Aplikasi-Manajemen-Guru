/**
 * =========================================================================
 * ErrorState.tsx - User-friendly Error & Failure Component
 * =========================================================================
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Gagal Memuat Data',
  message = 'Terjadi kendala saat menghubungkan ke server Google Apps Script. Silakan periksa koneksi atau coba lagi.',
  onRetry,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-xs">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-rose-900 dark:text-rose-200 mb-1">
        {title}
      </h3>
      <p className="text-sm text-rose-700/80 dark:text-rose-300/80 max-w-sm mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      )}
    </div>
  );
};
