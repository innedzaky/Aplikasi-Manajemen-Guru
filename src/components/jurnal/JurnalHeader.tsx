/**
 * =========================================================================
 * JurnalHeader.tsx - Header, Summary Statistics, Search & Filter Controls
 * =========================================================================
 */

import React from 'react';
import {
  BookOpen,
  PlusCircle,
  ListFilter,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  LayoutGrid,
  User,
  GraduationCap,
  Table as TableIcon,
  Download
} from 'lucide-react';
import { IKelas, IMapel, IGuru } from '../../types.ts';
import {
  STANDARD_TAHUN_PELAJARAN,
  STANDARD_SEMESTER
} from '../../utils/filterUtils.ts';

export interface JurnalFilterState {
  search: string;
  kelas: string;
  mapel: string;
  guru?: string;
  semester?: string;
  tahunPelajaran?: string;
  status: string;
  tanggal: string;
}

interface JurnalHeaderProps {
  stats: {
    total: number;
    terlaksana: number;
    sebagian: number;
    tidakTerlaksana: number;
    rate: number;
  };
  filter: JurnalFilterState;
  onFilterChange: (newFilter: Partial<JurnalFilterState>) => void;
  onResetFilter: () => void;
  kelasList: IKelas[];
  mapelList: IMapel[];
  guruList?: string[];
  activeTab: 'list' | 'create';
  onTabChange: (tab: 'list' | 'create') => void;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  isLoading: boolean;
  onExport?: () => void;
}

export const JurnalHeader: React.FC<JurnalHeaderProps> = ({
  stats,
  filter,
  onFilterChange,
  onResetFilter,
  kelasList,
  mapelList,
  guruList = [],
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange,
  isLoading,
  onExport
}) => {
  const hasActiveFilters = Boolean(
    filter.search ||
    filter.kelas ||
    filter.mapel ||
    (filter.guru && filter.guru !== 'ALL') ||
    (filter.semester && filter.semester !== 'ALL') ||
    (filter.tahunPelajaran && filter.tahunPelajaran !== 'ALL') ||
    filter.status ||
    filter.tanggal
  );

  return (
    <div id="jurnal-header-section" className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>MODUL JURNAL MENGAJAR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-emerald-300" />
              Jurnal Mengajar & Agenda KBM
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base max-w-2xl leading-relaxed">
              Catat dan pantau aktivitas pembelajaran, ketercapaian materi, metode, media, serta refleksi kelas secara terstruktur dan tersinkronisasi.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              id="btn-tulis-jurnal-tab"
              type="button"
              onClick={() => onTabChange(activeTab === 'create' ? 'list' : 'create')}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md flex items-center gap-2 ${
                activeTab === 'create'
                  ? 'bg-white text-emerald-800 hover:bg-emerald-50 shadow-white/10'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-950/20'
              }`}
            >
              {activeTab === 'create' ? (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Lihat Daftar Jurnal</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Tulis Jurnal Baru</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-emerald-600/40">
          <div className="bg-emerald-950/40 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-3.5">
            <div className="text-xs font-medium text-emerald-200/80 mb-1">Total Pertemuan</div>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {stats.total} <span className="text-xs font-normal text-emerald-300">agenda</span>
            </div>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-300 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Terlaksana</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-200 tracking-tight">
              {stats.terlaksana} <span className="text-xs font-normal text-emerald-300/80">sesi</span>
            </div>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Sebagian</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-200 tracking-tight">
              {stats.sebagian} <span className="text-xs font-normal text-amber-300/80">sesi</span>
            </div>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-300 mb-1">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Tidak Terlaksana</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-200 tracking-tight">
              {stats.tidakTerlaksana} <span className="text-xs font-normal text-rose-300/80">sesi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Navigation Toolbar (Only shown in 'list' tab) */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="jurnal-search-input"
                type="text"
                value={filter.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                placeholder="Cari materi, kelas, mapel, guru, tujuan, aktivitas..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              {filter.search && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ search: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* View Mode Switcher, Export & Reset */}
            <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
              {onExport && (
                <button
                  type="button"
                  onClick={onExport}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Ekspor laporan jurnal mengajar"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor Laporan</span>
                </button>
              )}

              {hasActiveFilters && (
                <button
                  id="btn-reset-jurnal-filters"
                  type="button"
                  onClick={onResetFilter}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}

              <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => onViewModeChange('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  title="Tampilan Kartu / Agenda"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartu</span>
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  title="Tampilan Tabel Rinci"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Filter Tanggal */}
            <div>
              <label htmlFor="filter-tanggal" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Tanggal
              </label>
              <input
                id="filter-tanggal"
                type="date"
                value={filter.tanggal}
                onChange={(e) => onFilterChange({ tanggal: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Filter Guru */}
            <div>
              <label htmlFor="filter-guru" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Guru Pengajar
              </label>
              <select
                id="filter-guru"
                value={filter.guru || 'ALL'}
                onChange={(e) => onFilterChange({ guru: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="ALL">Semua Guru</option>
                {guruList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kelas */}
            <div>
              <label htmlFor="filter-kelas" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Kelas
              </label>
              <select
                id="filter-kelas"
                value={filter.kelas}
                onChange={(e) => onFilterChange({ kelas: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.ID_KELAS || k.NAMA_KELAS} value={k.NAMA_KELAS}>
                    {k.NAMA_KELAS}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Mapel */}
            <div>
              <label htmlFor="filter-mapel" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Mata Pelajaran
              </label>
              <select
                id="filter-mapel"
                value={filter.mapel}
                onChange={(e) => onFilterChange({ mapel: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">Semua Mapel</option>
                {mapelList.map((m) => (
                  <option key={m.ID_MAPEL || m.NAMA_MATA_PELAJARAN} value={m.NAMA_MATA_PELAJARAN}>
                    {m.NAMA_MATA_PELAJARAN}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Semester */}
            <div>
              <label htmlFor="filter-semester" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Semester
              </label>
              <select
                id="filter-semester"
                value={filter.semester || 'ALL'}
                onChange={(e) => onFilterChange({ semester: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="ALL">Semua Semester</option>
                {STANDARD_SEMESTER.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tahun Pelajaran */}
            <div>
              <label htmlFor="filter-tapel" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Tahun Pelajaran
              </label>
              <select
                id="filter-tapel"
                value={filter.tahunPelajaran || 'ALL'}
                onChange={(e) => onFilterChange({ tahunPelajaran: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="ALL">Semua TP</option>
                {STANDARD_TAHUN_PELAJARAN.map((tp) => (
                  <option key={tp} value={tp}>
                    {tp}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status Pembelajaran */}
            <div>
              <label htmlFor="filter-status" className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Status
              </label>
              <select
                id="filter-status"
                value={filter.status}
                onChange={(e) => onFilterChange({ status: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">Semua Status</option>
                <option value="Terlaksana">Terlaksana</option>
                <option value="Sebagian">Sebagian</option>
                <option value="Tidak terlaksana">Tidak terlaksana</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

