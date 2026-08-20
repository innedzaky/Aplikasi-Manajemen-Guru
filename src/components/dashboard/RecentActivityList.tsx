/**
 * =========================================================================
 * RecentActivityList.tsx - Recent Teaching & Attendance Activity Feeds
 * =========================================================================
 */

import React from 'react';
import { Clock, BookOpen, CalendarCheck2, GraduationCap, CheckCircle2 } from 'lucide-react';
import { IRecentActivity } from '../../types/dashboard.ts';

interface RecentActivityListProps {
  activities?: IRecentActivity[];
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                Aktivitas & Log Terbaru
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Riwayat input data presensi dan jurnal terkini
              </p>
            </div>
          </div>
        </div>

        {/* Activity Items */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 my-2">
          {activities && activities.length > 0 ? (
            activities.map((act, idx) => {
              const isJurnal = act.tipe === 'jurnal';
              const Icon = isJurnal ? BookOpen : act.tipe === 'presensi' ? CalendarCheck2 : GraduationCap;

              return (
                <div key={act.id || `act-${act.tipe}-${idx}`} className="py-3.5 first:pt-2 last:pb-1 flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isJurnal
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {act.judul}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {act.waktu}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {act.subjudul}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada log aktivitas input harian.
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Semua perubahan tersimpan aman ke database
        </span>
      </div>
    </div>
  );
};
