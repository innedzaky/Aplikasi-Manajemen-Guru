/**
 * =========================================================================
 * AttendanceChart.tsx - Attendance Distribution Visualizer (Donut & Badges)
 * =========================================================================
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { CheckCircle2, AlertCircle, Clock, XCircle, PieChart as PieIcon } from 'lucide-react';
import { IPresensiDistribution } from '../../types/dashboard.ts';

interface AttendanceChartProps {
  distribution: IPresensiDistribution;
}

const COLORS = {
  Hadir: '#047857', // Emerald 700
  Izin: '#d97706',  // Amber 600
  Sakit: '#64748b', // Slate 500
  Alpa: '#e11d48'   // Rose 600
};

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ distribution }) => {
  const total =
    (distribution.Hadir || 0) +
    (distribution.Izin || 0) +
    (distribution.Sakit || 0) +
    (distribution.Alpa || 0);

  const data = [
    { name: 'Hadir', value: distribution.Hadir || 0, color: COLORS.Hadir, icon: CheckCircle2 },
    { name: 'Izin', value: distribution.Izin || 0, color: COLORS.Izin, icon: Clock },
    { name: 'Sakit', value: distribution.Sakit || 0, color: COLORS.Sakit, icon: AlertCircle },
    { name: 'Alpa', value: distribution.Alpa || 0, color: COLORS.Alpa, icon: XCircle }
  ];

  const kehadiranPct = total > 0 ? Math.round(((distribution.Hadir || 0) / total) * 100) : 0;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
              Distribusi Kehadiran
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total {total} rekapan status presensi
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
            {kehadiranPct}% Hadir
          </span>
        </div>
      </div>

      {/* Donut Chart Container */}
      <div className="my-4 h-52 relative flex items-center justify-center">
        {total > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Siswa (${Math.round((Number(value) / total) * 100)}%)`, name]}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(51, 65, 85, 0.5)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
                {distribution.Hadir || 0}
              </span>
              <span className="text-[11px] font-medium text-slate-400">Siswa Hadir</span>
            </div>
          </>
        ) : (
          <div className="text-center text-xs text-slate-400">
            Belum ada rekapan data presensi.
          </div>
        )}
      </div>

      {/* Breakdown Legend Grid */}
      <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        {data.map((item) => {
          const Icon = item.icon;
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div
              key={item.name}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/70 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {item.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {item.value}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
