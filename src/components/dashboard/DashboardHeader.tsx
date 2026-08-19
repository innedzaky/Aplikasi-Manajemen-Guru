/**
 * =========================================================================
 * DashboardHeader.tsx - Teacher Profile Greeting, Date & Quick Actions
 * =========================================================================
 */

import React from 'react';
import {
  CalendarCheck2,
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PageRoute } from '../layout/Sidebar.tsx';

interface DashboardHeaderProps {
  namaGuru: string;
  mapel?: string;
  role?: string;
  onNavigate: (page: PageRoute) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  namaGuru,
  mapel,
  role,
  onNavigate
}) => {
  // Format tanggal Indonesia lengkap: "Jumat, 14 Agustus 2026"
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(today);

  // Waktu sapaan dinamis (Pagi / Siang / Sore / Malam)
  const hour = today.getHours();
  const greeting =
    hour < 11
      ? 'Selamat Pagi'
      : hour < 15
      ? 'Selamat Siang'
      : hour < 18
      ? 'Selamat Sore'
      : 'Selamat Malam';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10">
      {/* Background Decorative Pattern */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-32 h-32 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Greeting, Teacher Name, and Date */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-blue-100 border border-white/20">
            <Calendar className="w-3.5 h-3.5 text-blue-200" />
            <span>{formattedDate}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit']">
            {greeting}, {namaGuru}
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl">
            {role === 'admin'
              ? 'Selamat datang di Panel Manajemen Sekolah. Anda memiliki akses penuh terhadap seluruh master data dan rekapan kelas.'
              : `Pengampu mata pelajaran ${mapel || 'Terdaftar'}. Pantau progres presensi, input nilai rapor, dan pencatatan jurnal mengajar harian.`}
          </p>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Quick Action Presensi */}
          <button
            onClick={() => onNavigate('presensi')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-semibold text-xs sm:text-sm shadow-md transition-all duration-150 group cursor-pointer"
          >
            <CalendarCheck2 className="w-4 h-4 text-blue-600 transition-transform group-hover:scale-110" />
            <span>Presensi</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Quick Action Nilai */}
          <button
            onClick={() => onNavigate('nilai')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-semibold text-xs sm:text-sm border border-white/25 backdrop-blur-md transition-all duration-150 group cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-blue-200 transition-transform group-hover:scale-110" />
            <span>Nilai</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Quick Action Jurnal */}
          <button
            onClick={() => onNavigate('jurnal')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-semibold text-xs sm:text-sm border border-white/25 backdrop-blur-md transition-all duration-150 group cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-blue-200 transition-transform group-hover:scale-110" />
            <span>Jurnal</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
