/**
 * =========================================================================
 * PresensiEditModal.tsx - Edit Attendance Record Modal Dialog
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle2, Clock, HeartPulse, XCircle, Calendar, User, BookOpen } from 'lucide-react';
import { IPresensi } from '../../types.ts';

interface PresensiEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: IPresensi | null;
  onSave: (updatedRecord: IPresensi) => Promise<boolean>;
  isSaving: boolean;
}

export const PresensiEditModal: React.FC<PresensiEditModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
  isSaving
}) => {
  const [formData, setFormData] = useState<IPresensi | null>(null);

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
    }
  }, [record]);

  if (!isOpen || !formData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    const success = await onSave(formData);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
              Edit Data Presensi Siswa
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Perbarui status kehadiran atau catatan keterangan presensi.
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

          {/* Tanggal & Pertemuan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Tanggal
              </label>
              <input
                type="date"
                value={formData.TANGGAL}
                onChange={(e) => setFormData({ ...formData, TANGGAL: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Pertemuan Ke-
              </label>
              <input
                type="number"
                min="1"
                max="36"
                value={formData.PERTEMUAN}
                onChange={(e) => setFormData({ ...formData, PERTEMUAN: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Status Picker Buttons */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Status Kehadiran <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Hadir', icon: CheckCircle2, activeBg: 'bg-emerald-600 text-white', hoverBorder: 'hover:border-emerald-500' },
                { label: 'Izin', icon: Clock, activeBg: 'bg-amber-500 text-white', hoverBorder: 'hover:border-amber-500' },
                { label: 'Sakit', icon: HeartPulse, activeBg: 'bg-purple-600 text-white', hoverBorder: 'hover:border-purple-500' },
                { label: 'Alpa', icon: XCircle, activeBg: 'bg-rose-600 text-white', hoverBorder: 'hover:border-rose-500' }
              ].map((st) => {
                const Icon = st.icon;
                const isSelected = formData.STATUS === st.label;
                return (
                  <button
                    key={st.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, STATUS: st.label as any })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      isSelected
                        ? `${st.activeBg} border-transparent shadow-xs`
                        : `bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 ${st.hoverBorder}`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Catatan / Keterangan (Opsional)
            </label>
            <textarea
              rows={2}
              value={formData.CATATAN || ''}
              onChange={(e) => setFormData({ ...formData, CATATAN: e.target.value })}
              placeholder="Contoh: Izin urusan keluarga, surat dokter terlampir..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-98 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
