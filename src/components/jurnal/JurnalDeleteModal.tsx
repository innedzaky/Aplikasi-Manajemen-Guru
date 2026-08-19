/**
 * =========================================================================
 * JurnalDeleteModal.tsx - Modal Konfirmasi Hapus Entri Jurnal Mengajar
 * =========================================================================
 */

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { IJurnal } from '../../types.ts';
import { formatIndoDate } from '../../utils/dateUtils.ts';

interface JurnalDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: IJurnal | null;
  onConfirm: (record: IJurnal) => Promise<void>;
  isDeleting: boolean;
}

export const JurnalDeleteModal: React.FC<JurnalDeleteModalProps> = ({
  isOpen,
  onClose,
  record,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Warning */}
        <div className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-900">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Hapus Jurnal Mengajar?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Data jurnal pembelajaran ini akan dihapus dari Sheet{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">Jurnal</span> (Baris #{record._rowIndex}). Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        {/* Record Snapshot Card */}
        <div className="mx-6 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
          <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
            {record.MATERI}
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="font-mono">{formatIndoDate(record.TANGGAL)}</span>
            <span>•</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{record.KELAS}</span>
            <span>•</span>
            <span>{record.MAPEL}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Status: <span className="font-medium text-slate-700 dark:text-slate-300">{record.STATUS}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Batal
          </button>
          <button
            id="btn-confirm-delete-jurnal"
            type="button"
            disabled={isDeleting}
            onClick={() => onConfirm(record)}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Jurnal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
