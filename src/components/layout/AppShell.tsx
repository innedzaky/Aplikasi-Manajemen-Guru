/**
 * =========================================================================
 * AppShell.tsx - Main Layout Wrapper (Navbar, Sidebar, MobileNav & Routing)
 * =========================================================================
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Navbar } from './Navbar.tsx';
import { Sidebar, PageRoute } from './Sidebar.tsx';
import { MobileNav } from './MobileNav.tsx';
import { SettingsModal } from './SettingsModal.tsx';
import { ShellPlaceholder } from './ShellPlaceholder.tsx';
import { DashboardPage } from '../../pages/DashboardPage.tsx';
import { PresensiPage } from '../../pages/PresensiPage.tsx';
import { NilaiPage } from '../../pages/NilaiPage.tsx';
import { JurnalPage } from '../../pages/JurnalPage.tsx';
import { GuruPage } from '../../pages/GuruPage.tsx';
import { SiswaPage } from '../../pages/SiswaPage.tsx';
import { KelasPage } from '../../pages/KelasPage.tsx';
import { MapelPage } from '../../pages/MapelPage.tsx';
import { LaporanPage } from '../../pages/LaporanPage.tsx';
import { DatabaseSyncPage } from '../../pages/DatabaseSyncPage.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const AppShell: React.FC = () => {
  const { isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageRoute>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getPageTitle = (page: PageRoute): string => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard';
      case 'presensi':
        return 'Presensi Siswa';
      case 'nilai':
        return 'Penilaian Siswa';
      case 'jurnal':
        return 'Jurnal Mengajar';
      case 'laporan':
        return 'Laporan & Ekspor';
      case 'sync':
        return 'Pusat Automasi & Sinkronisasi Database';
      case 'guru':
        return 'Master Data Guru';
      case 'siswa':
        return 'Master Data Siswa';
      case 'kelas':
        return 'Master Data Kelas';
      case 'mapel':
        return 'Master Mata Pelajaran';
      case 'pengaturan':
        return 'Pengaturan & Koneksi';
      default:
        return 'Manajemen Guru';
    }
  };

  const handleSelectPage = (page: PageRoute) => {
    if (page === 'pengaturan') {
      if (isAdmin) {
        setIsSettingsOpen(true);
      }
    }
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={handleSelectPage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 transition-all duration-300">
        {/* Top Navbar */}
        <Navbar
          currentPageTitle={getPageTitle(currentPage)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={isAdmin ? () => setIsSettingsOpen(true) : undefined}
        />

        {/* Page Canvas Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {/* Dynamic Page Router */}
              {currentPage === 'dashboard' ? (
                <DashboardPage onNavigate={handleSelectPage} />
              ) : currentPage === 'presensi' ? (
                <PresensiPage />
              ) : currentPage === 'nilai' ? (
                <NilaiPage />
              ) : currentPage === 'jurnal' ? (
                <JurnalPage />
              ) : currentPage === 'laporan' ? (
                <LaporanPage />
              ) : currentPage === 'sync' ? (
                isAdmin ? (
                  <DatabaseSyncPage />
                ) : (
                  <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 text-center max-w-lg mx-auto shadow-sm my-12">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Akses Dibatasi (Admin Only)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
                      Halaman Database &amp; Sync Hub hanya dapat diakses oleh akun Administrator Sekolah. Silakan beralih ke halaman lain.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectPage('dashboard')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Kembali ke Dashboard
                    </button>
                  </div>
                )
              ) : currentPage === 'guru' ? (
                isAdmin ? (
                  <GuruPage onNavigateTab={handleSelectPage} />
                ) : (
                  <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 text-center max-w-lg mx-auto shadow-sm my-12">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Akses Dibatasi (Admin Only)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
                      Halaman Master Data Guru hanya dapat diakses oleh akun Administrator Sekolah. Silakan beralih ke halaman lain.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectPage('dashboard')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Kembali ke Dashboard
                    </button>
                  </div>
                )
              ) : currentPage === 'siswa' ? (
                <SiswaPage onNavigateTab={handleSelectPage} />
              ) : currentPage === 'kelas' ? (
                <KelasPage onNavigateTab={handleSelectPage} />
              ) : currentPage === 'mapel' ? (
                <MapelPage onNavigateTab={handleSelectPage} />
              ) : currentPage === 'pengaturan' ? (
                isAdmin ? (
                  <ShellPlaceholder
                    currentPage={currentPage}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                  />
                ) : (
                  <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 text-center max-w-lg mx-auto shadow-sm my-12">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Akses Dibatasi (Admin Only)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
                      Menu Koneksi &amp; Pengaturan hanya dapat diakses oleh akun Administrator Sekolah. Silakan beralih ke halaman lain.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectPage('dashboard')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Kembali ke Dashboard
                    </button>
                  </div>
                )
              ) : (
                <ShellPlaceholder
                  currentPage={currentPage}
                  onOpenSettings={isAdmin ? () => setIsSettingsOpen(true) : undefined}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <MobileNav
          currentPage={currentPage}
          onSelectPage={handleSelectPage}
          onOpenMenu={() => setIsSidebarOpen(true)}
        />
      </div>

      {/* Global Settings & Backend Configuration Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
