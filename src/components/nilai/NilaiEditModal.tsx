/**
 * =========================================================================
 * NilaiEditModal.tsx - Edit Student Assessment Record Modal Dialog
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { INilai } from '../../types.ts';
import { JenisPenilaianType } from './NilaiHeader.tsx';

interface NilaiEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: INilai | null;
  onSave: (updatedRecord: INilai) => Promise<boolean>;
  isSaving: boolean;
}

export const NilaiEditModal: React.FC<NilaiEditModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
  isSaving
}) => {
  const [formData, setFormData] = useState<INilai | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
      setErrorMsg(null);
    }
  }, [record]);

  if (!isOpen || !formData) return null;

  const jenisOptions: JenisPenilaianType[] = [
    'Tugas',
    'UH',
    'PTS',
    'PAS',
    'Praktik',
    'Project'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Validation
    if (!formData.NAMA_PENILAIAN.trim()) {
      setErrorMsg('Nama Penilaian tidak boleh kosong.');
      return;
    }

    const num = Number(formData.NILAI);
    if (isNaN(num) || num < 0 || num > 100) {
      setErrorMsg('Nilai harus berupa angka dalam rentang 0–100.');
      return;
    }

    setErrorMsg(null);
    const success = await onSave({
      ...formData,
      NILAI: num,
      NAMA_PENILAIAN: formData.NAMA_PENILAIAN.trim(),
      CATATAN: formData.CATATAN?.trim() || ''
    });

    if (success) {
      onClose();
    }
  };

  const score = Number(formData.NILAI);
  const isTuntas = !isNaN(score) && score >= 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
              Edit Data Nilai Siswa
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Perbarui nilai angka, jenis penilaian, atau catatan evaluasi siswa.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Readonly Info Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Nama Siswa</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {formData.NAMA_SISWA}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Kelas & Mapel</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {formData.KELAS} • {formData.MAPEL}
              </p>
            </div>
          </div>

          {/* Tanggal & Jenis Penilaian */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Penilaian
              </label>
              <input
                type="date"
                value={formData.TANGGAL || '2026-08-10'}
                onChange={(e) => setFormData({ ...formData, TANGGAL: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Jenis Penilaian <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.JENIS_PENILAIAN}
                onChange={(e) => setFormData({ ...formData, JENIS_PENILAIAN: e.target.value as JenisPenilaianType })}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                required
              >
                {jenisOptions.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nama Penilaian */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Nama Penilaian <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.NAMA_PENILAIAN}
              onChange={(e) => setFormData({ ...formData, NAMA_PENILAIAN: e.target.value })}
              placeholder="Contoh: Tugas 1 - SPLDV"
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Nilai Angka (0-100) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Nilai Angka (0–100) <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-bold ${isTuntas ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isTuntas ? '✓ Tuntas (≥ 75 KKM)' : '⚠ Perlu Remedial (< 75)'}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.NILAI}
                onChange={(e) => setFormData({ ...formData, NILAI: Number(e.target.value) })}
                className="w-full px-4 py-2.5 text-sm font-bold font-mono rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Catatan / Feedback */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Catatan / Feedback Guru (Opsional)
            </label>
            <textarea
              rows={2}
              value={formData.CATATAN || ''}
              onChange={(e) => setFormData({ ...formData, CATATAN: e.target.value })}
              placeholder="Contoh: Tuntas dengan nilai sangat baik..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
