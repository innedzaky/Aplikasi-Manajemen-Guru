/**
 * =========================================================================
 * KelasModal.tsx - Modal Form for Create & Edit Master Kelas
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  School,
  UserCheck,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { IKelas, IGuru } from '../../types.ts';

interface KelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: IKelas) => Promise<boolean>;
  kelas?: IKelas | null;
  guruList: IGuru[];
  isSaving: boolean;
}

export const KelasModal: React.FC<KelasModalProps> = ({
  isOpen,
  onClose,
  onSave,
  kelas,
  guruList,
  isSaving
}) => {
  const isEdit = Boolean(kelas);

  const [formData, setFormData] = useState<IKelas>({
    ID_KELAS: '',
    NAMA_KELAS: '',
    WALI_KELAS: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (kelas) {
      setFormData({
        ID_KELAS: kelas.ID_KELAS || '',
        NAMA_KELAS: kelas.NAMA_KELAS || '',
        WALI_KELAS: kelas.WALI_KELAS || ''
      });
    } else {
      setFormData({
        ID_KELAS: '',
        NAMA_KELAS: '',
        WALI_KELAS: ''
      });
    }
    setErrors({});
  }, [kelas, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ID_KELAS.trim()) {
      newErrors.ID_KELAS = 'ID Kelas wajib diisi';
    }

    if (!formData.NAMA_KELAS.trim()) {
      newErrors.NAMA_KELAS = 'Nama Kelas / Rombel wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSave({
      ID_KELAS: formData.ID_KELAS.trim(),
      NAMA_KELAS: formData.NAMA_KELAS.trim(),
      WALI_KELAS: formData.WALI_KELAS?.trim() || ''
    });
  };

  // Helper auto-suggest ID when typing Nama Kelas if creating
  const handleNamaKelasChange = (val: string) => {
    if (!isEdit && !formData.ID_KELAS) {
      const slug = val
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8);
      setFormData({
        ...formData,
        NAMA_KELAS: val,
        ID_KELAS: slug ? `K-${slug}` : ''
      });
    } else {
      setFormData({ ...formData, NAMA_KELAS: val });
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
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEdit
                  ? 'Perbarui rombel kelas dan penetapan wali kelas'
                  : 'Daftarkan rombongan belajar baru ke dalam database'}
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
          {/* ID KELAS & NAMA KELAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ID KELAS */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                ID Kelas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ID_KELAS}
                onChange={(e) => setFormData({ ...formData, ID_KELAS: e.target.value })}
                disabled={isEdit || isSaving}
                placeholder="Contoh: K10-TKJ1"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  isEdit
                    ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                    : errors.ID_KELAS
                    ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30 focus:ring-2 focus:ring-rose-400'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-purple-500'
                }`}
              />
              {errors.ID_KELAS && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.ID_KELAS}
                </p>
              )}
            </div>

            {/* NAMA KELAS */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Nama Kelas / Rombel <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.NAMA_KELAS}
                onChange={(e) => handleNamaKelasChange(e.target.value)}
                disabled={isSaving}
                placeholder="Contoh: X TKJ 1"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  errors.NAMA_KELAS
                    ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30 focus:ring-2 focus:ring-rose-400'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-purple-500'
                }`}
              />
              {errors.NAMA_KELAS && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.NAMA_KELAS}
                </p>
              )}
            </div>
          </div>

          {/* WALI KELAS */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Wali Kelas (Opsional)
            </label>
            <div className="relative">
              <input
                list="guru-wali-options"
                type="text"
                value={formData.WALI_KELAS || ''}
                onChange={(e) => setFormData({ ...formData, WALI_KELAS: e.target.value })}
                disabled={isSaving}
                placeholder="Pilih atau ketik nama guru wali kelas..."
                className="w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
              />
              <datalist id="guru-wali-options">
                {guruList.map((g) => (
                  <option key={g.ID_GURU} value={g.NAMA_GURU} />
                ))}
              </datalist>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pilih dari daftar guru terdaftar atau masukkan nama lengkap guru pembimbing.
            </p>
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
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEdit ? 'Simpan Perubahan' : 'Tambah Kelas'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
