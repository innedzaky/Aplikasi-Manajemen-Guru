/**
 * =========================================================================
 * PresensiInputTable.tsx - Interactive Student Attendance Grid & Bulk Actions
 * =========================================================================
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  HeartPulse,
  XCircle,
  Save,
  CheckCheck,
  RotateCcw,
  Wand2,
  Users,
  AlertCircle,
  FileText
} from 'lucide-react';
import { ISiswa, IPresensi } from '../../types.ts';
import { PresensiConfig } from './PresensiHeader.tsx';

export interface StudentAttendanceItem {
  nisn: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  catatan: string;
}

interface PresensiInputTableProps {
  students: ISiswa[];
  config: PresensiConfig;
  guruName: string;
  onSaveBatch: (items: IPresensi[]) => Promise<boolean>;
  isSaving: boolean;
}

export const PresensiInputTable: React.FC<PresensiInputTableProps> = ({
  students,
  config,
  guruName,
  onSaveBatch,
  isSaving
}) => {
  // Local state mapped from student list
  const [attendanceList, setAttendanceList] = useState<StudentAttendanceItem[]>(() =>
    students.map((s) => ({
      nisn: s.NISN,
      nama: s.NAMA,
      jenisKelamin: s.JENIS_KELAMIN,
      status: 'Hadir',
      catatan: ''
    }))
  );

  // Sync state if student list changes
  React.useEffect(() => {
    setAttendanceList(
      students.map((s) => ({
        nisn: s.NISN,
        nama: s.NAMA,
        jenisKelamin: s.JENIS_KELAMIN,
        status: 'Hadir',
        catatan: ''
      }))
    );
  }, [students]);

  // Bulk Status Handlers
  const handleSetAllStatus = (newStatus: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa') => {
    setAttendanceList((prev) =>
      prev.map((item) => ({
        ...item,
        status: newStatus
      }))
    );
  };

  const handleUpdateStudentStatus = (nisn: string, status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa') => {
    setAttendanceList((prev) =>
      prev.map((item) => (item.nisn === nisn ? { ...item, status } : item))
    );
  };

  const handleUpdateStudentCatatan = (nisn: string, catatan: string) => {
    setAttendanceList((prev) =>
      prev.map((item) => (item.nisn === nisn ? { ...item, catatan } : item))
    );
  };

  // Metrics Calculation
  const total = attendanceList.length;
  const hadirCount = attendanceList.filter((s) => s.status === 'Hadir').length;
  const izinCount = attendanceList.filter((s) => s.status === 'Izin').length;
  const sakitCount = attendanceList.filter((s) => s.status === 'Sakit').length;
  const alpaCount = attendanceList.filter((s) => s.status === 'Alpa').length;
  const hadirPercent = total > 0 ? Math.round((hadirCount / total) * 100) : 0;

  const handleSave = async () => {
    if (attendanceList.length === 0) return;

    const payload: IPresensi[] = attendanceList.map((item) => ({
      TANGGAL: config.tanggal,
      GURU: guruName || 'Guru Pengajar',
      MAPEL: config.mapel,
      KELAS: config.kelas,
      PERTEMUAN: Number(config.pertemuan),
      NAMA_SISWA: item.nama,
      STATUS: item.status,
      CATATAN: item.catatan.trim(),
      TAHUN_PELAJARAN: config.tahunPelajaran,
      SEMESTER: config.semester,
      TIMESTAMP: new Date().toISOString()
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
          Pastikan rombel kelas telah terdaftar di Master Siswa atau pilih kelas lainnya pada filter di atas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Toolbar & Bulk Action Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-emerald-500" />
            Set Cepat:
          </span>
          <button
            type="button"
            onClick={() => handleSetAllStatus('Hadir')}
            className="px-3 py-1.5 rounded-xl text-[13px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Semua Hadir
          </button>
          <button
            type="button"
            onClick={() => handleSetAllStatus('Izin')}
            className="px-3 py-1.5 rounded-xl text-[13px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Semua Izin
          </button>
          <button
            type="button"
            onClick={() => handleSetAllStatus('Sakit')}
            className="px-3 py-1.5 rounded-xl text-[13px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Semua Sakit
          </button>
          <button
            type="button"
            onClick={() => handleSetAllStatus('Alpa')}
            className="px-3 py-1.5 rounded-xl text-[13px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Semua Alpa
          </button>
        </div>

        {/* Live Summary Chips */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3.5 text-[13px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Total: <span className="font-mono font-bold">{total}</span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              H: <span className="font-mono font-bold">{hadirCount}</span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              I: <span className="font-mono font-bold">{izinCount}</span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              S: <span className="font-mono font-bold">{sakitCount}</span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              A: <span className="font-mono font-bold">{alpaCount}</span>
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
                <span>Simpan Presensi Kelas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 min-w-[200px]">Data Siswa</th>
                <th className="py-3.5 px-4 min-w-[240px] text-center">Status Kehadiran</th>
                <th className="py-3.5 px-4 min-w-[260px]">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {attendanceList.map((item, index) => {
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
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
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

                    {/* 3. Status Picker Buttons */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Hadir */}
                        <button
                          type="button"
                          onClick={() => handleUpdateStudentStatus(item.nisn, 'Hadir')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[13px] flex items-center gap-1.5 cursor-pointer ${
                            item.status === 'Hadir'
                              ? 'bg-emerald-600 text-white shadow-xs scale-102'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Hadir</span>
                        </button>

                        {/* Izin */}
                        <button
                          type="button"
                          onClick={() => handleUpdateStudentStatus(item.nisn, 'Izin')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[13px] flex items-center gap-1.5 cursor-pointer ${
                            item.status === 'Izin'
                              ? 'bg-amber-500 text-white shadow-xs scale-102'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          <span>Izin</span>
                        </button>

                        {/* Sakit */}
                        <button
                          type="button"
                          onClick={() => handleUpdateStudentStatus(item.nisn, 'Sakit')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[13px] flex items-center gap-1.5 cursor-pointer ${
                            item.status === 'Sakit'
                              ? 'bg-amber-600 text-white shadow-xs scale-102'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600'
                          }`}
                        >
                          <HeartPulse className="w-4 h-4" />
                          <span>Sakit</span>
                        </button>

                        {/* Alpa */}
                        <button
                          type="button"
                          onClick={() => handleUpdateStudentStatus(item.nisn, 'Alpa')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[13px] flex items-center gap-1.5 cursor-pointer ${
                            item.status === 'Alpa'
                              ? 'bg-rose-600 text-white shadow-xs scale-102'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Alpa</span>
                        </button>
                      </div>
                    </td>

                    {/* 4. Catatan Keterangan */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.catatan}
                        onChange={(e) => handleUpdateStudentCatatan(item.nisn, e.target.value)}
                        placeholder="Keterangan / alasan (opsional)..."
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Quick Submit */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Persentase Kehadiran Kelas: <strong className="text-slate-900 dark:text-white font-mono">{hadirPercent}%</strong> ({hadirCount} dari {total} siswa)
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
                  <span>Simpan Presensi Kelas ({config.kelas})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
