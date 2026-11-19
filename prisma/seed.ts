import { PrismaClient, Role, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai proses seeding database OMPN2026...");

  // 1. Seed Levels
  const levels = [
    { code: "SD", name: "SD / MI", sortOrder: 1 },
    { code: "SMP", name: "SMP / MTs", sortOrder: 2 },
    { code: "SMA", name: "SMA / MA / SMK", sortOrder: 3 },
  ];

  for (const level of levels) {
    await prisma.level.upsert({
      where: { code: level.code },
      update: { name: level.name, sortOrder: level.sortOrder },
      create: level,
    });
  }
  console.log("Jenjang pendidikan berhasil di-seed.");

  // 2. Seed Subjects
  const subjects = [
    "Matematika",
    "Ilmu Pengetahuan Alam (IPA)",
    "Ilmu Pengetahuan Sosial (IPS)",
    "Bahasa Inggris",
    "Fisika",
    "Biologi",
    "Kimia",
    "Informatika",
  ];

  for (const subjectName of subjects) {
    await prisma.subject.upsert({
      where: { name: subjectName },
      update: { isActive: true },
      create: { name: subjectName, isActive: true },
    });
  }
  console.log("Mata pelajaran awal berhasil di-seed.");

  // 3. Seed Settings
  await prisma.setting.upsert({
    where: { key: "registrationCloseAt" },
    update: {},
    create: {
      key: "registrationCloseAt",
      value: Prisma.JsonNull,
    },
  });

  await prisma.setting.upsert({
    where: { key: "publicRankingLimit" },
    update: {},
    create: {
      key: "publicRankingLimit",
      value: Prisma.JsonNull,
    },
  });
  console.log("Pengaturan awal berhasil di-seed.");

  // 4. Seed Content Pages (Markdown)
  const contentPages = [
    {
      key: "home_tagline",
      title: "Tagline Beranda",
      body: "Ajang Kompetisi Prestasi Sains dan Pengetahuan Tingkat Nasional untuk Generasi Unggul Indonesia.",
    },
    {
      key: "about",
      title: "Tentang OMPN 2026",
      body: `## Tentang OMPN 2026

Olimpiade Matematika & Pengetahuan Nasional (OMPN) 2026 adalah kompetisi akademik berskala nasional yang diselenggarakan secara daring untuk menguji kompetensi, penalaran analitis, dan daya saing siswa di seluruh penjuru Indonesia.

### Visi dan Misi
1. Mendorong budaya kompetisi yang jujur, objektif, dan berintegritas tinggi.
2. Membuka akses pemerataan kompetisi akademik berkualitas tanpa hambatan geografis.
3. Menumbuhkan kecintaan terhadap sains, matematika, dan pengetahuan analitis sejak dini.`,
    },
    {
      key: "rules",
      title: "Peraturan & Ketentuan",
      body: `## Peraturan dan Ketentuan OMPN 2026

Seluruh peserta wajib membaca, memahami, dan mematuhi tata tertib pelaksanaan kompetisi:

### Ketentuan Umum
1. Peserta terdaftar secara sah sesuai jenjang pendidikan yang diduduki saat ini.
2. Seluruh pengerjaan dilakukan mandiri tanpa bantuan pihak lain atau alat bantu terlarang.
3. Waktu pengerjaan ujian tercatat mutlak berdasarkan waktu server (UTC yang disajikan dalam WIB).
4. Tidak ada pengurangan nilai untuk jawaban salah atau kosong.
5. Peserta yang kehabisan waktu (TIMEOUT) dicatat durasi pengerjaan penuh sesuai batas waktu ujian.
6. Penentuan peringkat akhir berdasarkan:
   - Nilai akhir tertinggi
   - Durasi pengerjaan tercepat
   - Waktu pengumpulan paling awal`,
    },
    {
      key: "contact",
      title: "Kontak Panitia",
      body: `## Kontak Resmi Panitia OMPN 2026

Apabila memiliki kendala teknis atau permohonan reset kata sandi, silakan menghubungi narahubung resmi panitia:

- WhatsApp Resmi: +62 812-3456-7890 (Hanya pesan teks)
- Surat Elektronik: panitia@ompn2026.id
- Jam Layanan: Senin s.d. Minggu, pukul 08.00 - 17.00 WIB

Harap sertakan nama lengkap, alamat email terdaftar, dan kode peserta saat menyampaikan permohonan.`,
    },
    {
      key: "schedule",
      title: "Jadwal Pelaksanaan",
      body: `## Jadwal Pelaksanaan OMPN 2026

Informasi jadwal resmi pelaksanaan olimpiade akan diperbarui secara berkala oleh panitia melalui dashboard peserta dan pengumuman resmi. Pastikan Anda memeriksa jadwal secara berkala sebelum sesi ujian dimulai.`,
    },
    {
      key: "privacy",
      title: "Kebijakan Privasi",
      body: `## Kebijakan Privasi & Perlindungan Data Pribadi

OMPN 2026 berkomitmen melindungi data pribadi seluruh peserta:

### Data yang Dikumpulkan
- Identitas diri: Nama lengkap, alamat email, dan nomor WhatsApp.
- Informasi pendidikan: Nama asal sekolah dan kota/kabupaten.
- Data pengerjaan ujian: Rekam jejak jawaban, waktu mulai, dan waktu selesai pengerjaan.

### Pemanfaatan Data
Data pribadi digunakan semata-mata untuk verifikasi kepesertaan, komunikasi administratif, serta pemeringkatan hasil kompetisi. Panitia menjamin kerahasiaan data dan tidak akan membagikan data kepada pihak ketiga tanpa persetujuan sah.`,
    },
  ];

  for (const page of contentPages) {
    await prisma.contentPage.upsert({
      where: { key: page.key },
      update: { title: page.title, body: page.body },
      create: page,
    });
  }
  console.log("Halaman konten statis berhasil di-seed.");

  // 5. Seed Admin User
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@ompn2026.id";
  const rawAdminPassword = process.env.SEED_ADMIN_PASSWORD || "AdminOMPN2026!#";
  const passwordHash = await bcrypt.hash(rawAdminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.ADMIN,
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      name: "Administrator OMPN",
      email: adminEmail,
      whatsapp: "6280000000000",
      school: "Sekretariat OMPN",
      schoolNormalized: "sekretariat ompn",
      city: "Jakarta",
      passwordHash,
      role: Role.ADMIN,
      mustChangePassword: false,
      isActive: true,
      consentAt: new Date(),
    },
  });
  console.log(`Akun admin (${adminEmail}) berhasil di-seed.`);
  console.log("Proses seeding selesai.");
}

main()
  .catch((e) => {
    console.error("Gagal melakukan seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
