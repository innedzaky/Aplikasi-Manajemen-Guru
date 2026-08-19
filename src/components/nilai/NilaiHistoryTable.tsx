/**
 * =========================================================================
 * NilaiHistoryTable.tsx - Assessment History, Search, Multi-Filter & Row Actions
 * =========================================================================
 */

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Edit3,
  Trash2,
  Award,
  BookOpen,
  Calendar,
  User,
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertCircle,
  Users,
  Download,
  FileType,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { INilai, IKelas, IMapel } from '../../types.ts';
import {
  filterRecords,
  extractUniqueOptions,
  STANDARD_TAHUN_PELAJARAN,
  STANDARD_SEMESTER,
  STANDARD_JENIS_PENILAIAN
} from '../../utils/filterUtils.ts';
import { StatsCalculator } from '../../utils/statsCalculator.ts';
import { ExportUtils, ExportFormat, IExportReportMetadata } from '../../utils/exportUtils.ts';
import { ExportModal } from '../common/ExportModal.tsx';
import { FilterBar, FilterFieldConfig } from '../common/FilterBar.tsx';
import { formatIndoDate } from '../../utils/dateUtils.ts';

interface NilaiHistoryTableProps {
  records: INilai[];
  kelasList: IKelas[];
  mapelList: IMapel[];
  onEditRecord: (record: INilai) => void;
  onDeleteRecord: (record: INilai) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const NilaiHistoryTable: React.FC<NilaiHistoryTableProps> = ({
  records,
  kelasList,
  mapelList,
  onEditRecord,
  onDeleteRecord,
  isLoading,
  onRefresh
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({
    tanggal: '',
    guru: 'ALL',
    kelas: 'ALL',
    mapel: 'ALL',
    semester: 'ALL',
    tahunPelajaran: 'ALL',
    jenisPenilaian: 'ALL',
    rentangNilai: 'ALL'
  });

  // Extract unique teachers from nilai records
  const uniqueGurus = useMemo(() => {
    return extractUniqueOptions(records, 'GURU');
  }, [records]);

  // Handle single filter change
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilters({
      tanggal: '',
      guru: 'ALL',
      kelas: 'ALL',
      mapel: 'ALL',
      semester: 'ALL',
      tahunPelajaran: 'ALL',
      jenisPenilaian: 'ALL',
      rentangNilai: 'ALL'
    });
  };

  // Export Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleExport = (format: ExportFormat, meta: Partial<IExportReportMetadata>) => {
    ExportUtils.exportNilai(filteredRecords, format, {
      ...meta,
      kelas: filters.kelas !== 'ALL' ? filters.kelas : 'Semua Kelas',
      mapel: filters.mapel !== 'ALL' ? filters.mapel : 'Semua Mapel',
      namaGuru: filters.guru !== 'ALL' ? filters.guru : 'Guru Pengampu',
      semester: filters.semester !== 'ALL' ? filters.semester : 'Ganjil',
      tahunPelajaran: filters.tahunPelajaran !== 'ALL' ? filters.tahunPelajaran : '2025/2026'
    });
  };

  // Filtered dataset using reusable filter engine
  const filteredRecords = useMemo(() => {
    return filterRecords(
      records,
      {
        search: searchTerm,
        searchFields: ['NAMA_SISWA', 'NAMA_PENILAIAN', 'CATATAN', 'GURU', 'KELAS', 'MAPEL'],
        tanggal: filters.tanggal,
        guru: filters.guru,
        kelas: filters.kelas,
        mapel: filters.mapel,
        semester: filters.semester,
        tahunPelajaran: filters.tahunPelajaran,
        jenisPenilaian: filters.jenisPenilaian,
        rentangNilai: filters.rentangNilai
      }
    );
  }, [records, searchTerm, filters]);

  // Statistics for filtered records using StatsCalculator
  const stats = useMemo(() => {
    const detail = StatsCalculator.calculateNilaiStats(filteredRecords);
    return {
      total: detail.total,
      avg: detail.rataRata.toString(),
      max: detail.nilaiTertinggi,
      min: detail.nilaiTerendah,
      tuntas: detail.totalTuntas,
      tuntasPercent: Math.round(detail.persentaseTuntas)
    };
  }, [filteredRecords]);

