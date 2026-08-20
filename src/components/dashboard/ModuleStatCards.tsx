/**
 * =========================================================================
 * ModuleStatCards.tsx - Dedicated Module Analytics for Presensi, Nilai, Jurnal
 * Minimalist Slate & Sage Theme
 * =========================================================================
 */

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Award,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { IStatistikPresensiDetail, IStatistikNilaiDetail } from '../../utils/statsCalculator.ts';

// -----------------------------------------------------------------------------
// 1. STATISTIK PRESENSI (Rekap Hadir / Izin / Sakit / Alpa)
// -----------------------------------------------------------------------------
interface PresensiStatCardProps {
  stats: IStatistikPresensiDetail;
}

export const PresensiStatSummary: React.FC<PresensiStatCardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {/* Hadir */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Hadir
          </span>
          <span className="text-xs font-medium text-slate-400">{stats.persentaseHadir}%</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            {stats.hadir}
          </span>
          <span className="text-xs font-medium text-slate-400">Siswa</span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${stats.persentaseHadir}%` }}
          />
        </div>
      </div>

      {/* Izin */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Izin
          </span>
          <span className="text-xs font-medium text-slate-400">{stats.persentaseIzin}%</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            {stats.izin}
          </span>
          <span className="text-xs font-medium text-slate-400">Siswa</span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-slate-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${stats.persentaseIzin}%` }}
          />
        </div>
      </div>

      {/* Sakit */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Sakit
          </span>
          <span className="text-xs font-medium text-slate-400">{stats.persentaseSakit}%</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            {stats.sakit}
          </span>
          <span className="text-xs font-medium text-slate-400">Siswa</span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-500/80 h-full rounded-full transition-all duration-300"
            style={{ width: `${stats.persentaseSakit}%` }}
          />
        </div>
      </div>

      {/* Alpa */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Alpa
          </span>
          <span className="text-xs font-medium text-slate-400">{stats.persentaseAlpa}%</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            {stats.alpa}
          </span>
          <span className="text-xs font-medium text-slate-400">Siswa</span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-rose-500/80 h-full rounded-full transition-all duration-300"
            style={{ width: `${stats.persentaseAlpa}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// 2. STATISTIK NILAI (Rata-rata, Max, Min, Tuntas KKM)
// -----------------------------------------------------------------------------
interface NilaiStatSummaryProps {
  stats: IStatistikNilaiDetail;
}

export const NilaiStatSummary: React.FC<NilaiStatSummaryProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {/* Rata-Rata Nilai */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Rata-Rata
          </span>
          <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <BarChart2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            {stats.rataRata}
          </span>
          <span className="text-xs font-medium text-slate-400">/ 100</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Total {stats.total} rekaman nilai
        </p>
      </div>

      {/* Nilai Tertinggi */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Tertinggi
          </span>
          <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-['Outfit']">
            {stats.nilaiTertinggi}
          </span>
          <span className="text-xs font-medium text-slate-400">poin</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Skor tertinggi evaluasi
        </p>
      </div>

      {/* Nilai Terendah */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Terendah
          </span>
          <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-700 dark:text-slate-300 font-['Outfit']">
            {stats.nilaiTerendah}
          </span>
          <span className="text-xs font-medium text-slate-400">poin</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Skor terendah evaluasi
        </p>
      </div>

      {/* Tingkat Ketuntasan */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Tuntas KKM
          </span>
          <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            {stats.persentaseTuntas}%
          </span>
          <span className="text-xs font-medium text-slate-400">({stats.totalTuntas}/{stats.total})</span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${stats.persentaseTuntas}%` }}
          />
        </div>
      </div>
    </div>
  );
};
