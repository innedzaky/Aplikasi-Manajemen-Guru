/**
 * =========================================================================
 * ModuleStatCards.tsx - Dedicated Module Analytics for Presensi, Nilai, Jurnal
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
  BarChart2,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { IStatistikPresensiDetail, IStatistikNilaiDetail, IStatistikJurnalDetail } from '../../utils/statsCalculator.ts';

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
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Hadir</span>
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            {stats.hadir}
          </span>
          <span className="text-xs font-medium text-slate-400">({stats.persentaseHadir}%)</span>
        </div>
        <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${stats.persentaseHadir}%` }}
          />
        </div>
      </div>

      {/* Izin */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Izin</span>
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            {stats.izin}
          </span>
          <span className="text-xs font-medium text-slate-400">({stats.persentaseIzin}%)</span>
        </div>
        <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${stats.persentaseIzin}%` }}
          />
        </div>
      </div>

      {/* Sakit */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Sakit</span>
          <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            {stats.sakit}
          </span>
          <span className="text-xs font-medium text-slate-400">({stats.persentaseSakit}%)</span>
        </div>
        <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-purple-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${stats.persentaseSakit}%` }}
          />
        </div>
      </div>

      {/* Alpa */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Alpa</span>
          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            {stats.alpa}
          </span>
          <span className="text-xs font-medium text-slate-400">({stats.persentaseAlpa}%)</span>
        </div>
        <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-rose-500 h-full rounded-full transition-all duration-300"
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
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Rata-Rata</span>
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <BarChart2 className="w-4 h-4" />
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
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Tertinggi</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Award className="w-4 h-4" />
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
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Terendah</span>
          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-['Outfit']">
            {stats.nilaiTerendah}
          </span>
          <span className="text-xs font-medium text-slate-400">poin</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Skor terendah evaluasi
        </p>
      </div>

      {/* Tingkat Ketuntasan */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">Tuntas KKM</span>
          <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            {stats.persentaseTuntas}%
          </span>
          <span className="text-xs font-medium text-slate-400">({stats.totalTuntas}/{stats.total})</span>
        </div>
        <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-teal-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${stats.persentaseTuntas}%` }}
          />
        </div>
      </div>
    </div>
  );
};
