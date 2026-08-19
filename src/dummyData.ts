import { IGuru, ISiswa, IKelas, IMapel, IPresensi, INilai, IJurnal } from './types.ts';

export const DUMMY_GURU: IGuru[] = [
  {
    ID_GURU: 'G001',
    NAMA_GURU: 'Budi Santoso, S.Pd.',
    USERNAME: 'budi',
    PASSWORD: 'password123', // Demo dummy credential
    MAPEL: 'Matematika'
  },
  {
    ID_GURU: 'G002',
    NAMA_GURU: 'Siti Aminah, M.Pd.',
    USERNAME: 'siti',
    PASSWORD: 'password123',
    MAPEL: 'Bahasa Indonesia'
  },
  {
    ID_GURU: 'G003',
    NAMA_GURU: 'Ahmad Fauzi, S.Kom.',
    USERNAME: 'ahmad',
    PASSWORD: 'password123',
    MAPEL: 'Informatika'
  }
];

export const DUMMY_KELAS: IKelas[] = [
  { ID_KELAS: 'K01', NAMA_KELAS: 'X TKJ 1', WALI_KELAS: 'Ahmad Fauzi, S.Kom.' },
  { ID_KELAS: 'K02', NAMA_KELAS: 'X TKJ 2', WALI_KELAS: 'Siti Aminah, M.Pd.' },
  { ID_KELAS: 'K03', NAMA_KELAS: 'XI RPL 1', WALI_KELAS: 'Budi Santoso, S.Pd.' },
  { ID_KELAS: 'K04', NAMA_KELAS: 'XII MM 1', WALI_KELAS: 'Budi Santoso, S.Pd.' }
];

export const DUMMY_MAPEL: IMapel[] = [
  { ID_MAPEL: 'M01', NAMA_MATA_PELAJARAN: 'Matematika' },
  { ID_MAPEL: 'M02', NAMA_MATA_PELAJARAN: 'Bahasa Indonesia' },
  { ID_MAPEL: 'M03', NAMA_MATA_PELAJARAN: 'Informatika' },
  { ID_MAPEL: 'M04', NAMA_MATA_PELAJARAN: 'Pemrograman Web' },
  { ID_MAPEL: 'M05', NAMA_MATA_PELAJARAN: 'Basis Data' }
];

export const DUMMY_SISWA: ISiswa[] = [
  { NISN: '0081234501', NAMA: 'Aditya Pratama', KELAS: 'X TKJ 1', JENIS_KELAMIN: 'L' },
  { NISN: '0081234502', NAMA: 'Anisa Rahmawati', KELAS: 'X TKJ 1', JENIS_KELAMIN: 'P' },
  { NISN: '0081234503', NAMA: 'Bagus Setiawan', KELAS: 'X TKJ 1', JENIS_KELAMIN: 'L' },
  { NISN: '0081234504', NAMA: 'Citra Dewi', KELAS: 'X TKJ 1', JENIS_KELAMIN: 'P' },
  { NISN: '0081234505', NAMA: 'Dimas Anggara', KELAS: 'X TKJ 1', JENIS_KELAMIN: 'L' },
  { NISN: '0081234506', NAMA: 'Eka Lestari', KELAS: 'X TKJ 2', JENIS_KELAMIN: 'P' },
  { NISN: '0081234507', NAMA: 'Fajar Nugraha', KELAS: 'X TKJ 2', JENIS_KELAMIN: 'L' },
  { NISN: '0081234508', NAMA: 'Gilang Ramadhan', KELAS: 'XI RPL 1', JENIS_KELAMIN: 'L' },
  { NISN: '0081234509', NAMA: 'Hana Fitria', KELAS: 'XI RPL 1', JENIS_KELAMIN: 'P' },
  { NISN: '0081234510', NAMA: 'Indra Gunawan', KELAS: 'XII MM 1', JENIS_KELAMIN: 'L' }
];

