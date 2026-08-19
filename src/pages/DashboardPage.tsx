/**
 * =========================================================================
 * DashboardPage.tsx - Teacher Dashboard Analytics & Overview Page
 * =========================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LayoutDashboard, Database, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { ApiClient } from '../services/apiClient.ts';
import { SyncService } from '../services/syncService.ts';
import { IDashboardData } from '../types/dashboard.ts';
import { PageRoute } from '../components/layout/Sidebar.tsx';
import { DashboardHeader } from '../components/dashboard/DashboardHeader.tsx';
import { DashboardMetrics } from '../components/dashboard/DashboardMetrics.tsx';
import { AttendanceChart } from '../components/dashboard/AttendanceChart.tsx';
import { MonthlyTrendChart } from '../components/dashboard/MonthlyTrendChart.tsx';
import { ClassPerformanceWidget } from '../components/dashboard/ClassPerformanceWidget.tsx';
import { RecentActivityList } from '../components/dashboard/RecentActivityList.tsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';

interface DashboardPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const { info, error: toastError } = useToast();

  const [data, setData] = useState<IDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      // Mengambil data dashboard dari API/backend (bukan hardcoded)
      const res = await ApiClient.getDashboardStats({
        guru: user?.role === 'guru' ? user.NAMA_GURU : undefined
      });

      if (res.success && res.data) {
        setData(res.data);
        if (showRefreshing) {
          info('Data dashboard berhasil diperbarui dari server.', 'Sinkronisasi Selesai');
        }
      } else {
        const msg = res.message || 'Gagal memuat statistik dashboard.';
        setErrorMessage(msg);
        toastError(msg, 'Gagal Memuat');
      }
    } catch (err: any) {
      const msg = err.message || 'Terjadi kesalahan saat menghubungi API server.';
      setErrorMessage(msg);
      toastError(msg, 'Koneksi Error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, info, toastError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-[480px] flex items-center justify-center p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <LoadingSpinner
          size="lg"
          label="Mengambil data analitik dan statistik terkini..."
        />
      </div>
    );
  }

  // API Error State
  if (errorMessage && !data) {
    return (
      <div className="p-6">
        <ErrorState
          title="Gagal Mengambil Data Dashboard"
          message={errorMessage}
          onRetry={() => fetchDashboardData()}
        />
      </div>
    );
  }

  // Empty State (Fallback jika data null/kosong)
  if (!data) {
    return (
      <div className="p-6">
        <EmptyState
          title="Data Dashboard Belum Tersedia"
          description="Belum ada statistik yang dapat ditampilkan saat ini."
          actionLabel="Muat Ulang"
          onAction={() => fetchDashboardData()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header with Teacher Name, Indonesian Date, & Quick Actions */}
      <DashboardHeader
        namaGuru={user?.NAMA_GURU || 'Bapak/Ibu Guru'}
        mapel={user?.MAPEL}
        role={user?.role}
        onNavigate={onNavigate}
      />

      {/* Control Bar & Quick Sync Hub Access */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>
            Ringkasan data per tanggal{' '}
            <strong className="text-slate-700 dark:text-slate-200">
              {data.hariIni.tanggal}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('sync')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 shadow-2xs transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Cloudflare D1 &amp; Sync Hub</span>
              <ArrowRight className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
          )}

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Memperbarui...' : 'Muat Ulang'}</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Overview (Presensi Hari Ini, Jurnal Hari Ini, Jumlah Kelas, Total Siswa) */}
      <DashboardMetrics
        summary={data.ringkasan}
        today={data.hariIni}
      />

      {/* 3. Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Donut Chart (1 col) */}
        <div className="lg:col-span-1">
          <AttendanceChart distribution={data.distribusiPresensi} />
        </div>

        {/* Monthly Activity & Score Trend Chart (2 cols) */}
        <div className="lg:col-span-2">
          <MonthlyTrendChart data={data.grafikBulanan} />
        </div>
      </div>

      {/* 4. Class Performance Progress & Recent Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClassPerformanceWidget
          data={data.rataRataNilaiKelas}
          onNavigateNilai={() => onNavigate('nilai')}
        />

        <RecentActivityList activities={data.aktivitasTerbaru} />
      </div>
    </div>
  );
};
