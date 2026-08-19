/**
 * =========================================================================
 * ExportModal.tsx - Interactive Export Dialog with Format & Metadata Selector
 * =========================================================================
 */

import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileType,
  Download,
  X,
  CheckCircle2,
  Filter,
  School,
  User,
  Calendar,
  Layers
} from 'lucide-react';
import { ExportFormat, IExportReportMetadata } from '../../utils/exportUtils.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reportType: 'presensi' | 'nilai' | 'jurnal';
  totalFilteredRecords: number;
  filterSummary?: string;
  defaultKelas?: string;
  defaultMapel?: string;
  onExport: (format: ExportFormat, metadata: Partial<IExportReportMetadata>) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  reportType,
  totalFilteredRecords,
  filterSummary,
  defaultKelas,
  defaultMapel,
  onExport
}) => {
  const { user } = useAuth();

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [namaSekolah, setNamaSekolah] = useState<string>(
    localStorage.getItem('manajemen_guru_nama_sekolah') || 'SMK NEGERI 1 CONTOH'
  );
  const [namaGuru, setNamaGuru] = useState<string>(user?.NAMA_GURU || 'Guru Pengampu');
  const [semester, setSemester] = useState<string>('Ganjil');
  const [tahunPelajaran, setTahunPelajaran] = useState<string>('2025/2026');

  if (!isOpen) return null;

  const handleTriggerExport = () => {
    localStorage.setItem('manajemen_guru_nama_sekolah', namaSekolah);

    onExport(selectedFormat, {
      namaSekolah,
      namaGuru,
      semester,
      tahunPelajaran,
      kelas: defaultKelas,
      mapel: defaultMapel,
      filterInfo: filterSummary
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ekspor data laporan sesuai filter yang sedang aktif
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Active Data Count Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-blue-700 dark:text-blue-300">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold">Jumlah Data Siap Ekspor:</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
              {totalFilteredRecords} Baris Data
            </span>
          </div>

          {filterSummary && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span className="text-[11px] leading-relaxed">
                <strong>Filter Aktif:</strong> {filterSummary}
              </span>
            </div>
          )}

          {/* Format Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Pilih Format Berkas
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* PDF Option */}
              <button
                type="button"
                onClick={() => setSelectedFormat('pdf')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedFormat === 'pdf'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <FileType className="w-4 h-4" />
                  </div>
                  {selectedFormat === 'pdf' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <span className="font-bold block text-xs">Dokumen PDF</span>
                  <span className="text-[10px] text-slate-400">Siap Cetak & TTD</span>
                </div>
              </button>

              {/* Excel Option */}
              <button
                type="button"
                onClick={() => setSelectedFormat('excel')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedFormat === 'excel'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  {selectedFormat === 'excel' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div>
                  <span className="font-bold block text-xs">Excel (.xlsx)</span>
                  <span className="text-[10px] text-slate-400">Spreadsheet Rapi</span>
                </div>
              </button>

              {/* CSV Option */}
              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedFormat === 'csv'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  {selectedFormat === 'csv' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div>
                  <span className="font-bold block text-xs">Format CSV</span>
                  <span className="text-[10px] text-slate-400">Data Raw Tabel</span>
                </div>
              </button>
            </div>
          </div>

          {/* Metadata Customization (KOP & Tanda Tangan) */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">
              Pengaturan Kop & Tanda Tangan Dokumen
            </span>

            {/* Nama Sekolah */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-blue-500" /> Nama Instansi / Sekolah
              </label>
              <input
                type="text"
                value={namaSekolah}
                onChange={(e) => setNamaSekolah(e.target.value)}
                placeholder="Contoh: SMKN 1 JAKARTA"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            {/* Nama Guru */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" /> Nama Guru Pengampu
              </label>
              <input
                type="text"
                value={namaGuru}
                onChange={(e) => setNamaGuru(e.target.value)}
                placeholder="Nama Lengkap & Gelar Guru"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            {/* Semester & Tahun Pelajaran */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" /> Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" /> Tahun Pelajaran
                </label>
                <select
                  value={tahunPelajaran}
                  onChange={(e) => setTahunPelajaran(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer"
                >
                  <option value="2024/2025">2024/2025</option>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027</option>
                  <option value="2027/2028">2027/2028</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleTriggerExport}
            disabled={totalFilteredRecords === 0}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Berkas {selectedFormat.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
