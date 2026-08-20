/**
 * =========================================================================
 * MobileNav.tsx - Bottom Tab Navigation for Mobile Viewports
 * =========================================================================
 */

import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  GraduationCap,
  BookOpen,
  Menu
} from 'lucide-react';
import { PageRoute } from './Sidebar.tsx';

interface MobileNavProps {
  currentPage: PageRoute;
  onSelectPage: (page: PageRoute) => void;
  onOpenMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentPage,
  onSelectPage,
  onOpenMenu
}) => {
  const tabs = [
    { id: 'dashboard' as PageRoute, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'presensi' as PageRoute, label: 'Presensi', icon: CalendarCheck2 },
    { id: 'nilai' as PageRoute, label: 'Nilai', icon: GraduationCap },
    { id: 'jurnal' as PageRoute, label: 'Jurnal', icon: BookOpen }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg transition-colors">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentPage === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectPage(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-normal'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[11px] font-medium tracking-tight">{tab.label}</span>
          </button>
        );
      })}

      {/* More / Menu Drawer Toggle */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[11px] font-medium tracking-tight">Lainnya</span>
      </button>
    </nav>
  );
};
