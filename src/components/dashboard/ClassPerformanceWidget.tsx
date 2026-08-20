/**
 * =========================================================================
 * ClassPerformanceWidget.tsx - Class-Level Grade Average Progress List
 * =========================================================================
 */

import React from 'react';
import { School, Award, ChevronRight, BarChart2 } from 'lucide-react';
import { IClassGradeAverage } from '../../types/dashboard.ts';
import { PageRoute } from '../layout/Sidebar.tsx';

interface ClassPerformanceWidgetProps {
  data: IClassGradeAverage[];
  onNavigateNilai: () => void;
}

export const ClassPerformanceWidget: React.FC<ClassPerformanceWidgetProps> = ({
  data,
  onNavigateNilai
}) => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                Capaian Rata-Rata Kelas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ringkasan penilaian per rombongan belajar
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateNilai}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
          >
            Lihat Nilai
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Class Items List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 my-2">
          {data && data.length > 0 ? (
            data.map((item) => {
              const score = item.rataRata || 0;
              const isPassing = score >= 75;
              const progressPct = Math.min(100, Math.max(0, score));

              return (
                <div key={item.kelas} className="py-3.5 first:pt-2 last:pb-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 font-mono">
                        {item.kelas}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({item.totalSiswaDinilai} data nilai)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[13px] font-extrabold px-3 py-0.5 rounded-lg border font-mono ${
                          score >= 75
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-900/40'
                            : score > 0
                            ? 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {score}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        score >= 75
                          ? 'bg-emerald-500'
                          : score > 0
                          ? 'bg-emerald-500/60 dark:bg-emerald-600/60'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada data nilai per kelas yang tercatat.
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>KKM Standar: 75.0</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          Tuntas: {data.filter((d) => d.rataRata >= 75).length} / {data.length} Rombel
        </span>
      </div>
    </div>
  );
};
