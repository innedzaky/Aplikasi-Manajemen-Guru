/**
 * =========================================================================
 * MasterTabsNav.tsx - Unified Master Data Tab Switcher
 * =========================================================================
 */

import React from 'react';
import { Users, UserSquare2, School, BookMarked } from 'lucide-react';
import { PageRoute } from '../layout/Sidebar.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface MasterTabsNavProps {
  activeRoute: 'guru' | 'siswa' | 'kelas' | 'mapel';
  onSelectTab: (route: PageRoute) => void;
  counts?: {
    guru?: number;
    siswa?: number;
    kelas?: number;
    mapel?: number;
  };
}

export const MasterTabsNav: React.FC<MasterTabsNavProps> = ({
  activeRoute,
  onSelectTab,
  counts
}) => {
  const { isAdmin } = useAuth();

  const allTabs = [
    {
      id: 'guru' as PageRoute,
      label: 'Data Guru',
      icon: Users,
      count: counts?.guru,
      color: 'blue',
      adminOnly: true
    },
    {
      id: 'siswa' as PageRoute,
      label: 'Data Siswa',
      icon: UserSquare2,
      count: counts?.siswa,
      color: 'emerald',
      adminOnly: false
    },
    {
      id: 'kelas' as PageRoute,
      label: 'Data Kelas',
      icon: School,
      count: counts?.kelas,
      color: 'purple',
      adminOnly: false
    },
    {
      id: 'mapel' as PageRoute,
      label: 'Mata Pelajaran',
      icon: BookMarked,
      count: counts?.mapel,
      color: 'amber',
      adminOnly: false
    }
  ];

  const visibleTabs = allTabs.filter(t => !t.adminOnly || isAdmin);

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto scrollbar-none">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeRoute === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
              isActive
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <Icon
              className={`w-4 h-4 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
