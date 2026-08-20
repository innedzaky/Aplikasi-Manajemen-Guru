/**
 * =========================================================================
 * SiswaModal.tsx - Modal Form for Create & Edit Master Siswa
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  UserSquare2,
  School,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ISiswa, IKelas } from '../../types.ts';

interface SiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ISiswa) => Promise<boolean>;
  siswa?: ISiswa | null;
  kelasList: IKelas[];
  isSaving: boolean;
}

export const SiswaModal: React.FC<SiswaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  siswa,
  kelasList,
  isSaving
}) => {
  const isEdit = Boolean(siswa);

  const [formData, setFormData] = useState<ISiswa>({
    NISN: '',
    NAMA: '',
    KELAS: '',
    JENIS_KELAMIN: 'L'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (siswa) {
      setFormData({
        NISN: siswa.NISN || '',
        NAMA: siswa.NAMA || '',
        KELAS: siswa.KELAS || '',
        JENIS_KELAMIN: siswa.JENIS_KELAMIN || 'L'
      });
    } else {
      setFormData({
        NISN: '',
        NAMA: '',
        KELAS: kelasList.length > 0 ? kelasList[0].NAMA_KELAS : '',
        JENIS_KELAMIN: 'L'
      });
    }
    setErrors({});
  }, [siswa, isOpen, kelasList]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.NISN.trim()) {
      newErrors.NISN = 'NISN siswa wajib diisi';
    } else if (!/^\d+$/.test(formData.NISN.trim())) {
      newErrors.NISN = 'NISN harus berupa angka (numerik)';
    } else if (formData.NISN.trim().length < 8) {
      newErrors.NISN = 'NISN minimal 8-10 digit';
    }

    if (!formData.NAMA.trim()) {
      newErrors.NAMA = 'Nama Lengkap Siswa wajib diisi';
    }

    if (!formData.KELAS.trim()) {
      newErrors.KELAS = 'Pilih atau tentukan kelas siswa';
    }

    if (!['L', 'P'].includes(formData.JENIS_KELAMIN)) {
      newErrors.JENIS_KELAMIN = 'Pilih jenis kelamin (L / P)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSave({
      NISN: formData.NISN.trim(),
      NAMA: formData.NAMA.trim(),
      KELAS: formData.KELAS.trim(),
      JENIS_KELAMIN: formData.JENIS_KELAMIN
    });
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
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserSquare2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEdit
                  ? 'Perbarui data identitas dan kelas siswa'
                  : 'Daftarkan data siswa baru ke dalam database'}
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
          {/* NISN & JENIS KELAMIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* NISN */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                NISN <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.NISN}
                onChange={(e) => setFormData({ ...formData, NISN: e.target.value.replace(/\D/g, '') })}
                disabled={isEdit || isSaving}
                placeholder="Contoh: 0081234567"
                maxLength={12}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  isEdit
                    ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                    : errors.NISN
                    ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30 focus:ring-2 focus:ring-rose-400'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500'
                }`}
              />
              {errors.NISN && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.NISN}
                </p>
              )}
            </div>

            {/* JENIS KELAMIN */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Jenis Kelamin <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, JENIS_KELAMIN: 'L' })}
                  disabled={isSaving}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    formData.JENIS_KELAMIN === 'L'
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span>Laki-laki (L)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, JENIS_KELAMIN: 'P' })}
                  disabled={isSaving}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    formData.JENIS_KELAMIN === 'P'
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span>Perempuan (P)</span>
                </button>
              </div>
            </div>
          </div>

          {/* NAMA SISWA */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Nama Lengkap Siswa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.NAMA}
              onChange={(e) => setFormData({ ...formData, NAMA: e.target.value })}
              disabled={isSaving}
              placeholder="Contoh: Ahmad Rizky Maulana"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                errors.NAMA
                  ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30 focus:ring-2 focus:ring-rose-400'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500'
              }`}
            />
            {errors.NAMA && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.NAMA}
              </p>
            )}
          </div>

          {/* KELAS */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Kelas <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                list="kelas-options"
                type="text"
                value={formData.KELAS}
                onChange={(e) => setFormData({ ...formData, KELAS: e.target.value })}
                disabled={isSaving}
                placeholder="Pilih atau ketik kelas..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  errors.KELAS
                    ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30 focus:ring-2 focus:ring-rose-400'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500'
                }`}
              />
              <datalist id="kelas-options">
                {kelasList.map((k) => (
                  <option key={k.ID_KELAS} value={k.NAMA_KELAS} />
                ))}
              </datalist>
            </div>
            {errors.KELAS && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.KELAS}
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
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEdit ? 'Simpan Perubahan' : 'Tambah Siswa'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
