# OMPN 2026 – Platform Olimpiade Online Nasional

Platform resmi pelaksanaan Olimpiade Matematika dan Pengetahuan Nasional (OMPN) 2026 berbasis web modern, tangguh, dan aman.

Dibangun dengan arsitektur **Next.js 15 App Router**, **React 19**, **TypeScript strict**, **Prisma ORM**, **PostgreSQL**, **Tailwind CSS v4**, **Auth.js v5**, **Tiptap Rich-Text Editor**, **KaTeX Math**, dan **ExcelJS**.

---

## 1. Persyaratan Sistem

- **Node.js** v20.x atau lebih baru
- **pnpm** v9.x atau lebih baru
- **PostgreSQL** v14+ (Local, Supabase, Neon, atau Railway)

---

## 2. Instalasi & Setup Lokal

### A. Kloning Repositori & Pasang Dependensi
```bash
git clone <url-repo>
cd OMPN2026
pnpm install
```

### B. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Sesuaikan nilai variabel berikut pada file `.env`:
```env
# Database PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ompn2026?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/ompn2026?schema=public"

# NextAuth / Auth.js (Gunakan string acak minimal 32 karakter)
AUTH_SECRET="ompn2026_super_secret_jwt_auth_key_1234567890"
AUTH_URL="http://localhost:3000"

# Vercel Blob (Opsional untuk storage gambar soal di cloud)
BLOB_READ_WRITE_TOKEN=""

# Kredensial Akun Admin Pertama
SEED_ADMIN_EMAIL="admin@ompn2026.id"
SEED_ADMIN_PASSWORD="AdminOMPN2026!#"

# URL Aplikasi
APP_URL="http://localhost:3000"
```

### C. Migrasi Database & Seeding
Jalankan migrasi database dan pengisian data awal (jenjang, mata pelajaran, halaman konten statis, pengaturan, dan akun admin awal):
```bash
# Sinkronisasi skema ke database PostgreSQL
pnpm exec prisma db push

# Eksekusi seed data awal
pnpm db:seed
```

