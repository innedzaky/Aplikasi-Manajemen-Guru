/**
 * =========================================================================
 * JurnalEditModal.tsx - Modal Edit Entri Jurnal Mengajar (Phase 8)
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Calendar,
  Clock,
  GraduationCap,
  Target,
  FileText,
  MessageSquare,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Tag,
  Monitor
} from 'lucide-react';
import { IJurnal, IKelas, IMapel } from '../../types.ts';

interface JurnalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: IJurnal | null;
  kelasList: IKelas[];
  mapelList: IMapel[];
  onSave: (data: Partial<IJurnal> & { _rowIndex: number }) => Promise<boolean>;
  isSaving: boolean;
}

export const JurnalEditModal: React.FC<JurnalEditModalProps> = ({
  isOpen,
  onClose,
  record,
  kelasList,
  mapelList,
  onSave,
  isSaving
}) => {
  const [formData, setFormData] = useState<{
    tanggal: string;
    jam: string;
    kelas: string;
    mapel: string;
    guru: string;
    materi: string;
    tujuanPembelajaran: string;
    aktivitas: string;
    metode: string;
    media: string;
    refleksi: string;
    catatan: string;
    status: 'Terlaksana' | 'Sebagian' | 'Tidak terlaksana';
  }>({
    tanggal: '',
    jam: '',
    kelas: '',
    mapel: '',
    guru: '',
    materi: '',
    tujuanPembelajaran: '',
    aktivitas: '',
    metode: '',
    media: '',
    refleksi: '',
    catatan: '',
    status: 'Terlaksana'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (record) {
      setFormData({
        tanggal: record.TANGGAL || '',
        jam: record.JAM || '',
        kelas: record.KELAS || '',
        mapel: record.MAPEL || '',
        guru: record.GURU || '',
        materi: record.MATERI || '',
        tujuanPembelajaran: record.TUJUAN_PEMBELAJARAN || '',
        aktivitas: record.AKTIVITAS || '',
        metode: record.METODE || '',
        media: record.MEDIA || '',
        refleksi: record.REFLEKSI || '',
        catatan: record.CATATAN || '',
        status: (record.STATUS as any) || 'Terlaksana'
      });
      setErrors({});
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.tanggal) errs.tanggal = 'Tanggal wajib diisi';
    if (!formData.jam.trim()) errs.jam = 'Jam KBM wajib diisi';
    if (!formData.kelas.trim()) errs.kelas = 'Kelas wajib dipilih';
    if (!formData.mapel.trim()) errs.mapel = 'Mata pelajaran wajib dipilih';
    if (!formData.materi.trim()) errs.materi = 'Topik / Materi pembelajaran wajib diisi';
    if (!formData.status) errs.status = 'Status pembelajaran wajib dipilih';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!record._rowIndex) return;

    const payload: Partial<IJurnal> & { _rowIndex: number } = {
      _rowIndex: record._rowIndex,
      TANGGAL: formData.tanggal,
      JAM: formData.jam.trim(),
      GURU: formData.guru.trim() || record.GURU,
      MAPEL: formData.mapel.trim(),
      KELAS: formData.kelas.trim(),
      MATERI: formData.materi.trim(),
      TUJUAN_PEMBELAJARAN: formData.tujuanPembelajaran.trim(),
      AKTIVITAS: formData.aktivitas.trim(),
      METODE: formData.metode.trim(),
      MEDIA: formData.media.trim(),
      REFLEKSI: formData.refleksi.trim(),
      CATATAN: formData.catatan.trim(),
      STATUS: formData.status
    };

    const success = await onSave(payload);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-slate-50 dark:from-emerald-950/30 dark:to-slate-900">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Edit Jurnal Mengajar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Perbarui rincian KBM pada baris Sheet #{record._rowIndex}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Grid 1: Waktu & Identitas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {errors.tanggal && <p className="text-rose-500 text-xs mt-1">{errors.tanggal}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jam KBM <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.jam}
                  onChange={(e) => setFormData({ ...formData, jam: e.target.value })}
                  placeholder="07:30 - 09:00 (Jam 1-2)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {errors.jam && <p className="text-rose-500 text-xs mt-1">{errors.jam}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kelas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {kelasList.map((k) => (
                    <option key={k.ID_KELAS || k.NAMA_KELAS} value={k.NAMA_KELAS}>
                      {k.NAMA_KELAS}
                    </option>
                  ))}
                </select>
                {errors.kelas && <p className="text-rose-500 text-xs mt-1">{errors.kelas}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.mapel}
                  onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {mapelList.map((m) => (
                    <option key={m.ID_MAPEL || m.NAMA_MATA_PELAJARAN} value={m.NAMA_MATA_PELAJARAN}>
                      {m.NAMA_MATA_PELAJARAN}
                    </option>
                  ))}
                </select>
                {errors.mapel && <p className="text-rose-500 text-xs mt-1">{errors.mapel}</p>}
              </div>
            </div>

            {/* Materi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Materi Pokok / Bahasan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.materi}
                onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {errors.materi && <p className="text-rose-500 text-xs mt-1">{errors.materi}</p>}
            </div>

            {/* Tujuan Pembelajaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tujuan Pembelajaran (TP)
              </label>
              <textarea
                rows={2}
                value={formData.tujuanPembelajaran}
                onChange={(e) => setFormData({ ...formData, tujuanPembelajaran: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Aktivitas Pembelajaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Aktivitas Pembelajaran
              </label>
              <textarea
                rows={3}
                value={formData.aktivitas}
                onChange={(e) => setFormData({ ...formData, aktivitas: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Metode & Media */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Metode Pembelajaran
                </label>
                <input
                  type="text"
                  value={formData.metode}
                  onChange={(e) => setFormData({ ...formData, metode: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Media Pembelajaran
                </label>
                <input
                  type="text"
                  value={formData.media}
                  onChange={(e) => setFormData({ ...formData, media: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Refleksi & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Refleksi Guru
                </label>
                <textarea
                  rows={2}
                  value={formData.refleksi}
                  onChange={(e) => setFormData({ ...formData, refleksi: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Khusus
                </label>
                <textarea
                  rows={2}
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Status Pembelajaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Status Pembelajaran <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-medium ${
                    formData.status === 'Terlaksana'
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="edit-status"
                    value="Terlaksana"
                    checked={formData.status === 'Terlaksana'}
                    onChange={() => setFormData({ ...formData, status: 'Terlaksana' })}
                  />
                  <span>Terlaksana</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-medium ${
                    formData.status === 'Sebagian'
                      ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="edit-status"
                    value="Sebagian"
                    checked={formData.status === 'Sebagian'}
                    onChange={() => setFormData({ ...formData, status: 'Sebagian' })}
                  />
                  <span>Sebagian</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-medium ${
                    formData.status === 'Tidak terlaksana'
                      ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="edit-status"
                    value="Tidak terlaksana"
                    checked={formData.status === 'Tidak terlaksana'}
                    onChange={() => setFormData({ ...formData, status: 'Tidak terlaksana' })}
                  />
                  <span>Tidak Terlaksana</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
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