export const DUMMY_PRESENSI: IPresensi[] = [
  {
    TIMESTAMP: new Date().toISOString(),
    TANGGAL: '2026-08-14',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    PERTEMUAN: 1,
    NAMA_SISWA: 'Aditya Pratama',
    STATUS: 'Hadir',
    CATATAN: ''
  },
  {
    TIMESTAMP: new Date().toISOString(),
    TANGGAL: '2026-08-14',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    PERTEMUAN: 1,
    NAMA_SISWA: 'Anisa Rahmawati',
    STATUS: 'Hadir',
    CATATAN: ''
  },
  {
    TIMESTAMP: new Date().toISOString(),
    TANGGAL: '2026-08-14',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    PERTEMUAN: 1,
    NAMA_SISWA: 'Bagus Setiawan',
    STATUS: 'Sakit',
    CATATAN: 'Surat dokter terlampir'
  },
  {
    TIMESTAMP: new Date().toISOString(),
    TANGGAL: '2026-08-14',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    PERTEMUAN: 1,
    NAMA_SISWA: 'Citra Dewi',
    STATUS: 'Izin',
    CATATAN: 'Acara keluarga'
  },
  {
    TIMESTAMP: new Date().toISOString(),
    TANGGAL: '2026-08-14',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    PERTEMUAN: 1,
    NAMA_SISWA: 'Dimas Anggara',
    STATUS: 'Hadir',
    CATATAN: ''
  }
];