### D. Menjalankan Server Pengembangan
```bash
pnpm dev
```
Buka browser pada alamat [http://localhost:3000](http://localhost:3000).

---

## 3. Akun Bawaan & Akses Awal

- **Portal Admin:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
  - **Email:** `admin@ompn2026.id`
  - **Password:** `AdminOMPN2026!#`
  - *(Pada login pertama, sistem akan mewajibkan penggantian password baru)*
- **Portal Peserta:** [http://localhost:3000/login](http://localhost:3000/login)

---

## 4. Panduan Alur Operasional Panitia (Admin)

### Langkah 1: Pengaturan Pendaftaran & Pengumuman
- Buka menu **Konten & Pengaturan** (`/admin/content`).
- Tentukan batas waktu penutupan pendaftaran (`registrationCloseAt`).
- Tulis atau perbarui pengumuman resmi di tab **Pengumuman**.
- Kelola teks panduan, tata tertib, dan kebijakan privasi pada tab **Halaman Konten (Markdown)**.
- Kelola daftar mata pelajaran pada tab **Mata Pelajaran**.

### Langkah 2: Pembuatan Jadwal Ujian
- Buka menu **Kelola Ujian** (`/admin/exams`).
- Klik **Buat Ujian Baru**: pilih Jenjang, Mata Pelajaran, isi Judul, Durasi (menit), Jumlah Soal, Jumlah Pilihan (2–5), Jadwal Mulai & Selesai (WIB), serta opsi Pengacakan Urutan Soal.
- Ujian yang baru dibuat berstatus `DRAFT`.

### Langkah 3: Pengisian Bank Soal
- Masuk ke detail bank soal ujian (`/admin/exams/[id]/questions`).
- **Opsi A (Manual):** Tambah atau edit soal menggunakan editor Tiptap (teks tebal, miring, pangkat, tabel, gambar PNG/JPG/WEBP maks 2 MB, dan rumus LaTeX KaTeX `$formula$`).
- **Opsi B (Impor CSV Massal):** Unduh template CSV khusus ujian tersebut, isi soal beserta kunci jawaban, lalu unggah melalui dialog impor.
- Klik **Periksa Kesiapan Ujian** untuk memastikan tidak ada nomor soal yang terlewat, opsi pilihan kosong, atau kunci jawaban tidak valid.
- Jika sudah valid, ubah status ujian menjadi `SCHEDULED`.

### Langkah 4: Pelaksanaan Ujian Real-Time
- Sistem secara otomatis membuka tombol pengerjaan bagi peserta terdaftar saat jendela waktu `startAt` tiba.
- Pengerjaan peserta tersimpan secara otomatis (*autosave*) dengan toleransi *grace period* jaringan.
- Saat jadwal selesai (`endAt`) terlewati, status ujian otomatis disinkronkan menjadi `CLOSED` oleh sistem.
- Tombol **Sinkronkan Status Ujian** tersedia untuk memeriksa seluruh ujian secara serempak.

### Langkah 5: Finalisasi & Rekapitulasi Nilai
- Masuk ke menu **Nilai & Hasil** (`/admin/results`).
- Sebelum publikasi, periksa peringatan apakah terdapat peserta yang belum difinalisasi (karena keluar tab saat ujian berakhir). Klik **Finalisasi Attempt Kedaluwarsa** untuk menutup sesi dengan durasi penuh (*timeout*).
- Gunakan tombol **Hitung Ulang Nilai** jika terdapat revisi kunci jawaban pada soal.
- Ekspor laporan dalam berbagai format:
  - **Rekap Nilai (CSV & Excel):** Data nilai lengkap, durasi, status, dan peringkat.
  - **Matriks Jawaban (Format Lebar CSV & Excel):** Matriks pilihan jawaban peserta per nomor soal dengan baris pertama berupa kunci jawaban.
  - **Detail Jawaban (Format Panjang Excel):** Rincian baris per peserta per nomor soal untuk analisis butir soal.

### Langkah 6: Publikasi Peringkat & Pembahasan
- Buka menu **Peringkat** (`/admin/ranking`), atur batas kuota peringkat jika diperlukan, lalu aktifkan tombol **Publikasi Hasil**.
- Buka menu **Pembahasan** (`/admin/review`). Tombol buka pembahasan hanya dapat diaktifkan jika status ujian sudah `CLOSED` dan waktu pelaksanaan telah berakhir secara penuh (Bab 8 PRD).

---

## 5. Prosedur Backup & Restore Database

Sesuai regulasi keamanan data pada Bab 12 & 17 PRD, panitia disarankan melakukan backup manual:
1. Setelah masa pendaftaran resmi ditutup.
2. Sesaat sebelum sesi ujian pertama dimulai.
3. Segera setelah seluruh sesi ujian berakhir ditutup.

### Menjalankan Backup
```bash
pnpm db:backup
```
File cadangan berformat SQL akan otomatis disimpan pada folder `/backups/backup-<timestamp>.sql`.

### Melakukan Restore Database
Untuk mengembalikan data dari file cadangan ke database PostgreSQL:
```bash
psql "<DATABASE_URL>" < "backups/backup-<nama-file>.sql"
```

---

## 6. Perintah Script Utama

| Perintah | Deskripsi |
|---|---|
| `pnpm dev` | Menjalankan server development dengan Turbopack |
| `pnpm build` | Membangun bundle produksi Next.js App Router |
| `pnpm start` | Menjalankan server production |
| `pnpm lint` | Memeriksa kepatuhan kode dengan ESLint |
| `pnpm exec vitest run` | Menjalankan seluruh rangkaian unit test otomatis |
| `pnpm exec prisma db push` | Menyinkronkan struktur tabel ke PostgreSQL |
| `pnpm db:seed` | Mengisi data awal sistem |
| `pnpm db:backup` | Membuat salinan cadangan SQL database |

---

## 7. Lisensi

Hak Cipta (c) 2026 Panitia Olimpiade Matematika dan Pengetahuan Nasional (OMPN). Dilindungi undang-undang.
