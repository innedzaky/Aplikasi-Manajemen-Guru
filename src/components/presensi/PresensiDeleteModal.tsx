/**
 * =========================================================================
 * PresensiDeleteModal.tsx - Delete Confirmation Modal for Attendance Records
 * =========================================================================
 */

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { IPresensi } from '../../types.ts';
import { formatIndoDate } from '../../utils/dateUtils.ts';

interface PresensiDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: IPresensi | null;
  onConfirmDelete: (record: IPresensi) => Promise<boolean>;
  isDeleting: boolean;
}

export const PresensiDeleteModal: React.FC<PresensiDeleteModalProps> = ({
  isOpen,
  onClose,
  record,
  onConfirmDelete,
  isDeleting
}) => {
  if (!isOpen || !record) return null;

  const handleDelete = async () => {
    const success = await onConfirmDelete(record);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
            Hapus Rekaman Presensi?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Tindakan ini akan menghapus baris data presensi siswa berikut dari lembar Google Spreadsheet.
          </p>

          <div className="my-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-left text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Nama Siswa:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-bold">{record.NAMA_SISWA}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Kelas & Mapel:</span>
              <span className="text-slate-700 dark:text-slate-300">{record.KELAS} • {record.MAPEL}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Pertemuan & Tanggal:</span>
              <span className="text-slate-700 dark:text-slate-300">#{record.PERTEMUAN} ({formatIndoDate(record.TANGGAL)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Status:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{record.STATUS}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-98 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
