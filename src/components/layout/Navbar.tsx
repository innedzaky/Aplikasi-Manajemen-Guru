/**
 * =========================================================================
 * Navbar.tsx - Top Application Bar with Search, Mode Toggle & User Profile
 * =========================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Moon,
  Sun,
  LogOut,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ChevronDown,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface NavbarProps {
  onToggleSidebar: () => void;
  currentPageTitle: string;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, currentPageTitle, onOpenSettings }) => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const apiMode = ApiClient.getMode();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden cursor-pointer"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Outfit'] tracking-tight">
            {currentPageTitle}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400 dark:text-slate-500">
            Aplikasi Manajemen Guru & Kelas
          </p>
        </div>
      </div>

      {/* Right section: System Status, Theme Toggle, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Mode Badge (Clickable to open settings) */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            apiMode === 'live'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60'
          }`}
          title="Klik untuk mengubah URL atau mode backend"
        >
          <Globe className={`w-3.5 h-3.5 ${apiMode === 'live' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
          <span>{apiMode === 'live' ? 'GAS Live' : 'Demo (Lokal)'}</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
          title={isDark ? 'Tema Terang' : 'Tema Gelap'}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 pl-2 sm:pl-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.NAMA_GURU ? user.NAMA_GURU.charAt(0) : 'G'}
            </div>
            <div className="hidden md:block text-left pr-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight max-w-[130px] truncate">
                {user?.NAMA_GURU || 'Guru'}
              </p>
              <p className="text-[11px] text-slate-400 capitalize">
                {isAdmin ? 'Administrator' : user?.MAPEL || 'Guru'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-slate-700 dark:text-slate-200">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user?.NAMA_GURU}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    @{user?.USERNAME}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar / Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
