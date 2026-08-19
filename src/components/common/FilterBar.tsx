/**
 * =========================================================================
 * FilterBar.tsx - Reusable, Universal Search & Multi-Filter Component
 * =========================================================================
 * Designed for consistent user experience across Presensi, Nilai, Jurnal,
 * Dashboard, and Master Data modules.
 */

import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  Calendar,
  User,
  GraduationCap,
  BookOpen,
  Layers,
  Award,
  Filter,
  X,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  CalendarRange
} from 'lucide-react';
import {
  STANDARD_TAHUN_PELAJARAN,
  STANDARD_SEMESTER,
  STANDARD_JENIS_PENILAIAN
} from '../../utils/filterUtils.ts';

export interface FilterOption {
  value: string;
  label: string;
  badge?: string | number;
}

export type FilterFieldType = 'select' | 'date' | 'daterange';

export interface FilterFieldConfig {
  key: string;
  label: string;
  type?: FilterFieldType;
  options?: (FilterOption | string)[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  colSpan?: string; // Tailwind class e.g. "col-span-1" or "col-span-2"
}

export interface FilterBarProps {
  // Search
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  hideSearch?: boolean;

  // Dynamic filter values & change handler
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onResetFilters: () => void;

  // Filter configuration
  fields: FilterFieldConfig[];

  // Statistics & Metadata
  totalCount?: number;
  filteredCount?: number;
  itemLabel?: string; // e.g. "siswa", "rekaman presensi", "jurnal", "guru"

  // Action Slots
  actions?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  hideSearch = false,
  filters,
  onFilterChange,
  onResetFilters,
  fields,
  totalCount,
  filteredCount,
  itemLabel = 'data',
  actions,
  className = '',
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Determine which filters are currently active (non-empty, not 'ALL')
  const activeFilters = Object.entries(filters).filter(([key, val]) => {
    if (val === undefined || val === null || val === '' || val === 'ALL' || val === 'Semua') {
      return false;
    }
    return true;
  });

  const hasActiveSearch = Boolean(searchTerm && searchTerm.trim());
  const hasActiveFilters = activeFilters.length > 0 || hasActiveSearch;

  // Helper to format and deduplicate option items
  const normalizeOptions = (rawOptions?: (FilterOption | string)[]): FilterOption[] => {
    if (!rawOptions) return [];
    const seen = new Set<string>();
    const result: FilterOption[] = [];
    rawOptions.forEach((opt) => {
      if (opt === undefined || opt === null) return;
      const item: FilterOption =
        typeof opt === 'string'
          ? { value: opt, label: opt }
          : {
              value: opt.value ?? '',
              label: opt.label ?? String(opt.value ?? ''),
              badge: opt.badge
            };

      const valStr = String(item.value).trim();
      if (!valStr && !item.label) return;
      if (!seen.has(valStr)) {
        seen.add(valStr);
        result.push({
          value: item.value,
          label: item.label || valStr,
          badge: item.badge
        });
      }
    });
    return result;
  };

  return (
    <div
      id="unified-filter-bar"
      className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all ${
        compact ? 'p-3.5 space-y-3' : 'p-4 sm:p-5 space-y-4'
      } ${className}`}
    >
      {/* Top Row: Search Input + Quick Actions + Reset */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Field */}
        {!hideSearch && onSearchChange && (
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              id="filter-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/80 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                id="filter-clear-search-btn"
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Hapus kata kunci pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Result Count Indicator */}
          {filteredCount !== undefined && totalCount !== undefined && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Menampilkan <strong className="font-bold text-slate-900 dark:text-white">{filteredCount}</strong> dari {totalCount} {itemLabel}
              </span>
            </div>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              id="filter-reset-all-btn"
              type="button"
              onClick={onResetFilters}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}

          {/* Custom Actions Slot (e.g. Refresh, Export, View Mode) */}
          {actions}
        </div>
      </div>

      {/* Filter Selects & Date Inputs Grid */}
      {fields.length > 0 && (
        <div
          id="filter-fields-grid"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1"
        >
          {fields.map((field) => {
            const currentValue = filters[field.key] ?? 'ALL';
            const Icon = field.icon;
            const options = normalizeOptions(field.options);

            // 1. Date Picker Field
            if (field.type === 'date') {
              return (
                <div key={field.key} className={field.colSpan || 'col-span-1'}>
                  <label
                    htmlFor={`filter-${field.key}`}
                    className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {Icon && <Icon className="w-3 h-3 text-slate-400" />}
                    <span>{field.label}</span>
                  </label>
                  <div className="relative">
                    <input
                      id={`filter-${field.key}`}
                      type="date"
                      value={filters[field.key] || ''}
                      onChange={(e) => onFilterChange(field.key, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/80 cursor-pointer"
                    />
                    {filters[field.key] && (
                      <button
                        type="button"
                        onClick={() => onFilterChange(field.key, '')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Hapus filter tanggal"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            // 2. Select Dropdown Field
            return (
              <div key={field.key} className={field.colSpan || 'col-span-1'}>
                <label
                  htmlFor={`filter-${field.key}`}
                  className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1"
                >
                  {Icon && <Icon className="w-3 h-3 text-slate-400" />}
                  <span className="truncate">{field.label}</span>
                </label>
                <div className="relative">
                  <select
                    id={`filter-${field.key}`}
                    value={currentValue}
                    onChange={(e) => onFilterChange(field.key, e.target.value)}
                    className="w-full pl-2.5 pr-6 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/80 cursor-pointer appearance-none truncate"
                  >
                    <option key={`filter-${field.key}-all`} value="ALL">
                      {field.placeholder || `Semua ${field.label.replace(/^Semua\s+/i, '')}`}
                    </option>
                    {options.map((opt, optIdx) => (
                      <option key={`filter-${field.key}-opt-${optIdx}-${opt.value}`} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Filter Pills (Interactive badges with quick remove) */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filter Aktif:</span>
          </span>

          {hasActiveSearch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
              <span>Pencarian: "{searchTerm}"</span>
              {onSearchChange && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="hover:text-blue-900 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}

          {activeFilters.map(([key, val]) => {
            const field = fields.find((f) => f.key === key);
            const label = field ? field.label : key;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium"
              >
                <span className="text-slate-400">{label}:</span>
                <span className="font-semibold">{String(val)}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange(key, 'ALL')}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
