/**
 * =========================================================================
 * PresensiHeader.tsx - Academic Filters & Header Configuration Bar
 * =========================================================================
 */

import React from 'react';
import {
  Calendar,
  BookOpen,
  School,
  Hash,
  Sparkles,
  CalendarCheck2,
  ListFilter,
  Layers,
  History,
  PlusCircle
} from 'lucide-react';
import { IKelas, IMapel } from '../../types.ts';

export interface PresensiConfig {
  tahunPelajaran: string;
  semester: 'Ganjil' | 'Genap';
  kelas: string;
  mapel: string;
  pertemuan: number;
  tanggal: string;
}

interface PresensiHeaderProps {
  config: PresensiConfig;
  onChangeConfig: (newConfig: Partial<PresensiConfig>) => void;
  kelasList: IKelas[];
  mapelList: IMapel[];
  activeTab: 'input' | 'history';
  onChangeTab: (tab: 'input' | 'history') => void;
  totalPresensiTersimpan?: number;
}

export const PresensiHeader: React.FC<PresensiHeaderProps> = ({
  config,
  onChangeConfig,
  kelasList,
  mapelList,
  activeTab,
  onChangeTab,
  totalPresensiTersimpan = 0
}) => {
  const tahunOptions = ['2026/2027', '2025/2026', '2024/2025'];
  const pertemuanOptions = Array.from({ length: 36 }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {/* Top Banner & Mode Switcher */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 shrink-0">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit'] tracking-tight">
                Presensi Siswa
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                Modul Presensi
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Pencatatan kehadiran siswa per rombel, rekapitulasi status, dan integrasi spreadsheet.
            </p>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 self-start md:self-auto">
          <button
            onClick={() => onChangeTab('input')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'input'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Input Presensi Kelas</span>
          </button>
          <button
            onClick={() => onChangeTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Rekap & Riwayat</span>
            {totalPresensiTersimpan > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-mono">
                {totalPresensiTersimpan}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <ListFilter className="w-4 h-4 text-blue-600" />
          <span>Parameter Pembelajaran & Presensi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Tahun Pelajaran */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Tahun Pelajaran
            </label>
            <div className="relative">
              <select
                value={config.tahunPelajaran}
                onChange={(e) => onChangeConfig({ tahunPelajaran: e.target.value })}
                className="w-full pl-3 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                {tahunOptions.map((th) => (
                  <option key={th} value={th}>
                    {th}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 2. Semester */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Semester
            </label>
            <div className="relative">
              <select
                value={config.semester}
                onChange={(e) => onChangeConfig({ semester: e.target.value as 'Ganjil' | 'Genap' })}
                className="w-full pl-3 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 3. Kelas */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Kelas (Rombel)
            </label>
            <div className="relative">
              <select
                value={config.kelas}
                onChange={(e) => onChangeConfig({ kelas: e.target.value })}
                className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                {kelasList.map((k) => (
                  <option key={k.ID_KELAS} value={k.NAMA_KELAS}>
                    {k.NAMA_KELAS}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 4. Mata Pelajaran */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Mata Pelajaran
            </label>
            <div className="relative">
              <select
                value={config.mapel}
                onChange={(e) => onChangeConfig({ mapel: e.target.value })}
                className="w-full pl-3 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                {mapelList.map((m) => (
                  <option key={m.ID_MAPEL} value={m.NAMA_MATA_PELAJARAN}>
                    {m.NAMA_MATA_PELAJARAN}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 5. Pertemuan Ke */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Pertemuan Ke-
            </label>
            <div className="relative">
              <select
                value={config.pertemuan}
                onChange={(e) => onChangeConfig({ pertemuan: Number(e.target.value) })}
                className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                {pertemuanOptions.map((num) => (
                  <option key={num} value={num}>
                    Pertemuan #{num}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 6. Tanggal Presensi */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Tanggal Presensi
            </label>
            <div className="relative">
              <input
                type="date"
                value={config.tanggal}
                onChange={(e) => onChangeConfig({ tanggal: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
