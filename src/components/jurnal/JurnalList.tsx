/**
 * =========================================================================
 * JurnalList.tsx - List & Layout Coordinator for Phase 8 Jurnal Mengajar
 * =========================================================================
 */

import React from 'react';
import {
  BookOpen,
  PlusCircle,
  RotateCcw,
  Search,
  Filter
} from 'lucide-react';
import { IJurnal } from '../../types.ts';
import { JurnalCard } from './JurnalCard.tsx';
import { JurnalTable } from './JurnalTable.tsx';

interface JurnalListProps {
  records: IJurnal[];
  viewMode: 'cards' | 'table';
  isLoading: boolean;
  onViewDetail: (record: IJurnal) => void;
  onEdit: (record: IJurnal) => void;
  onDelete: (record: IJurnal) => void;
  onResetFilter: () => void;
  onCreateNew: () => void;
  hasActiveFilters: boolean;
}

export const JurnalList: React.FC<JurnalListProps> = ({
  records,
  viewMode,
  isLoading,
  onViewDetail,
  onEdit,
  onDelete,
  onResetFilter,
  onCreateNew,
  hasActiveFilters
}) => {
  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Memuat data Jurnal Mengajar dari Sheet...
        </p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
          <BookOpen className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {hasActiveFilters ? 'Tidak ada jurnal yang sesuai filter' : 'Belum Ada Jurnal Mengajar'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {hasActiveFilters
              ? 'Coba sesuaikan kata kunci pencarian atau reset filter kelas / mapel / status.'
              : 'Mulai dokumentasikan kegiatan belajar mengajar harian Anda sekarang.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilter}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreateNew}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tulis Jurnal Pertama</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Menampilkan <strong>{records.length}</strong> entri jurnal pembelajaran
        </span>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {records.map((record, index) => (
            <JurnalCard
              key={`${record._rowIndex || index}-${record.TANGGAL}-${record.KELAS}-${record.JAM}`}
              record={record}
              onViewDetail={onViewDetail}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <JurnalTable
          records={records}
          onViewDetail={onViewDetail}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};
