/**
 * =========================================================================
 * Sidebar.tsx - Responsive Navigation Drawer & Desktop Sidebar
 * =========================================================================
 */

import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  GraduationCap,
  BookOpen,
  Users,
  School,
  BookMarked,
  Settings,
  X,
  ChevronRight,
  ShieldCheck,
  Printer,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export type PageRoute =
  | 'dashboard'
  | 'presensi'
  | 'nilai'
  | 'jurnal'
  | 'laporan'
  | 'sync'
  | 'guru'
  | 'siswa'
  | 'kelas'
  | 'mapel'
  | 'pengaturan';

interface SidebarProps {
  currentPage: PageRoute;
  onSelectPage: (page: PageRoute) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isOpen,
  onClose
}) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();

  const mainMenuItems = [
    { id: 'dashboard' as PageRoute, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'presensi' as PageRoute, label: 'Presensi Siswa', icon: CalendarCheck2 },
    { id: 'nilai' as PageRoute, label: 'Penilaian & Rapor', icon: GraduationCap },
    { id: 'jurnal' as PageRoute, label: 'Jurnal Mengajar', icon: BookOpen },
    { id: 'laporan' as PageRoute, label: 'Laporan & Ekspor', icon: Printer }
  ];

  const masterMenuItems = [
    { id: 'guru' as PageRoute, label: 'Data Guru', icon: Users, adminOnly: true },
    { id: 'siswa' as PageRoute, label: 'Data Siswa', icon: Users, adminOnly: false },
    { id: 'kelas' as PageRoute, label: 'Data Kelas', icon: School, adminOnly: false },
    { id: 'mapel' as PageRoute, label: 'Mata Pelajaran', icon: BookMarked, adminOnly: false }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit'] tracking-tight block leading-tight">
                BukuGuru
              </span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                Presensi, Nilai &amp; Jurnal
              </span>
            </div>
          </div>

          {/* Close button for Mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 lg:hidden"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Main Navigation Section */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Menu Utama
            </p>
            <nav className="space-y-1">
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectPage(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Master Data Section */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Master Data</span>
              {isAdmin && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              )}
            </p>
            <nav className="space-y-1">
              {masterMenuItems
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectPage(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? 'text-white'
                              : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                    </button>
                  );
                })}
            </nav>
          </div>

          {/* System Settings Section (Admin Only) */}
          {isAdmin && (
            <div>
              <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Sistem</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    onSelectPage('pengaturan');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    currentPage === 'pengaturan'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings
                      className={`w-4 h-4 transition-colors ${
                        currentPage === 'pengaturan'
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      }`}
                    />
                    <span>Koneksi & Pengaturan</span>
                  </div>
                  {currentPage === 'pengaturan' && (
                    <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                  )}
                </button>

                <button
                  onClick={() => {
                    onSelectPage('sync');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    currentPage === 'sync'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Database
                      className={`w-4 h-4 transition-colors ${
                        currentPage === 'sync'
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      }`}
                    />
                    <span>Database & Sync Hub</span>
                  </div>
                  {currentPage === 'sync' && (
                    <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                  )}
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* User Footer Panel */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.NAMA_GURU ? user.NAMA_GURU.charAt(0) : 'G'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {user?.NAMA_GURU || 'Guru Pengajar'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Administrator' : user?.MAPEL || 'Guru'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
