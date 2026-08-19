/**
 * =========================================================================
 * exportUtils.ts - Professional Reporting & Multi-Format Exporter
 * Supports CSV, Excel (.xlsx), and PDF with School Headers and Metadata
 * =========================================================================
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IPresensi, INilai, IJurnal } from '../types.ts';
import { SecurityUtils } from './securityUtils.ts';
import { formatIndoDate } from './dateUtils.ts';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface IExportReportMetadata {
  judul: string;
  subjudul?: string;
  namaSekolah?: string;
  namaGuru?: string;
  kelas?: string;
  mapel?: string;
  semester?: string;
  tahunPelajaran?: string;
  tanggalCetak?: string;
  filterInfo?: string;
}

export class ExportUtils {
  /**
   * Helper untuk mendownload file Blob di browser
   */
  private static triggerDownload(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * 1. EXPORT TO CSV (Generic with Formula Injection Prevention)
   */
  public static exportToCSV<T extends Record<string, any>>(
    headers: { key: keyof T | string; label: string }[],
    data: T[],
    fileName: string
  ): void {
    if (!data || data.length === 0) {
      console.warn('ExportUtils: Tidak ada data untuk diekspor ke CSV.');
      return;
    }

    const headerRow = headers.map((h) => `"${String(h.label).replace(/"/g, '""')}"`).join(',');
    const rows = data.map((item) =>
      headers
        .map((h) => {
          const rawVal = item[h.key] !== undefined && item[h.key] !== null ? item[h.key] : '';
          const safeVal = SecurityUtils.sanitizeForSpreadsheet(rawVal);
          return `"${String(safeVal).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.triggerDownload(blob, `${fileName}.csv`);
  }

  /**
   * 2. EXPORT TO EXCEL (.xlsx with Formula Injection Prevention)
   */
  public static exportToExcel<T extends Record<string, any>>(
    headers: { key: keyof T | string; label: string }[],
    data: T[],
    sheetName: string,
    fileName: string,
    metadata?: IExportReportMetadata
  ): void {
    if (!data || data.length === 0) {
      console.warn('ExportUtils: Tidak ada data untuk diekspor ke Excel.');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Buat data baris termasuk metadata jika ada
    const rows: (string | number | boolean)[][] = [];

    if (metadata) {
      rows.push([metadata.namaSekolah || 'SISTEM MANAJEMEN GURU']);
      rows.push([metadata.judul.toUpperCase()]);
      if (metadata.subjudul) rows.push([metadata.subjudul]);
      if (metadata.namaGuru) rows.push([`Guru Pengampu: ${metadata.namaGuru}`]);
      if (metadata.kelas || metadata.mapel) {
        rows.push([`Kelas: ${metadata.kelas || 'Semua'} | Mapel: ${metadata.mapel || 'Semua'}`]);
      }
      if (metadata.semester || metadata.tahunPelajaran) {
        rows.push([`Semester: ${metadata.semester || '-'} | TP: ${metadata.tahunPelajaran || '-'}`]);
      }
      rows.push([`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`]);
      rows.push([]); // Empty row as separator
    }

    // Header tabel
    rows.push(headers.map((h) => h.label));

    // Data baris tabel dengan proteksi formula injection
    data.forEach((item, index) => {
      const row = headers.map((h) => {
        if (h.key === '_index') return index + 1;
        const val = item[h.key];
        if (val === undefined || val === null) return '';
        return SecurityUtils.sanitizeForSpreadsheet(val);
      });
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Auto calculate column width
    const colWidths = headers.map((h) => ({
      wch: Math.max(h.label.length + 4, 15)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  /**
   * 3. EXPORT TO PDF (Standard School Document Format)
   */
  public static exportToPDF<T extends Record<string, any>>(
    headers: { key: keyof T | string; label: string }[],
    data: T[],
    metadata: IExportReportMetadata,
    fileName: string,
    orientation: 'portrait' | 'landscape' = 'portrait',
    summaryStats?: { label: string; value: string | number }[]
  ): void {
    if (!data || data.length === 0) {
      console.warn('ExportUtils: Tidak ada data untuk diekspor ke PDF.');
      return;
    }

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 14;

    // --- 1. KOP SURAT / HEADER LAPORAN ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(metadata.namaSekolah || 'SISTEM INFORMASI MANAJEMEN GURU', pageWidth / 2, currentY, {
      align: 'center'
    });

    currentY += 6;
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text(metadata.judul.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate-500
    if (metadata.subjudul) {
      doc.text(metadata.subjudul, pageWidth / 2, currentY, { align: 'center' });
      currentY += 4;
    }

    // Garis Pemisah Kop
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.5);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 5;

    // --- 2. INFORMASI METADATA (2 Kolom) ---
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    const leftInfo: string[] = [];
    if (metadata.namaGuru) leftInfo.push(`Guru Pengampu : ${metadata.namaGuru}`);
    if (metadata.kelas) leftInfo.push(`Kelas / Rombel : ${metadata.kelas}`);
    if (metadata.mapel) leftInfo.push(`Mata Pelajaran : ${metadata.mapel}`);

    const rightInfo: string[] = [];
    if (metadata.semester) rightInfo.push(`Semester       : ${metadata.semester}`);
    if (metadata.tahunPelajaran) rightInfo.push(`Tahun Pelajaran: ${metadata.tahunPelajaran}`);
    rightInfo.push(`Waktu Cetak    : ${new Date().toLocaleString('id-ID')}`);

    const infoLines = Math.max(leftInfo.length, rightInfo.length);
    for (let i = 0; i < infoLines; i++) {
      if (leftInfo[i]) doc.text(leftInfo[i], 14, currentY);
      if (rightInfo[i]) doc.text(rightInfo[i], pageWidth / 2 + 10, currentY);
      currentY += 4.2;
    }

    // Informasi Filter Tambahan jika ada
    if (metadata.filterInfo) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text(`Filter Aktif: ${metadata.filterInfo}`, 14, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 4;
    }

    // --- 3. KOTAK RINGKASAN STATISTIK (JIKA ADA) ---
    if (summaryStats && summaryStats.length > 0) {
      currentY += 2;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, currentY, pageWidth - 28, 10, 1.5, 1.5, 'FD');

      const statItemWidth = (pageWidth - 28) / summaryStats.length;
      summaryStats.forEach((stat, idx) => {
        const xPos = 14 + idx * statItemWidth + statItemWidth / 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(`${stat.label}: ${stat.value}`, xPos, currentY + 6.2, { align: 'center' });
      });

      currentY += 14;
    } else {
      currentY += 2;
    }

    // --- 4. TABEL UTAMA (jspdf-autotable) ---
    const tableHeaders = headers.map((h) => h.label);
    const tableBody = data.map((item, index) =>
      headers.map((h) => {
        if (h.key === '_index') return String(index + 1);
        const val = item[h.key];
        return val !== undefined && val !== null ? String(val) : '-';
      })
    );

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235], // Blue-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
        cellPadding: 2.5
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Slate-50
      },
      styles: {
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [226, 232, 240]
      },
      margin: { left: 14, right: 14, bottom: 25 },
      didDrawPage: (pageData) => {
        // Footer Nomor Halaman
        const pageNumber = pageData.pageNumber;
        const totalPages = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Halaman ${pageNumber} dari ${totalPages} | Dicetak dari Sistem Manajemen Guru`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }
    });

    // --- 5. TANDA TANGAN (SIGNATURE BLOCK) ---
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : currentY + 20;
    const pageHeight = doc.internal.pageSize.getHeight();

    // Jika ruang tidak cukup untuk tanda tangan, tambahkan halaman baru
    if (finalY + 35 > pageHeight) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY = finalY + 10;
    }

    const dateFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const signX = pageWidth - 65;
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Mengetahui, ${dateFormatted}`, signX, currentY);
    doc.text('Guru Mata Pelajaran', signX, currentY + 4.5);

    currentY += 22;
    doc.setFont('helvetica', 'bold');
    doc.text(metadata.namaGuru || '_______________________', signX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('NIP. ........................................', signX, currentY + 4);

    doc.save(`${fileName}.pdf`);
  }

  // ===========================================================================
  // 4. SPESIFIKASI EKSPOR REKAPITULASI PRESENSI
  // ===========================================================================
  public static exportPresensi(
    records: IPresensi[],
    format: ExportFormat,
    meta: Partial<IExportReportMetadata> = {}
  ) {
    const defaultMeta: IExportReportMetadata = {
      judul: 'Laporan Rekapitulasi Presensi Siswa',
      subjudul: 'Dokumentasi Kehadiran & Partisipasi Belajar Siswa',
      namaSekolah: meta.namaSekolah || 'SMK / SMA NEGERI',
      namaGuru: meta.namaGuru || 'Guru Pengampu',
      kelas: meta.kelas || 'Semua Kelas',
      mapel: meta.mapel || 'Semua Mapel',
      semester: meta.semester || 'Ganjil',
      tahunPelajaran: meta.tahunPelajaran || '2025/2026',
      filterInfo: meta.filterInfo
    };

    const headers = [
      { key: '_index', label: 'No' },
      { key: 'TANGGAL', label: 'Tanggal' },
      { key: 'NISN', label: 'NISN' },
      { key: 'NAMA_SISWA', label: 'Nama Siswa' },
      { key: 'KELAS', label: 'Kelas' },
      { key: 'MAPEL', label: 'Mata Pelajaran' },
      { key: 'PERTEMUAN', label: 'Pertemuan' },
      { key: 'STATUS', label: 'Status' },
      { key: 'CATATAN', label: 'Catatan / Keterangan' }
    ];

    const fileName = `Laporan_Presensi_${defaultMeta.kelas}_${new Date().toISOString().split('T')[0]}`.replace(/\s+/g, '_');

    // Hitung ringkasan
    const total = records.length;
    const hadir = records.filter((r) => r.STATUS === 'Hadir').length;
    const izin = records.filter((r) => r.STATUS === 'Izin').length;
    const sakit = records.filter((r) => r.STATUS === 'Sakit').length;
    const alpa = records.filter((r) => r.STATUS === 'Alpa').length;
    const persentaseHadir = total > 0 ? ((hadir / total) * 100).toFixed(1) : '0';

    const summaryStats = [
      { label: 'Total Rekam', value: total },
      { label: 'Hadir', value: `${hadir} (${persentaseHadir}%)` },
      { label: 'Izin', value: izin },
      { label: 'Sakit', value: sakit },
      { label: 'Alpa', value: alpa }
    ];

    // Transformasi data untuk format tanggal standar Indonesia
    const transformedRecords = records.map((r) => ({
      ...r,
      TANGGAL: formatIndoDate(r.TANGGAL)
    }));

    if (format === 'csv') {
      this.exportToCSV(headers, transformedRecords, fileName);
    } else if (format === 'excel') {
      this.exportToExcel(headers, transformedRecords, 'Presensi Siswa', fileName, defaultMeta);
    } else if (format === 'pdf') {
      this.exportToPDF(headers, transformedRecords, defaultMeta, fileName, 'landscape', summaryStats);
    }
  }

  // ===========================================================================
  // 5. SPESIFIKASI EKSPOR REKAPITULASI NILAI
  // ===========================================================================
  public static exportNilai(
    records: INilai[],
    format: ExportFormat,
    meta: Partial<IExportReportMetadata> = {},
    kkm: number = 75
  ) {
    const defaultMeta: IExportReportMetadata = {
      judul: 'Laporan Rekapitulasi Penilaian & Hasil Evaluasi',
      subjudul: 'Daftar Nilai Siswa dan Ketercapaian Kriteria Ketuntasan Minimal',
      namaSekolah: meta.namaSekolah || 'SMK / SMA NEGERI',
      namaGuru: meta.namaGuru || 'Guru Pengampu',
      kelas: meta.kelas || 'Semua Kelas',
      mapel: meta.mapel || 'Semua Mapel',
      semester: meta.semester || 'Ganjil',
      tahunPelajaran: meta.tahunPelajaran || '2025/2026',
      filterInfo: meta.filterInfo
    };

    // Transformasi data untuk menyertakan status kelulusan KKM & format tanggal
    const transformedRecords = records.map((r) => {
      const skor = Number(r.NILAI) || 0;
      return {
        ...r,
        TANGGAL: formatIndoDate(r.TANGGAL),
        STATUS_KKM: skor >= kkm ? 'Tuntas' : 'Remedial'
      };
    });

    const headers = [
      { key: '_index', label: 'No' },
      { key: 'TANGGAL', label: 'Tanggal' },
      { key: 'NISN', label: 'NISN' },
      { key: 'NAMA_SISWA', label: 'Nama Siswa' },
      { key: 'KELAS', label: 'Kelas' },
      { key: 'MAPEL', label: 'Mata Pelajaran' },
      { key: 'JENIS_PENILAIAN', label: 'Jenis Penilaian' },
      { key: 'NAMA_PENILAIAN', label: 'Materi / Tugas' },
      { key: 'NILAI', label: 'Nilai' },
      { key: 'STATUS_KKM', label: 'Status KKM' },
      { key: 'CATATAN', label: 'Catatan Evaluasi' }
    ];

    const fileName = `Laporan_Nilai_${defaultMeta.kelas}_${new Date().toISOString().split('T')[0]}`.replace(/\s+/g, '_');

    // Statistik nilai
    const total = records.length;
    const scores = records.map((r) => Number(r.NILAI)).filter((n) => !isNaN(n));
    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
    const max = scores.length > 0 ? Math.max(...scores) : 0;
    const min = scores.length > 0 ? Math.min(...scores) : 0;
    const tuntas = scores.filter((s) => s >= kkm).length;
    const persentaseTuntas = scores.length > 0 ? ((tuntas / scores.length) * 100).toFixed(1) : '0';

    const summaryStats = [
      { label: 'Total Siswa Dinilai', value: total },
      { label: 'Rata-Rata Nilai', value: avg },
      { label: 'Nilai Tertinggi', value: max },
      { label: 'Nilai Terendah', value: min },
      { label: 'Tuntas KKM', value: `${tuntas} (${persentaseTuntas}%)` }
    ];

    if (format === 'csv') {
      this.exportToCSV(headers, transformedRecords, fileName);
    } else if (format === 'excel') {
      this.exportToExcel(headers, transformedRecords, 'Rekap Nilai Siswa', fileName, defaultMeta);
    } else if (format === 'pdf') {
      this.exportToPDF(headers, transformedRecords, defaultMeta, fileName, 'landscape', summaryStats);
    }
  }

  // ===========================================================================
  // 6. SPESIFIKASI EKSPOR JURNAL MENGAJAR
  // ===========================================================================
  public static exportJurnal(
    records: IJurnal[],
    format: ExportFormat,
    meta: Partial<IExportReportMetadata> = {}
  ) {
    const defaultMeta: IExportReportMetadata = {
      judul: 'Laporan Jurnal Mengajar & Agenda KBM Harian',
      subjudul: 'Dokumentasi Realisasi Aktivitas Pembelajaran di Kelas',
      namaSekolah: meta.namaSekolah || 'SMK / SMA NEGERI',
      namaGuru: meta.namaGuru || 'Guru Pengampu',
      kelas: meta.kelas || 'Semua Kelas',
      mapel: meta.mapel || 'Semua Mapel',
      semester: meta.semester || 'Ganjil',
      tahunPelajaran: meta.tahunPelajaran || '2025/2026',
      filterInfo: meta.filterInfo
    };

    const headers = [
      { key: '_index', label: 'No' },
      { key: 'TANGGAL', label: 'Tanggal' },
      { key: 'JAM_KE', label: 'Jam Ke' },
      { key: 'KELAS', label: 'Kelas' },
      { key: 'MAPEL', label: 'Mata Pelajaran' },
      { key: 'MATERI', label: 'Materi / Capaian Pembelajaran' },
      { key: 'KEGIATAN', label: 'Kegiatan Pembelajaran' },
      { key: 'STATUS', label: 'Status KBM' },
      { key: 'CATATAN', label: 'Hambatan / Refleksi' }
    ];

    const fileName = `Laporan_Jurnal_${defaultMeta.kelas}_${new Date().toISOString().split('T')[0]}`.replace(/\s+/g, '_');

    // Transformasi data untuk format tanggal standar Indonesia
    const transformedRecords = records.map((r) => ({
      ...r,
      TANGGAL: formatIndoDate(r.TANGGAL)
    }));

    const total = records.length;
    const terlaksana = records.filter((r) => (r.STATUS || '').toLowerCase().includes('terlaksana') && !(r.STATUS || '').toLowerCase().includes('tidak')).length;
    const rate = total > 0 ? ((terlaksana / total) * 100).toFixed(1) : '0';

    const summaryStats = [
      { label: 'Total Pertemuan', value: total },
      { label: 'Terlaksana Penuh', value: `${terlaksana} (${rate}%)` }
    ];

    if (format === 'csv') {
      this.exportToCSV(headers, transformedRecords, fileName);
    } else if (format === 'excel') {
      this.exportToExcel(headers, transformedRecords, 'Jurnal Mengajar', fileName, defaultMeta);
    } else if (format === 'pdf') {
      this.exportToPDF(headers, transformedRecords, defaultMeta, fileName, 'landscape', summaryStats);
    }
  }
}
