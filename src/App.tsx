/**
 * =========================================================================
 * App.tsx - Application Root with Providers and Routing State
 * =========================================================================
 */

import React, { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { LoadingSpinner } from './components/common/LoadingSpinner.tsx';
import { ApiClient } from './services/apiClient.ts';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Inisialisasi API Client dari stored preferences
    const gasUrl = localStorage.getItem('manajemen_guru_gas_url') || '';
    const gasMode = localStorage.getItem('manajemen_guru_gas_mode') === 'live';
    ApiClient.configure(gasUrl, gasMode);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" label="Memuat sesi pengguna..." />
      </div>
    );
  }

  return isAuthenticated ? <AppShell /> : <LoginPage />;
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
