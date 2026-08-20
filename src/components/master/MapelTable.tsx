/**
 * =========================================================================
 * MapelTable.tsx - Data Table for Master Data Mata Pelajaran
 * =========================================================================
 */

import React from 'react';
import { Edit2, Trash2, BookMarked, Users } from 'lucide-react';
import { IMapel } from '../../types.ts';

interface MapelTableProps {
  records: IMapel[];
  teacherCountMap?: Record<string, number>;
  onEdit: (mapel: IMapel) => void;
  onDelete: (mapel: IMapel) => void;
}

export const MapelTable: React.FC<MapelTableProps> = ({
  records,
  teacherCountMap = {},
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Kode Mapel</th>
              <th className="py-3.5 px-4 min-w-[240px]">Nama Mata Pelajaran</th>
              <th className="py-3.5 px-4 text-center">Pengampu Terdata</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
            {records.map((mapel) => {
              const totalGuru = teacherCountMap[mapel.NAMA_MATA_PELAJARAN] || 0;

              return (
                <tr
                  key={mapel.ID_MAPEL}
                  className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors"
                >
                  {/* ID MAPEL */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                      {mapel.ID_MAPEL}
                    </span>
                  </td>

                  {/* NAMA MATA PELAJARAN */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                        <BookMarked className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {mapel.NAMA_MATA_PELAJARAN}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Kurikulum Aktif
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* PENGAMPU TERDATA */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                      <Users className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      {totalGuru} Guru Pengampu
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(mapel)}
                        className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Edit Mata Pelajaran"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(mapel)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
                        title="Hapus Mata Pelajaran"
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
