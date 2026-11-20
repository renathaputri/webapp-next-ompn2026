import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const levels = await prisma.level.findMany();
  const sdLevel = levels.find((l) => l.code === "SD");
  const smpLevel = levels.find((l) => l.code === "SMP");
  const smaLevel = levels.find((l) => l.code === "SMA");

  if (!sdLevel || !smpLevel || !smaLevel) {
    throw new Error("Jenjang SD/SMP/SMA tidak ditemukan di database!");
  }

  // Cari ujian SD yang ada
  const sdExam = await prisma.exam.findFirst({
    where: { levelId: sdLevel.id },
  });

  const rawPassword = "SiswaOMPN2026!";
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const students = [
    // SD
    {
      name: "Budi Santoso",
      email: "budi.sd@ompn2026.id",
      whatsapp: "6281200000101",
      school: "SDN Menteng 01 Jakarta",
      schoolNormalized: "sdn menteng 01 jakarta",
      city: "Jakarta Pusat",
      levelId: sdLevel.id,
      participantCode: "OMPN26-0002",
    },
    {
      name: "Siti Rahma",
      email: "siti.sd@ompn2026.id",
      whatsapp: "6281200000102",
      school: "SD Al-Azhar Surabaya",
      schoolNormalized: "sd al-azhar surabaya",
      city: "Surabaya",
      levelId: sdLevel.id,
      participantCode: "OMPN26-0003",
    },
    {
      name: "Dimas Pratama",
      email: "dimas.sd@ompn2026.id",
      whatsapp: "6281200000103",
      school: "SDN 1 Sukajadi Bandung",
      schoolNormalized: "sdn 1 sukajadi bandung",
      city: "Bandung",
      levelId: sdLevel.id,
      participantCode: "OMPN26-0004",
    },
    // SMP
    {
      name: "Reza Mahendra",
      email: "reza.smp@ompn2026.id",
      whatsapp: "6281200000201",
      school: "SMPN 1 Semarang",
      schoolNormalized: "smpn 1 semarang",
      city: "Semarang",
      levelId: smpLevel.id,
      participantCode: "OMPN26-0005",
    },
    {
      name: "Putri Lestari",
      email: "putri.smp@ompn2026.id",
      whatsapp: "6281200000202",
      school: "SMPN 5 Yogyakarta",
      schoolNormalized: "smpn 5 yogyakarta",
      city: "Yogyakarta",
      levelId: smpLevel.id,
      participantCode: "OMPN26-0006",
    },
    {
      name: "Fajar Nugraha",
      email: "fajar.smp@ompn2026.id",
      whatsapp: "6281200000203",
      school: "SMP Islam Al-Irsyad Solo",
      schoolNormalized: "smp islam al-irsyad solo",
      city: "Surakarta",
      levelId: smpLevel.id,
      participantCode: "OMPN26-0007",
    },
    // SMA
    {
      name: "Arya Kusuma",
      email: "arya.sma@ompn2026.id",
      whatsapp: "6281200000301",
      school: "SMAN 3 Malang",
      schoolNormalized: "sman 3 malang",
      city: "Malang",
      levelId: smaLevel.id,
      participantCode: "OMPN26-0008",
    },
    {
      name: "Nabila Putri",
      email: "nabila.sma@ompn2026.id",
      whatsapp: "6281200000302",
      school: "SMAN 8 Jakarta",
      schoolNormalized: "sman 8 jakarta",
      city: "Jakarta Selatan",
      levelId: smaLevel.id,
      participantCode: "OMPN26-0009",
    },
    {
      name: "Bagus Saputra",
      email: "bagus.sma@ompn2026.id",
      whatsapp: "6281200000303",
      school: "SMAN 1 Denpasar",
      schoolNormalized: "sman 1 denpasar",
      city: "Denpasar",
      levelId: smaLevel.id,
      participantCode: "OMPN26-0010",
    },
  ];

  console.log("Memulai seeding 9 akun siswa...");

  for (const s of students) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        whatsapp: s.whatsapp,
        school: s.school,
        schoolNormalized: s.schoolNormalized,
        city: s.city,
        levelId: s.levelId,
        participantCode: s.participantCode,
        passwordHash,
        mustChangePassword: false,
        isActive: true,
      },
      create: {
        name: s.name,
        email: s.email,
        whatsapp: s.whatsapp,
        school: s.school,
        schoolNormalized: s.schoolNormalized,
        city: s.city,
        levelId: s.levelId,
        participantCode: s.participantCode,
        passwordHash,
        role: Role.PARTICIPANT,
        mustChangePassword: false,
        isActive: true,
        consentAt: new Date(),
      },
    });

    // Daftarkan siswa SD ke ujian SD jika ada
    if (s.levelId === sdLevel.id && sdExam) {
      await prisma.registration.upsert({
        where: {
          userId_examId: { userId: user.id, examId: sdExam.id },
        },
        update: {},
        create: {
          userId: user.id,
          examId: sdExam.id,
        },
      });
    }

    console.log(`✓ ${s.name} (${s.email}) - Kode: ${s.participantCode}`);
  }

  console.log("Selesai membuat 9 akun siswa.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
