/**
 * =========================================================================
 * ShellPlaceholder.tsx - Modular State Canvas for Foundation Verification
 * =========================================================================
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  GraduationCap,
  BookOpen,
  Users,
  School,
  BookMarked,
  Settings,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Inbox,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { PageRoute } from './Sidebar.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Modal } from '../common/Modal.tsx';
import { LoadingSpinner } from '../common/LoadingSpinner.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { ErrorState } from '../common/ErrorState.tsx';

interface ShellPlaceholderProps {
  currentPage: PageRoute;
  onOpenSettings: () => void;
}

export const ShellPlaceholder: React.FC<ShellPlaceholderProps> = ({
  currentPage,
  onOpenSettings
}) => {
  const { user, isAdmin } = useAuth();
  const { success, error, warning, info } = useToast();

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [showErrorState, setShowErrorState] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);

  const pageMeta: Record<PageRoute, { title: string; desc: string; icon: any }> = {
    dashboard: {
      title: 'Dashboard Analitik Guru',
      desc: 'Ringkasan presensi harian, jurnal mengajar, dan progres penilaian kelas.',
      icon: LayoutDashboard
    },
    presensi: {
      title: 'Presensi Siswa',
      desc: 'Pencatatan kehadiran siswa per kelas dan pertemuan dengan filter terintegrasi.',
      icon: CalendarCheck2
    },
    nilai: {
      title: 'Penilaian & Input Rapor',
      desc: 'Pengelolaan nilai tugas, ulangan harian, PTS, dan PAS siswa.',
      icon: GraduationCap
    },
    jurnal: {
      title: 'Jurnal Mengajar',
      desc: 'Dokumentasi materi ajar, tujuan pembelajaran, dan catatan refleksi.',
      icon: BookOpen
    },
    guru: {
      title: 'Master Data Guru',
      desc: 'Pengelolaan profil pengajar, hak akses, dan mata pelajaran ampu.',
      icon: Users
    },
    siswa: {
      title: 'Master Data Siswa',
      desc: 'Database seluruh peserta didik terorganisir berdasarkan kelas.',
      icon: Users
    },
    kelas: {
      title: 'Master Data Kelas',
      desc: 'Daftar rombel, tingkatan kelas, dan wali kelas terdaftar.',
      icon: School
    },
    mapel: {
      title: 'Master Mata Pelajaran',
      desc: 'Daftar kurikulum mata pelajaran yang diajarkan di sekolah.',
      icon: BookMarked
    },
    laporan: {
      title: 'Laporan & Ekspor Dokumen',
      desc: 'Pusat unduhan dan cetak rekapitulasi presensi, penilaian, dan jurnal mengajar.',
      icon: FileText
    },
    sync: {
      title: 'Pusat Automasi & Sinkronisasi Database',
      desc: 'Automasi sinkronisasi Cloudflare D1 sebagai database utama dan Google Sheets sebagai cadangan.',
      icon: Settings
    },
    pengaturan: {
      title: 'Pengaturan & Koneksi',
      desc: 'Konfigurasi backend Google Apps Script Web App dan mode integrasi.',
      icon: Settings
    }
  };

  const meta = pageMeta[currentPage] || pageMeta.dashboard;
  const PageIcon = meta.icon;

  const triggerSimulatedLoading = () => {
    setShowLoadingState(true);
    setTimeout(() => {
      setShowLoadingState(false);
      success('Simulasi proses async loading selesai.');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 shadow-xs shrink-0">
              <PageIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit'] tracking-tight">
                  {meta.title}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Phase 4 UI Shell
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {meta.desc}
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2">
            {currentPage === 'pengaturan' && (
              <button
                onClick={onOpenSettings}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Buka Modal GAS
              </button>
            )}
          </div>
        </div>
      </div>

      {/* UI Component Validation Sandbox */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
            Verifikasi UI Shell & Komponen Dasar (Phase 4 Foundation)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gunakan kontrol di bawah ini untuk menguji interaksi Modal, Toast, Loading, Empty State, dan Error State.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => setTestModalOpen(true)}
            className="p-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Uji Modal Dialog
          </button>

          <button
            onClick={() => success('Presensi kelas X TKJ 1 berhasil disimpan!', 'Sukses')}
            className="p-2.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-colors"
          >
            Toast Sukses
          </button>

          <button
            onClick={() => error('Gagal menyimpan nilai: NILAI melebihi batas 100.', 'Validasi Error')}
            className="p-2.5 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 transition-colors"
          >
            Toast Error
          </button>

          <button
            onClick={() => warning('Siswa belum memiliki nomor induk NISN terdaftar.', 'Perhatian')}
            className="p-2.5 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 transition-colors"
          >
            Toast Warning
          </button>

          <button
            onClick={triggerSimulatedLoading}
            className="p-2.5 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 transition-colors"
          >
            Uji Spinner
          </button>

          <button
            onClick={() => {
              setShowEmptyState(!showEmptyState);
              setShowErrorState(false);
            }}
            className="p-2.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 transition-colors"
          >
            Toggle Empty State
          </button>
        </div>

        {/* Dynamic Component Previews */}
        {showLoadingState && (
          <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center">
            <LoadingSpinner size="lg" label="Mengambil data spreadsheet terbaru..." />
          </div>
        )}

        {showEmptyState && (
          <EmptyState
            title="Belum Ada Data Siswa di Kelas Ini"
            description="Silakan pilih kelas lain atau tambahkan siswa baru melalui formulir master data."
            actionLabel="Tambah Siswa Baru"
            onAction={() => success('Trigger aksi tambah data siswa.')}
          />
        )}

        {showErrorState && (
          <ErrorState
            title="Koneksi Google Apps Script Terputus"
            message="Pastikan Web App URL sudah terpasang dan berstatus 'Anyone'."
            onRetry={() => {
              setShowErrorState(false);
              success('Koneksi berhasil dipulihkan.');
            }}
          />
        )}

        {/* Context Status */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              Pengguna Aktif: <strong>{user?.NAMA_GURU}</strong> ({user?.role})
            </span>
          </div>
          <div>
            Route Terpilih: <code className="text-blue-600 dark:text-blue-400 font-mono font-bold">{currentPage}</code>
          </div>
        </div>
      </div>

      {/* Test Modal Component */}
      <Modal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Contoh Dialog Modal Interaktif"
        description="Komponen modal dialog yang responsif, accessible, dan mendukung keyboard ESC."
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <p>
            Modal ini menggunakan animasi transisi Motion yang halus dengan backdrop blur. Siap digunakan untuk formulir input presensi cepat, edit nilai rapor, dan pembuatan jurnal harian.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setTestModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                setTestModalOpen(false);
                success('Aksi di dalam modal berhasil dieksekusi!');
              }}
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Simpan Aksi
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
