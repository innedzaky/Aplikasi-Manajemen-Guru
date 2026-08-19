/**
 * =========================================================================
 * MapelModal.tsx - Modal Form for Create & Edit Master Mata Pelajaran
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  BookMarked,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { IMapel } from '../../types.ts';

interface MapelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: IMapel) => Promise<boolean>;
  mapel?: IMapel | null;
  isSaving: boolean;
}

export const MapelModal: React.FC<MapelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mapel,
  isSaving
}) => {
  const isEdit = Boolean(mapel);

  const [formData, setFormData] = useState<IMapel>({
    ID_MAPEL: '',
    NAMA_MATA_PELAJARAN: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mapel) {
      setFormData({
        ID_MAPEL: mapel.ID_MAPEL || '',
        NAMA_MATA_PELAJARAN: mapel.NAMA_MATA_PELAJARAN || ''
      });
    } else {
      setFormData({
        ID_MAPEL: '',
        NAMA_MATA_PELAJARAN: ''
      });
    }
    setErrors({});
  }, [mapel, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ID_MAPEL.trim()) {
      newErrors.ID_MAPEL = 'Kode / ID Mata Pelajaran wajib diisi';
    }

    if (!formData.NAMA_MATA_PELAJARAN.trim()) {
      newErrors.NAMA_MATA_PELAJARAN = 'Nama Mata Pelajaran wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSave({
      ID_MAPEL: formData.ID_MAPEL.trim().toUpperCase(),
      NAMA_MATA_PELAJARAN: formData.NAMA_MATA_PELAJARAN.trim()
    });
  };

  // Helper auto-suggest ID when typing Mapel name
  const handleNamaMapelChange = (val: string) => {
    if (!isEdit && !formData.ID_MAPEL) {
      const code = val
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 5);
      setFormData({
        ...formData,
        NAMA_MATA_PELAJARAN: val,
        ID_MAPEL: code ? `MP-${code}` : ''
      });
    } else {
      setFormData({ ...formData, NAMA_MATA_PELAJARAN: val });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={isSaving ? undefined : onClose}
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEdit
                  ? 'Perbarui kurikulum mata pelajaran terdaftar'
                  : 'Daftarkan mata pelajaran baru ke dalam database'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ID MAPEL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Kode / ID Mapel <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.ID_MAPEL}
              onChange={(e) => setFormData({ ...formData, ID_MAPEL: e.target.value.toUpperCase() })}
              disabled={isEdit || isSaving}
              placeholder="Contoh: MP-MAT, MP-BIN"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono uppercase text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                isEdit
                  ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                  : errors.ID_MAPEL
                  ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30 focus:ring-2 focus:ring-rose-400'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-500'
              }`}
            />
            {errors.ID_MAPEL && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.ID_MAPEL}
              </p>
            )}
          </div>

          {/* NAMA MATA PELAJARAN */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Nama Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.NAMA_MATA_PELAJARAN}
              onChange={(e) => handleNamaMapelChange(e.target.value)}
              disabled={isSaving}
              placeholder="Contoh: Matematika Peminatan"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                errors.NAMA_MATA_PELAJARAN
                  ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30 focus:ring-2 focus:ring-rose-400'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-500'
              }`}
            />
            {errors.NAMA_MATA_PELAJARAN && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.NAMA_MATA_PELAJARAN}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEdit ? 'Simpan Perubahan' : 'Tambah Mapel'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
