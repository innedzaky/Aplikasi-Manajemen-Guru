/**
 * =========================================================================
 * JurnalForm.tsx - Form Input Jurnal Mengajar Baru (Phase 8)
 * =========================================================================
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Tag,
  Monitor,
  Target,
  FileText,
  MessageSquare,
  ClipboardList
} from 'lucide-react';
import { IJurnal, IKelas, IMapel } from '../../types.ts';

interface JurnalFormProps {
  kelasList: IKelas[];
  mapelList: IMapel[];
  currentGuru: string;
  onSave: (data: IJurnal) => Promise<boolean>;
  onCancel?: () => void;
  isSaving: boolean;
}

export const JurnalForm: React.FC<JurnalFormProps> = ({
  kelasList,
  mapelList,
  currentGuru,
  onSave,
  onCancel,
  isSaving
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<{
    tanggal: string;
    jam: string;
    kelas: string;
    mapel: string;
    materi: string;
    tujuanPembelajaran: string;
    aktivitas: string;
    metode: string;
    media: string;
    refleksi: string;
    catatan: string;
    status: 'Terlaksana' | 'Sebagian' | 'Tidak terlaksana';
  }>({
    tanggal: today,
    jam: '07:30 - 09:00 (Jam 1-2)',
    kelas: kelasList[0]?.NAMA_KELAS || '',
    mapel: mapelList[0]?.NAMA_MATA_PELAJARAN || '',
    materi: '',
    tujuanPembelajaran: '',
    aktivitas: '',
    metode: 'Problem Based Learning (PBL)',
    media: 'LCD Proyektor, LKPD, Modul Ajar',
    refleksi: '',
    catatan: '',
    status: 'Terlaksana'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preset time slots
  const jamPresets = [
    '07:30 - 09:00 (Jam 1-2)',
    '09:15 - 10:45 (Jam 3-4)',
    '10:45 - 12:15 (Jam 5-6)',
    '13:00 - 14:30 (Jam 7-8)'
  ];

  // Preset methods
  const metodePresets = [
    'Problem Based Learning (PBL)',
    'Project Based Learning (PjBL)',
    'Discovery Learning',
    'Inquiry Learning',
    'Ceramah & Diskusi Interaktif',
    'Demonstrasi & Praktik Langsung',
    'Kooperatif Jigsaw'
  ];

  // Preset media
  const mediaPresets = [
    'LCD Proyektor & Slide PPT',
    'LKPD Digital',
    'Google Classroom & Form',
    'Geogebra & Aplikasi Pembelajaran',
    'Papan Tulis & Modul Cetak',
    'Alat Peraga & Benda Konkret'
  ];

  const handleAddPreset = (field: 'metode' | 'media', value: string) => {
    setFormData((prev) => {
      const current = prev[field].trim();
      if (!current) return { ...prev, [field]: value };
      if (current.includes(value)) return prev;
      return { ...prev, [field]: `${current}, ${value}` };
    });
  };

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

    const payload: IJurnal = {
      TANGGAL: formData.tanggal,
      JAM: formData.jam.trim(),
      GURU: currentGuru || 'Guru Pengampu',
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
      // Reset form but keep defaults
      setFormData({
        tanggal: today,
        jam: '07:30 - 09:00 (Jam 1-2)',
        kelas: kelasList[0]?.NAMA_KELAS || '',
        mapel: mapelList[0]?.NAMA_MATA_PELAJARAN || '',
        materi: '',
        tujuanPembelajaran: '',
        aktivitas: '',
        metode: 'Problem Based Learning (PBL)',
        media: 'LCD Proyektor, LKPD, Modul Ajar',
        refleksi: '',
        catatan: '',
        status: 'Terlaksana'
      });
      setErrors({});
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Formulir Jurnal Mengajar Harian
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Entri agenda KBM lengkap yang akan disimpan otomatis ke Sheet{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Jurnal</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 font-medium">
            <GraduationCap className="w-4 h-4" />
            <span>Guru: <strong>{currentGuru || 'Budi Santoso, S.Pd.'}</strong></span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6">
        {/* Section 1: Konfigurasi Pertemuan (Tanggal, Jam, Kelas, Mapel) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            1. Informasi Waktu & Ruang Belajar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tanggal */}
            <div>
              <label htmlFor="jurnal-tanggal" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal <span className="text-rose-500">*</span>
              </label>
              <input
                id="jurnal-tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                  errors.tanggal
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.tanggal && <p className="text-rose-500 text-xs mt-1">{errors.tanggal}</p>}
            </div>

            {/* Jam */}
            <div>
              <label htmlFor="jurnal-jam" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Jam Mengajar <span className="text-rose-500">*</span>
              </label>
              <input
                id="jurnal-jam"
                type="text"
                value={formData.jam}
                onChange={(e) => setFormData({ ...formData, jam: e.target.value })}
                placeholder="Contoh: 07:30 - 09:00 (Jam 1-2)"
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.jam
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {jamPresets.map((jp) => (
                  <button
                    key={jp}
                    type="button"
                    onClick={() => setFormData({ ...formData, jam: jp })}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors border border-slate-300 dark:border-slate-700"
                  >
                    {jp.split(' ')[0]}
                  </button>
                ))}
              </div>
              {errors.jam && <p className="text-rose-500 text-xs mt-1">{errors.jam}</p>}
            </div>

            {/* Kelas */}
            <div>
              <label htmlFor="jurnal-kelas" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                id="jurnal-kelas"
                value={formData.kelas}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                  errors.kelas
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              >
                {kelasList.map((k) => (
                  <option key={k.ID_KELAS || k.NAMA_KELAS} value={k.NAMA_KELAS}>
                    {k.NAMA_KELAS}
                  </option>
                ))}
              </select>
              {errors.kelas && <p className="text-rose-500 text-xs mt-1">{errors.kelas}</p>}
            </div>

            {/* Mapel */}
            <div>
              <label htmlFor="jurnal-mapel" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mata Pelajaran <span className="text-rose-500">*</span>
              </label>
              <select
                id="jurnal-mapel"
                value={formData.mapel}
                onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                  errors.mapel
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
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
        </div>

        {/* Section 2: Materi & Tujuan Pembelajaran */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            2. Capaian & Pokok Bahasan
          </h3>

          <div className="space-y-4">
            {/* Materi */}
            <div>
              <label htmlFor="jurnal-materi" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Materi Pokok / Bahasan <span className="text-rose-500">*</span>
              </label>
              <input
                id="jurnal-materi"
                type="text"
                value={formData.materi}
                onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
                placeholder="Contoh: Sistem Persamaan Linear Dua Variabel (SPLDV) - Metode Eliminasi"
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.materi
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.materi && <p className="text-rose-500 text-xs mt-1">{errors.materi}</p>}
            </div>

            {/* Tujuan Pembelajaran */}
            <div>
              <label htmlFor="jurnal-tp" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tujuan Pembelajaran (TP)
              </label>
              <textarea
                id="jurnal-tp"
                rows={2}
                value={formData.tujuanPembelajaran}
                onChange={(e) => setFormData({ ...formData, tujuanPembelajaran: e.target.value })}
                placeholder="Contoh: Siswa mampu menentukan himpunan penyelesaian dari SPLDV menggunakan metode eliminasi dalam situasi kontekstual dengan tepat."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Aktivitas, Metode, & Media Pembelajaran */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-500" />
            3. Pelaksanaan Pembelajaran
          </h3>

          <div className="space-y-4">
            {/* Aktivitas Pembelajaran */}
            <div>
              <label htmlFor="jurnal-aktivitas" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Aktivitas Pembelajaran (Kegiatan Awal, Inti, Penutup)
              </label>
              <textarea
                id="jurnal-aktivitas"
                rows={3}
                value={formData.aktivitas}
                onChange={(e) => setFormData({ ...formData, aktivitas: e.target.value })}
                placeholder="Contoh: Pembagian kelompok studi kasus, diskusi pengerjaan LKPD pemodelan harga barang, presentasi solusi kelompok di depan kelas, dan asesmen formatif singkat."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
            </div>

            {/* Metode & Media (2 Kolom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Metode */}
              <div>
                <label htmlFor="jurnal-metode" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Metode Pembelajaran</span>
                </label>
                <input
                  id="jurnal-metode"
                  type="text"
                  value={formData.metode}
                  onChange={(e) => setFormData({ ...formData, metode: e.target.value })}
                  placeholder="Contoh: Problem Based Learning, Diskusi"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {/* Chip suggestions */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {metodePresets.slice(0, 4).map((mp) => (
                    <button
                      key={mp}
                      type="button"
                      onClick={() => handleAddPreset('metode', mp)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors border border-slate-300 dark:border-slate-700"
                    >
                      + {mp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media */}
              <div>
                <label htmlFor="jurnal-media" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Media & Sumber Belajar</span>
                </label>
                <input
                  id="jurnal-media"
                  type="text"
                  value={formData.media}
                  onChange={(e) => setFormData({ ...formData, media: e.target.value })}
                  placeholder="Contoh: LCD Proyektor, LKPD, Geogebra"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {/* Chip suggestions */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {mediaPresets.slice(0, 4).map((mdp) => (
                    <button
                      key={mdp}
                      type="button"
                      onClick={() => handleAddPreset('media', mdp)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors border border-slate-300 dark:border-slate-700"
                    >
                      + {mdp}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Refleksi, Catatan & Status Pembelajaran */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            4. Refleksi, Catatan, & Status Pelaksanaan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Refleksi */}
            <div>
              <label htmlFor="jurnal-refleksi" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Refleksi Guru
              </label>
              <textarea
                id="jurnal-refleksi"
                rows={2}
                value={formData.refleksi}
                onChange={(e) => setFormData({ ...formData, refleksi: e.target.value })}
                placeholder="Contoh: Sebagian besar siswa antusias dan memahami eliminasi, 3 siswa butuh bantuan pemodelan aljabar."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
            </div>

            {/* Catatan */}
            <div>
              <label htmlFor="jurnal-catatan" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Catatan Khusus / Tindak Lanjut
              </label>
              <textarea
                id="jurnal-catatan"
                rows={2}
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                placeholder="Contoh: Diberikan latihan mandiri terstruktur di Google Classroom untuk persiapan ulangan harian."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Status Pembelajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Status Pembelajaran <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Terlaksana */}
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.status === 'Terlaksana'
                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="status-pembelajaran"
                  value="Terlaksana"
                  checked={formData.status === 'Terlaksana'}
                  onChange={() => setFormData({ ...formData, status: 'Terlaksana' })}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Terlaksana</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Seluruh target materi dan aktivitas tuntas
                  </div>
                </div>
              </label>

              {/* Sebagian */}
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.status === 'Sebagian'
                    ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="status-pembelajaran"
                  value="Sebagian"
                  checked={formData.status === 'Sebagian'}
                  onChange={() => setFormData({ ...formData, status: 'Sebagian' })}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Sebagian</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Materi tersampaikan sebagian, butuh lanjutan
                  </div>
                </div>
              </label>

              {/* Tidak Terlaksana */}
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.status === 'Tidak terlaksana'
                    ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="status-pembelajaran"
                  value="Tidak terlaksana"
                  checked={formData.status === 'Tidak terlaksana'}
                  onChange={() => setFormData({ ...formData, status: 'Tidak terlaksana' })}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Tidak Terlaksana</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    KBM ditunda / digantikan kegiatan lain
                  </div>
                </div>
              </label>
            </div>
            {errors.status && <p className="text-rose-500 text-xs mt-1">{errors.status}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold transition-all"
            >
              Batal
            </button>
          )}

          <button
            id="btn-simpan-jurnal"
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-semibold text-sm shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 transition-all"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan ke Sheet...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Jurnal Mengajar</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
