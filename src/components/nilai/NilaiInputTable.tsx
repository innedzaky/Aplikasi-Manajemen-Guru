/**
 * =========================================================================
 * NilaiInputTable.tsx - Student Grades Batch Input Grid, Validation & Analytics
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Save,
  Wand2,
  Sparkles,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  BarChart3,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { ISiswa, INilai } from '../../types.ts';
import { NilaiConfig } from './NilaiHeader.tsx';

export interface StudentScoreItem {
  nisn: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  nilai: string; // string for controlled input handling
  catatan: string;
}

interface NilaiInputTableProps {
  students: ISiswa[];
  config: NilaiConfig;
  guruName: string;
  onSaveBatch: (items: INilai[]) => Promise<boolean>;
  isSaving: boolean;
  onShowValidationToast: (message: string) => void;
}

export const NilaiInputTable: React.FC<NilaiInputTableProps> = ({
  students,
  config,
  guruName,
  onSaveBatch,
  isSaving,
  onShowValidationToast
}) => {
  // Initialize state mapped from student list
  const [scoreList, setScoreList] = useState<StudentScoreItem[]>(() =>
    students.map((s) => ({
      nisn: s.NISN,
      nama: s.NAMA,
      jenisKelamin: s.JENIS_KELAMIN,
      nilai: '',
      catatan: ''
    }))
  );

  // Sync state if student list changes
  useEffect(() => {
    setScoreList(
      students.map((s) => ({
        nisn: s.NISN,
        nama: s.NAMA,
        jenisKelamin: s.JENIS_KELAMIN,
        nilai: '',
        catatan: ''
      }))
    );
  }, [students]);

  // Score change handler with validation
  const handleScoreChange = (nisn: string, value: string) => {
    // Only allow numbers and empty string
    if (value !== '' && !/^\d+$/.test(value)) return;

    // Check maximum range
    const num = Number(value);
    if (value !== '' && num > 100) return;

    setScoreList((prev) =>
      prev.map((item) => (item.nisn === nisn ? { ...item, nilai: value } : item))
    );
  };

  const handleCatatanChange = (nisn: string, catatan: string) => {
    setScoreList((prev) =>
      prev.map((item) => (item.nisn === nisn ? { ...item, catatan } : item))
    );
  };

  // Quick Action: Fill all students with a specific score
  const handleSetAllScore = (score: number) => {
    setScoreList((prev) =>
      prev.map((item) => ({
        ...item,
        nilai: String(score)
      }))
    );
  };

  // Quick Action: Clear all scores
  const handleClearAll = () => {
    setScoreList((prev) =>
      prev.map((item) => ({
        ...item,
        nilai: '',
        catatan: ''
      }))
    );
  };

  // Quick Action: Generate realistic sample scores (75–98)
  const handleGenerateSampleScores = () => {
    const samplePool = [80, 85, 90, 95, 78, 88, 92, 84, 96, 76, 82, 100, 86, 94];
    setScoreList((prev) =>
      prev.map((item, idx) => {
        const val = samplePool[(idx + item.nama.length) % samplePool.length];
        return {
          ...item,
          nilai: String(val),
          catatan: val >= 90 ? 'Sangat memuaskan' : val >= 75 ? 'Tuntas' : 'Perlu bimbingan'
        };
      })
    );
  };

  // Grade helper
  const getGradeInfo = (scoreStr: string) => {
    if (!scoreStr) return null;
    const score = Number(scoreStr);
    if (isNaN(score)) return null;

    if (score >= 90) {
      return {
        predikat: 'A',
        label: 'Sangat Baik',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        isTuntas: true
      };
    }
    if (score >= 80) {
      return {
        predikat: 'B',
        label: 'Baik',
        badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        isTuntas: true
      };
    }
    if (score >= 75) {
      return {
        predikat: 'C',
        label: 'Cukup (KKM)',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        isTuntas: true
      };
    }
    return {
      predikat: 'D',
      label: 'Remedial',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      isTuntas: false
    };
  };

  // Analytics Computation
  const validScores = scoreList
    .map((s) => Number(s.nilai))
    .filter((n) => !isNaN(n) && n >= 0 && n <= 100 && String(n).trim() !== '');

  const totalStudents = scoreList.length;
  const filledCount = scoreList.filter((s) => s.nilai.trim() !== '').length;
  const averageScore = validScores.length > 0
    ? (validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length).toFixed(1)
    : '0';
  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const lowestScore = validScores.length > 0 ? Math.min(...validScores) : 0;
  const tuntasCount = validScores.filter((n) => n >= 75).length;
  const tuntasPercent = validScores.length > 0
    ? Math.round((tuntasCount / validScores.length) * 100)
    : 0;

  // Submit Batch Handler
  const handleSave = async () => {
    if (!config.namaPenilaian.trim()) {
      onShowValidationToast('Nama Penilaian wajib diisi sebelum menyimpan.');
      return;
    }

    if (scoreList.length === 0) {
      onShowValidationToast('Tidak ada siswa di kelas ini.');
      return;
    }

    // Check for empty or invalid scores
    const emptyStudents = scoreList.filter((s) => s.nilai.trim() === '');
    if (emptyStudents.length > 0) {
      onShowValidationToast(
        `Nilai tidak boleh kosong! Masih ada ${emptyStudents.length} siswa belum diisi nilainya (${emptyStudents[0].nama}).`
      );
      return;
    }

    const invalidStudents = scoreList.filter((s) => {
      const num = Number(s.nilai);
      return isNaN(num) || num < 0 || num > 100;
    });

    if (invalidStudents.length > 0) {
      onShowValidationToast(
        `Nilai harus berada pada rentang 0–100! Siswa: ${invalidStudents[0].nama}`
      );
      return;
    }

    const payload: INilai[] = scoreList.map((item) => ({
      TIMESTAMP: new Date().toISOString(),
      TANGGAL: config.tanggal,
      GURU: guruName || 'Guru Pengajar',
      MAPEL: config.mapel,
      KELAS: config.kelas,
      JENIS_PENILAIAN: config.jenisPenilaian,
      NAMA_PENILAIAN: config.namaPenilaian.trim(),
      NAMA_SISWA: item.nama,
      NILAI: Number(item.nilai),
      TAHUN_PELAJARAN: config.tahunPelajaran,
      SEMESTER: config.semester,
      CATATAN: item.catatan.trim()
    }));

    await onSaveBatch(payload);
  };

  if (students.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Tidak Ada Data Siswa di Kelas {config.kelas}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Pastikan data rombel kelas telah terdaftar di Master Siswa atau pilih kelas lainnya pada filter di atas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Fill Toolbar & Live Summary */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-emerald-500" />
            Set Cepat:
          </span>
          <button
            type="button"
            onClick={() => handleSetAllScore(80)}
            className="px-2.5 py-1.5 rounded-xl text-[13px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Semua 80
          </button>
          <button
            type="button"
            onClick={() => handleSetAllScore(85)}
            className="px-2.5 py-1.5 rounded-xl text-[13px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Semua 85
          </button>
          <button
            type="button"
            onClick={() => handleSetAllScore(90)}
            className="px-2.5 py-1.5 rounded-xl text-[13px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Semua 90
          </button>
          <button
            type="button"
            onClick={() => handleSetAllScore(100)}
            className="px-2.5 py-1.5 rounded-xl text-[13px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Semua 100
          </button>
          <button
            type="button"
            onClick={handleGenerateSampleScores}
            className="px-2.5 py-1.5 rounded-xl text-[13px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Contoh Nilai Acak
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1.5 rounded-xl text-[13px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Kosongkan
          </button>
        </div>

        {/* Live Metrics Header */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3.5 text-[13px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Terisi: <strong className="font-mono">{filledCount}/{totalStudents}</strong>
            </span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              Rata-rata: {averageScore}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Tuntas: {tuntasPercent}%
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-[13px] font-bold bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan ke Sheet...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Nilai Kelas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analytics Highlights Card */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
          <span className="text-[11px] uppercase font-bold text-slate-400">Rata-Rata Kelas</span>
          <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
            {averageScore}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Target KKM: 75</p>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
          <span className="text-[11px] uppercase font-bold text-slate-400">Nilai Tertinggi</span>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {highestScore}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Maksimum: 100</p>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
          <span className="text-[11px] uppercase font-bold text-slate-400">Nilai Terendah</span>
          <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
            {lowestScore}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Minimum: 0</p>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
          <span className="text-[11px] uppercase font-bold text-slate-400">Ketuntasan (≥ 75)</span>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {tuntasPercent}% <span className="text-xs font-normal text-slate-400">({tuntasCount}/{validScores.length || totalStudents})</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {tuntasPercent >= 80 ? 'Kategori Baik' : 'Perlu Pengayaan'}
          </p>
        </div>
      </div>

      {/* Grade Table Grid */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 min-w-[200px]">Data Siswa</th>
                <th className="py-3.5 px-4 w-40 text-center">Nilai Angka (0–100) <span className="text-rose-500">*</span></th>
                <th className="py-3.5 px-4 min-w-[140px] text-center">Predikat & Ketuntasan</th>
                <th className="py-3.5 px-4 min-w-[240px]">Catatan / Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {scoreList.map((item, index) => {
                const gradeInfo = getGradeInfo(item.nilai);
                const isBlank = item.nilai.trim() === '';
                const num = Number(item.nilai);
                const isOutOfRange = !isBlank && (isNaN(num) || num < 0 || num > 100);

                return (
                  <tr
                    key={item.nisn}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* 1. No */}
                    <td className="py-3 px-4 text-center font-mono text-slate-400 font-semibold">
                      {index + 1}
                    </td>

                    {/* 2. Nama & NISN */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            item.jenisKelamin === 'L'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {item.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight text-sm sm:text-base">
                            {item.nama}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            NISN: {item.nisn} • {item.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 3. Input Nilai (0-100) */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center justify-center max-w-[120px] mx-auto">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={item.nilai}
                          onChange={(e) => handleScoreChange(item.nisn, e.target.value)}
                          placeholder="0 - 100"
                          className={`w-full px-3 py-2 text-center text-sm font-bold font-mono rounded-xl border transition-all focus:outline-hidden focus:ring-2 ${
                            isBlank
                              ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-emerald-500'
                              : isOutOfRange
                              ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 focus:ring-rose-500'
                              : num >= 75
                              ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-emerald-500'
                              : 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 focus:ring-rose-500'
                          }`}
                          required
                        />
                      </div>
                    </td>

                    {/* 4. Predikat & Ketuntasan */}
                    <td className="py-3 px-4 text-center">
                      {gradeInfo ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`px-3 py-1 rounded-lg text-[13px] font-bold border ${gradeInfo.badgeBg}`}
                          >
                            {gradeInfo.predikat} • {gradeInfo.label}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600 italic">
                          Belum diisi
                        </span>
                      )}
                    </td>

                    {/* 5. Catatan / Feedback */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.catatan}
                        onChange={(e) => handleCatatanChange(item.nisn, e.target.value)}
                        placeholder="Catatan guru (opsional)..."
                        className="w-full px-3 py-1.5 text-[13px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Submit Button */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Penilaian: <strong className="text-slate-900 dark:text-white font-bold">{config.jenisPenilaian} - {config.namaPenilaian || '(Nama Penilaian Belum Diisi)'}</strong> ({config.kelas} • {config.mapel})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan ke Sheet...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Nilai Kelas ({config.kelas})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