export const DUMMY_NILAI: INilai[] = [
  {
    _rowIndex: 2,
    TIMESTAMP: '2026-08-10T08:00:00.000Z',
    TANGGAL: '2026-08-10',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    JENIS_PENILAIAN: 'Tugas',
    NAMA_PENILAIAN: 'Tugas 1 - SPLDV',
    NAMA_SISWA: 'Aditya Pratama',
    NILAI: 88,
    TAHUN_PELAJARAN: '2026/2027',
    SEMESTER: 'Ganjil',
    CATATAN: 'Tuntas dengan pemahaman baik'
  },
  {
    _rowIndex: 3,
    TIMESTAMP: '2026-08-10T08:00:00.000Z',
    TANGGAL: '2026-08-10',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    JENIS_PENILAIAN: 'Tugas',
    NAMA_PENILAIAN: 'Tugas 1 - SPLDV',
    NAMA_SISWA: 'Anisa Rahmawati',
    NILAI: 95,
    TAHUN_PELAJARAN: '2026/2027',
    SEMESTER: 'Ganjil',
    CATATAN: 'Sangat rapi dan tepat'
  },
  {
    _rowIndex: 4,
    TIMESTAMP: '2026-08-10T08:00:00.000Z',
    TANGGAL: '2026-08-10',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    JENIS_PENILAIAN: 'Tugas',
    NAMA_PENILAIAN: 'Tugas 1 - SPLDV',
    NAMA_SISWA: 'Bagus Setiawan',
    NILAI: 78,
    TAHUN_PELAJARAN: '2026/2027',
    SEMESTER: 'Ganjil',
    CATATAN: 'Memenuhi KKM'
  },
  {
    _rowIndex: 5,
    TIMESTAMP: '2026-08-10T08:00:00.000Z',
    TANGGAL: '2026-08-10',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    JENIS_PENILAIAN: 'Tugas',
    NAMA_PENILAIAN: 'Tugas 1 - SPLDV',
    NAMA_SISWA: 'Citra Dewi',
    NILAI: 85,
    TAHUN_PELAJARAN: '2026/2027',
    SEMESTER: 'Ganjil',
    CATATAN: 'Penyelesaian sistematis'
  },
  {
    _rowIndex: 6,
    TIMESTAMP: '2026-08-10T08:00:00.000Z',
    TANGGAL: '2026-08-10',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    JENIS_PENILAIAN: 'Tugas',
    NAMA_PENILAIAN: 'Tugas 1 - SPLDV',
    NAMA_SISWA: 'Dimas Anggara',
    NILAI: 80,
    TAHUN_PELAJARAN: '2026/2027',
    SEMESTER: 'Ganjil',
    CATATAN: 'Tuntas'
  },
  {
    _rowIndex: 7,
    TIMESTAMP: '2026-08-12T09:30:00.000Z',
    TANGGAL: '2026-08-12',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    JENIS_PENILAIAN: 'UH',
    NAMA_PENILAIAN: 'UH 1 - Aljabar Linear',
    NAMA_SISWA: 'Aditya Pratama',
    NILAI: 92,
    TAHUN_PELAJARAN: '2026/2027',
    SEMESTER: 'Ganjil',
    CATATAN: 'Nilai sangat memuaskan'
  },
  {
    _rowIndex: 8,
    TIMESTAMP: '2026-08-12T09:30:00.000Z',
    TANGGAL: '2026-08-12',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    JENIS_PENILAIAN: 'UH',
    NAMA_PENILAIAN: 'UH 1 - Aljabar Linear',
    NAMA_SISWA: 'Anisa Rahmawati',
    NILAI: 98,
    TAHUN_PELAJARAN: '2026/2027',
    SEMESTER: 'Ganjil',
    CATATAN: 'Nilai tertinggi di kelas'
  },
  {
    _rowIndex: 9,
    TIMESTAMP: '2026-08-12T09:30:00.000Z',
    TANGGAL: '2026-08-12',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    JENIS_PENILAIAN: 'UH',
    NAMA_PENILAIAN: 'UH 1 - Aljabar Linear',
    NAMA_SISWA: 'Bagus Setiawan',
    NILAI: 72,
    TAHUN_PELAJARAN: '2026/2027',
    SEMESTER: 'Ganjil',
    CATATAN: 'Perlu pengayaan nomor 4 dan 5'
  },
  {
    _rowIndex: 10,
    TIMESTAMP: '2026-08-12T09:30:00.000Z',
    TANGGAL: '2026-08-12',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    JENIS_PENILAIAN: 'Praktik',
    NAMA_PENILAIAN: 'Praktik 1 - Geogebra Grafik',
    NAMA_SISWA: 'Citra Dewi',
    NILAI: 90,
    TAHUN_PELAJARAN: '2026/2027',
    SEMESTER: 'Ganjil',
    CATATAN: 'Kreatif dalam visualisasi grafik'
  },
  {
    _rowIndex: 11,
    TIMESTAMP: '2026-08-12T09:30:00.000Z',
    TANGGAL: '2026-08-12',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    JENIS_PENILAIAN: 'Project',
    NAMA_PENILAIAN: 'Project 1 - Model Optimasi Produksi',
    NAMA_SISWA: 'Dimas Anggara',
    NILAI: 86,
    TAHUN_PELAJARAN: '2026/2027',
    SEMESTER: 'Ganjil',
    CATATAN: 'Laporan studi kasus lengkap'
  }
];

