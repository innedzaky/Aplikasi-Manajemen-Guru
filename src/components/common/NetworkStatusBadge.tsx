import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

export const NetworkStatusBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const { warning, success } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      success('Koneksi internet terhubung kembali. Sinkronisasi data aktif.', 'Online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      warning('Anda sedang offline. Aplikasi tetap dapat digunakan, data disimpan secara lokal.', 'Mode Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [success, warning]);

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
        isOnline
          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80'
          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
      }`}
      title={isOnline ? 'Internet aktif (Online)' : 'Internet terputus (Offline mode aktif)'}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden md:inline">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span className="font-bold">Offline Mode</span>
        </>
      )}
    </div>
  );
};
