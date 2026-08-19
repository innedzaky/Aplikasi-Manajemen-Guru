/**
 * =========================================================================
 * MonthlyTrendChart.tsx - Monthly Activity & Learning Progress Visualizer
 * =========================================================================
 */

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend
} from 'recharts';
import { TrendingUp, Activity, BarChart3, LineChart } from 'lucide-react';
import { IMonthlyActivityTrend } from '../../types/dashboard.ts';

interface MonthlyTrendChartProps {
  data: IMonthlyActivityTrend[];
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ data }) => {
  const [viewMetric, setViewMetric] = useState<'aktivitas' | 'nilai'>('aktivitas');

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
              Grafik Tren Bulanan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aktivitas pembelajaran & perkembangan nilai 6 bulan terakhir
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
          <button
            onClick={() => setViewMetric('aktivitas')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMetric === 'aktivitas'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Aktivitas (Presensi & Jurnal)
          </button>
          <button
            onClick={() => setViewMetric('nilai')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMetric === 'nilai'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Rata-Rata Nilai
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="my-4 h-64 w-full">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {viewMetric === 'aktivitas' ? (
              <BarChart
                data={data}
                margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="bulan"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(51, 65, 85, 0.5)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <Bar
                  dataKey="presensi"
                  name="Presensi Siswa"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="jurnal"
                  name="Jurnal Mengajar"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
              </BarChart>
            ) : (
              <ComposedChart
                data={data}
                margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="bulan"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  domain={[60, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip
                  formatter={(val: any) => [`${val} poin`, 'Rata-Rata Nilai']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(51, 65, 85, 0.5)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <Line
                  type="monotone"
                  dataKey="rataRataNilai"
                  name="Rata-Rata Nilai Siswa"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Data grafik bulanan belum tersedia.
          </div>
        )}
      </div>

      {/* Footer Info Note */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>* Grafik diperbarui secara otomatis dari aktivitas input harian</span>
        <span className="font-semibold text-slate-500 dark:text-slate-300">Target Ketuntasan: 75</span>
      </div>
    </div>
  );
};
