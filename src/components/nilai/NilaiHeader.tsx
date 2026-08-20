/**
 * =========================================================================
 * NilaiHeader.tsx - Academic Filters & Header Configuration Bar for Nilai
 * Minimalist Sage & Emerald Theme
 * =========================================================================
 */

import React from 'react';
import {
  Award,
  ListFilter,
  History,
  PlusCircle,
  Wand2
} from 'lucide-react';
import { IKelas, IMapel } from '../../types.ts';

export type JenisPenilaianType = 'Tugas' | 'UH' | 'PTS' | 'PAS' | 'Praktik' | 'Project';

export interface NilaiConfig {
  tahunPelajaran: string;
  semester: 'Ganjil' | 'Genap';
  kelas: string;
  mapel: string;
  jenisPenilaian: JenisPenilaianType;
  namaPenilaian: string;
  tanggal: string;
}

interface NilaiHeaderProps {
  config: NilaiConfig;
  onChangeConfig: (newConfig: Partial<NilaiConfig>) => void;
  kelasList: IKelas[];
  mapelList: IMapel[];
  activeTab: 'input' | 'history';
  onChangeTab: (tab: 'input' | 'history') => void;
  totalNilaiTersimpan?: number;
}

export const NilaiHeader: React.FC<NilaiHeaderProps> = ({
  config,
  onChangeConfig,
  kelasList,
  mapelList,
  activeTab,
  onChangeTab,
  totalNilaiTersimpan = 0
}) => {
  const tahunOptions = ['2026/2027', '2025/2026', '2024/2025'];
  const jenisPenilaianOptions: JenisPenilaianType[] = [
    'Tugas',
    'UH',
    'PTS',
    'PAS',
    'Praktik',
    'Project'
  ];

  // Quick preset assessment names based on type
  const handleQuickPreset = (jenis: JenisPenilaianType) => {
    let presetName = `${jenis} 1`;
    if (jenis === 'PTS') presetName = 'PTS Semester Ganjil';
    if (jenis === 'PAS') presetName = 'PAS Semester Ganjil';
    onChangeConfig({
      jenisPenilaian: jenis,
      namaPenilaian: presetName
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Mode Switcher */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit'] tracking-tight">
                Penilaian Siswa
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                Modul Nilai
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Input nilai angka (0–100), rekapitulasi penilaian kelas, dan sinkronisasi ke spreadsheet.
            </p>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 self-start md:self-auto">
          <button
            onClick={() => onChangeTab('input')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'input'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Input Nilai Kelas</span>
          </button>
          <button
            onClick={() => onChangeTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Rekap & Riwayat Nilai</span>
            {totalNilaiTersimpan > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-mono">
                {totalNilaiTersimpan}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <ListFilter className="w-4 h-4 text-emerald-600" />
            <span>Parameter Pembelajaran & Penilaian</span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Wand2 className="w-3 h-3 text-emerald-600" />
              Pilih Jenis:
            </span>
            {jenisPenilaianOptions.map((jenis) => {
              const isSelected = config.jenisPenilaian === jenis;
              return (
                <button
                  key={jenis}
                  type="button"
                  onClick={() => handleQuickPreset(jenis)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300'
                  }`}
                >
                  {jenis}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* 1. Tahun Pelajaran */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Tahun Pelajaran
            </label>
            <div className="relative">
              <select
                value={config.tahunPelajaran}
                onChange={(e) => onChangeConfig({ tahunPelajaran: e.target.value })}
                className="w-full pl-3 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
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
                className="w-full pl-3 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
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
                className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
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
                className="w-full pl-3 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
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

          {/* 5. Jenis Penilaian */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Jenis Penilaian
            </label>
            <div className="relative">
              <select
                value={config.jenisPenilaian}
                onChange={(e) => {
                  const newJenis = e.target.value as JenisPenilaianType;
                  onChangeConfig({
                    jenisPenilaian: newJenis,
                    namaPenilaian: config.namaPenilaian || `${newJenis} 1`
                  });
                }}
                className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
              >
                {jenisPenilaianOptions.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 6. Nama Penilaian */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Nama Penilaian
            </label>
            <input
              type="text"
              value={config.namaPenilaian}
              onChange={(e) => onChangeConfig({ namaPenilaian: e.target.value })}
              placeholder="Contoh: Tugas 1 - SPLDV"
              className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* 7. Tanggal Penilaian */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Tanggal Penilaian
            </label>
            <input
              type="date"
              value={config.tanggal}
              onChange={(e) => onChangeConfig({ tanggal: e.target.value })}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};
