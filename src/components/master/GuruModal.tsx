/**
 * =========================================================================
 * GuruModal.tsx - Modal Form for Create & Edit Master Guru
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  KeyRound,
  BookOpen,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { IGuru, IMapel } from '../../types.ts';

interface GuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: IGuru) => Promise<boolean>;
  guru?: IGuru | null;
  mapelList: IMapel[];
  isSaving: boolean;
}

export const GuruModal: React.FC<GuruModalProps> = ({
  isOpen,
  onClose,
  onSave,
  guru,
  mapelList,
  isSaving
}) => {
  const isEdit = Boolean(guru);

  const [formData, setFormData] = useState<IGuru>({
    ID_GURU: '',
    NAMA_GURU: '',
    USERNAME: '',
    PASSWORD: '',
    MAPEL: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (guru) {
      setFormData({
        ID_GURU: guru.ID_GURU || '',
        NAMA_GURU: guru.NAMA_GURU || '',
        USERNAME: guru.USERNAME || '',
        PASSWORD: '',
        MAPEL: guru.MAPEL || ''
      });
    } else {
      // Auto-generate random ID like G00X
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setFormData({
        ID_GURU: `G${randomSuffix}`,
        NAMA_GURU: '',
        USERNAME: '',
        PASSWORD: '',
        MAPEL: mapelList.length > 0 ? mapelList[0].NAMA_MATA_PELAJARAN : ''
      });
    }
    setErrors({});
    setShowPassword(false);
  }, [guru, isOpen, mapelList]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ID_GURU.trim()) {
      newErrors.ID_GURU = 'ID Guru wajib diisi';
    }

    if (!formData.NAMA_GURU.trim()) {
      newErrors.NAMA_GURU = 'Nama Lengkap Guru wajib diisi';
    }

    if (!formData.USERNAME.trim()) {
      newErrors.USERNAME = 'Username akun wajib diisi';
    } else if (formData.USERNAME.includes(' ')) {
      newErrors.USERNAME = 'Username tidak boleh mengandung spasi';
    }

    if (!isEdit && !formData.PASSWORD?.trim()) {
      newErrors.PASSWORD = 'Password wajib diisi untuk akun baru';
    } else if (formData.PASSWORD && formData.PASSWORD.length < 5) {
      newErrors.PASSWORD = 'Password minimal 5 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: IGuru = {
      ID_GURU: formData.ID_GURU.trim(),
      NAMA_GURU: formData.NAMA_GURU.trim(),
      USERNAME: formData.USERNAME.trim().toLowerCase(),
      MAPEL: formData.MAPEL?.trim() || ''
    };

    if (formData.PASSWORD?.trim()) {
      payload.PASSWORD = formData.PASSWORD.trim();
    }

    await onSave(payload);
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
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Edit Data Guru' : 'Tambah Guru Baru'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEdit
                  ? 'Perbarui informasi profil dan akun pendidik'
                  : 'Daftarkan data guru dan akun login ke sistem'}
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
          {/* Row: ID_GURU & USERNAME */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ID_GURU */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                ID Guru <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ID_GURU}
                onChange={(e) => setFormData({ ...formData, ID_GURU: e.target.value })}
                disabled={isEdit || isSaving}
                placeholder="Contoh: G001"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  isEdit
                    ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                    : errors.ID_GURU
                    ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30 focus:ring-2 focus:ring-rose-400'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              {errors.ID_GURU && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.ID_GURU}
                </p>
              )}
            </div>

            {/* USERNAME */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Username Login <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.USERNAME}
                onChange={(e) => setFormData({ ...formData, USERNAME: e.target.value })}
                disabled={isSaving}
                placeholder="contoh: budi_santoso"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  errors.USERNAME
                    ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30 focus:ring-2 focus:ring-rose-400'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              {errors.USERNAME && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.USERNAME}
                </p>
              )}
            </div>
          </div>

          {/* NAMA GURU */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Nama Lengkap & Gelar <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.NAMA_GURU}
              onChange={(e) => setFormData({ ...formData, NAMA_GURU: e.target.value })}
              disabled={isSaving}
              placeholder="Contoh: Budi Santoso, S.Pd., M.Pd."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                errors.NAMA_GURU
                  ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30 focus:ring-2 focus:ring-rose-400'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
              }`}
            />
            {errors.NAMA_GURU && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.NAMA_GURU}
              </p>
            )}
          </div>

          {/* MAPEL DIAMPU */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Mata Pelajaran Utama
            </label>
            <div className="relative">
              <input
                list="mapel-options"
                type="text"
                value={formData.MAPEL || ''}
                onChange={(e) => setFormData({ ...formData, MAPEL: e.target.value })}
                disabled={isSaving}
                placeholder="Pilih atau ketik nama mata pelajaran..."
                className="w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
              <datalist id="mapel-options">
                {mapelList.map((m) => (
                  <option key={m.ID_MAPEL} value={m.NAMA_MATA_PELAJARAN} />
                ))}
              </datalist>
            </div>
          </div>

          {/* PASSWORD */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password Akun {isEdit ? '(Opsional)' : <span className="text-rose-500">*</span>}
              </label>
              {isEdit && (
                <span className="text-[11px] text-slate-400">
                  Kosongkan jika tidak diubah
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.PASSWORD || ''}
                onChange={(e) => setFormData({ ...formData, PASSWORD: e.target.value })}
                disabled={isSaving}
                placeholder={isEdit ? '••••••••' : 'Minimal 5 karakter'}
                className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  errors.PASSWORD
                    ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/30 focus:ring-2 focus:ring-rose-400'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.PASSWORD && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.PASSWORD}
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
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEdit ? 'Simpan Perubahan' : 'Tambah Guru'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
