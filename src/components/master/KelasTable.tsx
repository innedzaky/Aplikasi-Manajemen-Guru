/**
 * =========================================================================
 * KelasTable.tsx - Data Table for Master Data Kelas
 * =========================================================================
 */

import React from 'react';
import { Edit2, Trash2, School, Users, UserCheck } from 'lucide-react';
import { IKelas } from '../../types.ts';

interface KelasTableProps {
  records: IKelas[];
  studentCountMap?: Record<string, number>;
  onEdit: (kelas: IKelas) => void;
  onDelete: (kelas: IKelas) => void;
}

export const KelasTable: React.FC<KelasTableProps> = ({
  records,
  studentCountMap = {},
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">ID Kelas</th>
              <th className="py-3.5 px-4 min-w-[200px]">Nama Rombel / Kelas</th>
              <th className="py-3.5 px-4 min-w-[200px]">Wali Kelas</th>
              <th className="py-3.5 px-4 text-center">Jumlah Siswa</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
            {records.map((kelas) => {
              const totalSiswa = studentCountMap[kelas.NAMA_KELAS] || 0;

              return (
                <tr
                  key={kelas.ID_KELAS}
                  className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors"
                >
                  {/* ID KELAS */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                      {kelas.ID_KELAS}
                    </span>
                  </td>

                  {/* NAMA KELAS */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs shrink-0">
                        <School className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {kelas.NAMA_KELAS}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Rombongan Belajar
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* WALI KELAS */}
                  <td className="py-3.5 px-4">
                    {kelas.WALI_KELAS ? (
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                        <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>{kelas.WALI_KELAS}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Belum ditetapkan
                      </span>
                    )}
                  </td>

                  {/* JUMLAH SISWA */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                      <Users className="w-3 h-3 text-slate-500" />
                      {totalSiswa} Siswa
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(kelas)}
                        className="p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 dark:hover:text-purple-400 transition-colors"
                        title="Edit Kelas"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(kelas)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
                        title="Hapus Kelas"
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
    </div>
  );
};