  // Jenis Penilaian Badge Styling
  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case 'Tugas':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'UH':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'PTS':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'PAS':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'Praktik':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Project':
        return 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  // Define Filter Fields for Reusable FilterBar
  const filterFields: FilterFieldConfig[] = [
    {
      key: 'tanggal',
      label: 'Tanggal',
      type: 'date',
      icon: Calendar
    },
    {
      key: 'guru',
      label: 'Guru',
      icon: User,
      options: uniqueGurus.map((g) => ({ value: g, label: g }))
    },
    {
      key: 'kelas',
      label: 'Kelas',
      icon: GraduationCap,
      options: kelasList.map((k) => ({ value: k.NAMA_KELAS, label: k.NAMA_KELAS }))
    },
    {
      key: 'mapel',
      label: 'Mata Pelajaran',
      icon: BookOpen,
      options: mapelList.map((m) => ({ value: m.NAMA_MATA_PELAJARAN, label: m.NAMA_MATA_PELAJARAN }))
    },
    {
      key: 'semester',
      label: 'Semester',
      icon: Layers,
      options: [...STANDARD_SEMESTER]
    },
    {
      key: 'tahunPelajaran',
      label: 'Tahun Pelajaran',
      options: [...STANDARD_TAHUN_PELAJARAN]
    },
    {
      key: 'jenisPenilaian',
      label: 'Jenis Penilaian',
      icon: Award,
      options: [...STANDARD_JENIS_PENILAIAN]
    },
    {
      key: 'rentangNilai',
      label: 'Rentang Nilai',
      options: [
        { value: 'A', label: '≥ 90 (Sangat Baik / A)' },
        { value: 'B', label: '80 – 89 (Baik / B)' },
        { value: 'C', label: '75 – 79 (Cukup / C)' },
        { value: 'D', label: '< 75 (Remedial / D)' }
      ]
    }
  ];

  return (
    <div className="space-y-4">
      {/* Reusable FilterBar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari berdasarkan nama siswa, nama penilaian, kelas, mapel..."
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        fields={filterFields}
        totalCount={records.length}
        filteredCount={filteredRecords.length}
        itemLabel="rekaman nilai"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              disabled={filteredRecords.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Ekspor data nilai sesuai filter aktif"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Laporan</span>
            </button>
            <button
              id="btn-sync-nilai-history"
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sinkronkan</span>
            </button>
          </div>
        }
      />

      {/* Live Filter Metric Badges */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-semibold">Statistik Rekapitulasi:</span>
          <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Total: {stats.total}
          </span>
          <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
            Rata-rata: {stats.avg}
          </span>
          <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
            Tertinggi: {stats.max}
          </span>
          <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
            Terendah: {stats.min}
          </span>
          <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
            Tuntas: {stats.tuntasPercent}%
          </span>
        </div>

        <span className="text-[11px] text-slate-400">
          Menampilkan {filteredRecords.length} dari total {records.length} data nilai tersimpan
        </span>
      </div>

      {/* History Data Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Tidak Ditemukan Rekaman Nilai Siswa
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Tidak ada data penilaian yang sesuai dengan kombinasi filter dan kata kunci pencarian Anda.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-3 px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Penilaian & Tanggal</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Kelas & Mapel</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Nama Siswa</th>
                  <th className="py-3.5 px-4 w-32 text-center">Nilai Angka</th>
                  <th className="py-3.5 px-4 min-w-[120px] text-center">Ketuntasan</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Catatan / Feedback</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Guru Pengajar</th>
                  <th className="py-3.5 px-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredRecords.map((item, index) => {
                  const score = Number(item.NILAI);
                  const isTuntas = score >= 75;
                  const jenisClass = getJenisBadge(item.JENIS_PENILAIAN);

                  return (
                    <tr
                      key={item._rowIndex || `${item.NAMA_PENILAIAN}-${item.NAMA_SISWA}-${index}`}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400 font-semibold">
                        {index + 1}
                      </td>

                      {/* Penilaian & Tanggal */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${jenisClass}`}>
                            {item.JENIS_PENILAIAN}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white mt-1">
                          {item.NAMA_PENILAIAN}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {formatIndoDate(item.TANGGAL || '2026-08-10')}
                        </div>
                      </td>

                      {/* Kelas & Mapel */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.KELAS}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {item.MAPEL}
                        </div>
                      </td>

                      {/* Nama Siswa */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {item.NAMA_SISWA}
                      </td>

                      {/* Nilai Angka */}
                      <td className="py-3 px-4 text-center">
                        <div
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-xl font-bold font-mono text-sm border ${
                            score >= 90
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : score >= 80
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : score >= 75
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {item.NILAI}
                        </div>
                      </td>

                      {/* Ketuntasan */}
                      <td className="py-3 px-4 text-center">
                        {isTuntas ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Tuntas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Remedial
                          </span>
                        )}
                      </td>

                      {/* Catatan */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item.CATATAN ? (
                          <span className="italic">{item.CATATAN}</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Guru */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                        {item.GURU || 'Guru Pengajar'}
                      </td>

                      {/* Aksi (Edit & Delete) */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditRecord(item)}
                            title="Edit nilai siswa ini"
                            className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(item)}
                            title="Hapus rekaman nilai ini"
                            className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Ekspor Laporan Penilaian Siswa"
        reportType="nilai"
        totalFilteredRecords={filteredRecords.length}
        defaultKelas={filters.kelas !== 'ALL' ? filters.kelas : undefined}
        defaultMapel={filters.mapel !== 'ALL' ? filters.mapel : undefined}
        onExport={handleExport}
      />
    </div>
  );
};

