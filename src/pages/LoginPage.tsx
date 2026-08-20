/**
 * =========================================================================
 * LoginPage.tsx - Modern Split-Design Authentication Page
 * =========================================================================
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Database,
  BookOpen,
  CalendarCheck2,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.tsx';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      error('Harap masukkan username dan password Anda.', 'Validasi Form');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(username.trim(), password.trim(), rememberMe);
      if (res.success) {
        success(res.message, 'Selamat Datang!');
      } else {
        error(res.message, 'Otentikasi Gagal');
      }
    } catch (err: any) {
      error(err.message || 'Terjadi gangguan koneksi.', 'Kesalahan Sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setUsername('budi');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors">
      {/* Left Feature & Branding Hero (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Accent */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white font-['Outfit']">
              BukuGuru
            </h1>
            <p className="text-xs text-blue-200">Aplikasi Presensi, Nilai & Jurnal Kelas</p>
          </div>
        </div>

        {/* Middle Feature Highlights */}
        <div className="z-10 max-w-lg space-y-8 my-auto">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/30 text-blue-100 border border-blue-400/30">
              <Database className="w-3.5 h-3.5" />
              Distributed Cloud Database System
            </span>
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white font-['Outfit']">
              Kelola Presensi, Nilai &amp; Jurnal Kelas Lebih Cepat dan Mudah.
            </h2>
            <p className="text-blue-100/90 text-sm leading-relaxed">
              Platform modern dan terintegrasi untuk mendukung efisiensi pengajaran guru, mulai dari presensi harian, penilaian berkala, hingga pencatatan jurnal refleksi.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2">
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-200">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Presensi Sekali Klik</h4>
                <p className="text-xs text-blue-200">Simpan status kehadiran seluruh siswa per kelas secara cepat.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Jurnal &amp; Agenda Pembelajaran</h4>
                <p className="text-xs text-blue-200">Dokumentasikan materi dan capaian pembelajaran secara terstruktur.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="z-10 flex items-center justify-between text-xs text-blue-200 border-t border-white/10 pt-6">
          <span>High-Speed Serverless API Engine</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Aman &amp; Terenkripsi
          </span>
        </div>
      </div>

      {/* Right Login Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white font-['Outfit']">
                BukuGuru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Aplikasi Presensi, Nilai &amp; Jurnal Kelas</p>
            </div>
          </div>

          {/* Form Title */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-['Outfit']">
              Masuk ke Akun
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gunakan username dan password yang terdaftar di sistem.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-700 rounded-md focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">Ingat sesi saya</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-medium rounded-xl shadow-md shadow-blue-500/20 transition-all text-sm cursor-pointer"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" className="text-white" />
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center">
              Simulasi cepat akun pengajar:
            </p>
            <div>
              <button
                type="button"
                onClick={handleDemoFill}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Gunakan Akun Demo Guru
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
