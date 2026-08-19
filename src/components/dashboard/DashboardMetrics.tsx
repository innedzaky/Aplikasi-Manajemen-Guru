/**
 * =========================================================================
 * DashboardMetrics.tsx - Overview Counter Cards
 * =========================================================================
 */

import React from 'react';
import {
  CalendarCheck2,
  BookOpen,
  School,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';
import { IDashboardSummary, IDashboardToday } from '../../types/dashboard.ts';

interface DashboardMetricsProps {
  summary: IDashboardSummary;
  today: IDashboardToday;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  summary,
  today
}) => {
  const cards = [
    {
      id: 'presensi-today',
      title: 'Presensi Hari Ini',
      value: today.presensiHariIni,
      suffix: 'Siswa',
      desc: 'Tercatat hadir & izin hari ini',
      icon: CalendarCheck2,
      color: 'blue',
      bgLight: 'bg-blue-50 dark:bg-blue-950/40',
      textLight: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-100 dark:border-blue-900/60'
    },
    {
      id: 'jurnal-today',
      title: 'Jurnal Hari Ini',
      value: today.jurnalHariIni,
      suffix: 'Sesi',
      desc: 'Modul ajar telah didokumentasikan',
      icon: BookOpen,
      color: 'emerald',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
      textLight: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-100 dark:border-emerald-900/60'
    },
    {
      id: 'total-kelas',
      title: 'Jumlah Kelas',
      value: summary.totalKelas,
      suffix: 'Rombel',
      desc: 'Kelas terdaftar aktif di sistem',
      icon: School,
      color: 'indigo',
      bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
      textLight: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-100 dark:border-indigo-900/60'
    },
    {
      id: 'total-siswa',
      title: 'Total Siswa Aktif',
      value: summary.totalSiswa,
      suffix: 'Orang',
      desc: `Terbagi dalam ${summary.totalKelas} rombongan belajar`,
      icon: Users,
      color: 'violet',
      bgLight: 'bg-violet-50 dark:bg-violet-950/40',
      textLight: 'text-violet-600 dark:text-violet-400',
      borderColor: 'border-violet-100 dark:border-violet-900/60'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit'] tracking-tight">
                    {card.value}
                  </span>
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    {card.suffix}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${card.bgLight} ${card.textLight} border ${card.borderColor} shrink-0`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate">{card.desc}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
