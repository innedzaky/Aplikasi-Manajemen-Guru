/**
 * =========================================================================
 * SiswaTable.tsx - Data Table for Master Data Siswa
 * =========================================================================
 */

import React from 'react';
import { Edit2, Trash2, User, School } from 'lucide-react';
import { ISiswa } from '../../types.ts';

interface SiswaTableProps {
  records: ISiswa[];
  onEdit: (siswa: ISiswa) => void;
  onDelete: (siswa: ISiswa) => void;
}

export const SiswaTable: React.FC<SiswaTableProps> = ({
  records,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">NISN</th>
              <th className="py-3.5 px-4 min-w-[200px]">Nama Siswa</th>
              <th className="py-3.5 px-4">Kelas</th>
              <th className="py-3.5 px-4">Jenis Kelamin</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
            {records.map((siswa) => (
              <tr
                key={siswa.NISN}
                className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors"
              >
                {/* NISN */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                    {siswa.NISN}
                  </span>
                </td>

                {/* NAMA SISWA */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    >
                      {siswa.NAMA.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {siswa.NAMA}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Peserta Didik
                      </div>
                    </div>
                  </div>
                </td>

                {/* KELAS */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                    <School className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    {siswa.KELAS}
                  </span>
                </td>

                {/* JENIS KELAMIN */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {siswa.JENIS_KELAMIN === 'L' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Laki-laki (L)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Perempuan (P)
                    </span>
                  )}
                </td>

                {/* ACTIONS */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(siswa)}
                      className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-colors"
                      title="Edit Siswa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(siswa)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
                      title="Hapus Siswa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