export const DUMMY_JURNAL: IJurnal[] = [
  {
    _rowIndex: 2,
    TIMESTAMP: '2026-08-14T07:30:00.000Z',
    TANGGAL: '2026-08-14',
    JAM: '07:30 - 09:00 (Jam ke 1-2)',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 1',
    MATERI: 'Sistem Persamaan Linear Dua Variabel (SPLDV)',
    TUJUAN_PEMBELAJARAN: 'Siswa dapat menentukan himpunan penyelesaian metode eliminasi dan substitusi pada SPLDV.',
    AKTIVITAS: 'Pembagian kelompok diskusi 4-5 siswa, pengerjaan LKPD kontekstual belanja barang, dan presentasi hasil kelompok.',
    METODE: 'Problem Based Learning (PBL)',
    MEDIA: 'LCD Proyektor, LKPD Digital, Geogebra Math App',
    REFLEKSI: 'Siswa sangat aktif saat pemodelan aljabar, namun beberapa siswa butuh penguatan teknik eliminasi tanda negatif.',
    CATATAN: 'Seluruh siswa hadir tepat waktu. Tugas mandiri dikumpulkan melalui Google Classroom.',
    STATUS: 'Terlaksana'
  },
  {
    _rowIndex: 3,
    TIMESTAMP: '2026-08-13T09:15:00.000Z',
    TANGGAL: '2026-08-13',
    JAM: '09:15 - 10:45 (Jam ke 3-4)',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'X TKJ 2',
    MATERI: 'Barisan dan Deret Aritmatika',
    TUJUAN_PEMBELAJARAN: 'Siswa mampu merumuskan suku ke-n dan jumlah n suku pertama barisan aritmatika.',
    AKTIVITAS: 'Eksplorasi pola bilangan dengan kartu angka, perumusan rumus umum, dan latihan soal bertingkat.',
    METODE: 'Discovery Learning & Diskusi Kelompok',
    MEDIA: 'Papan Tulis Interaktif, Kartu Angka, Modul Ajar',
    REFLEKSI: 'Konsep suku ke-n dikuasai 85% siswa. Perhitungan deret $S_n$ baru terselesaikan separuh karena waktu terpotong upacara.',
    CATATAN: 'Materi $S_n$ akan dilanjutkan dan diperdalam pada pertemuan pekan depan.',
    STATUS: 'Sebagian'
  },
  {
    _rowIndex: 4,
    TIMESTAMP: '2026-08-12T10:45:00.000Z',
    TANGGAL: '2026-08-12',
    JAM: '10:45 - 12:15 (Jam ke 5-6)',
    GURU: 'Siti Rahmawati, M.Pd.',
    MAPEL: 'Bahasa Indonesia',
    KELAS: 'XI RPL 1',
    MATERI: 'Teks Laporan Hasil Observasi (LHO)',
    TUJUAN_PEMBELAJARAN: 'Siswa mampu menganalisis struktur dan kaidah kebahasaan teks laporan hasil observasi.',
    AKTIVITAS: 'Membaca artikel observasi lingkungan sekolah, identifikasi kalimat definisi dan deskripsi dalam kelompok.',
    METODE: 'Kooperatif Tipe Jigsaw',
    MEDIA: 'Artikel LHO Cetak, Google Docs, Smart TV',
    REFLEKSI: 'Siswa mampu membedakan kalimat fakta dan opini dengan tepat.',
    CATATAN: 'Satu kelompok presentasi dengan sangat percaya diri.',
    STATUS: 'Terlaksana'
  },
  {
    _rowIndex: 5,
    TIMESTAMP: '2026-08-11T13:00:00.000Z',
    TANGGAL: '2026-08-11',
    JAM: '13:00 - 14:30 (Jam ke 7-8)',
    GURU: 'Budi Santoso, S.Pd.',
    MAPEL: 'Matematika',
    KELAS: 'XII TKJ 1',
    MATERI: 'Statistika - Ukuran Pemusatan Data Berkelompok (Mean & Median)',
    TUJUAN_PEMBELAJARAN: 'Siswa dapat menghitung nilai rata-rata hitung dan median dari tabel distribusi frekuensi data berkelompok.',
    AKTIVITAS: 'Pengenalan rumus titik tengah dan tepi bawah kelas data.',
    METODE: 'Direct Instruction & Praktik Mandiri',
    MEDIA: 'Kalkulator Ilmiah, Slide PPT Canva, LKPD Statistika',
    REFLEKSI: 'KBM ditiadakan karena ruangan lab komputer digunakan untuk kegiatan gladi bersih Asesmen Nasional (ANBK).',
    CATATAN: 'Diberikan penugasan mandiri terstruktur dan video pembelajaran pengganti melalui LMS sekolah.',
    STATUS: 'Tidak terlaksana'
  }
];
