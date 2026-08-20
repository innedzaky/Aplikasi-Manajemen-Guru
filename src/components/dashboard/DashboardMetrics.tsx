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
      dotColor: 'bg-emerald-500'
    },
    {
      id: 'jurnal-today',
      title: 'Jurnal Hari Ini',
      value: today.jurnalHariIni,
      suffix: 'Sesi',
      desc: 'Modul ajar telah didokumentasikan',
      icon: BookOpen,
      dotColor: 'bg-emerald-600'
    },
    {
      id: 'total-kelas',
      title: 'Jumlah Kelas',
      value: summary.totalKelas,
      suffix: 'Rombel',
      desc: 'Kelas terdaftar aktif di sistem',
      icon: School,
      dotColor: 'bg-slate-500'
    },
    {
      id: 'total-siswa',
      title: 'Total Siswa Aktif',
      value: summary.totalSiswa,
      suffix: 'Orang',
      desc: `Terbagi dalam ${summary.totalKelas} rombongan belajar`,
      icon: Users,
      dotColor: 'bg-emerald-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between"
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
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${card.dotColor}`} />
              <span className="truncate">{card.desc}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
