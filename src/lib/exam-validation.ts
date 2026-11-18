import { prisma } from "@/lib/prisma";

export interface ExamValidationResult {
  isValid: boolean;
  errors: string[];
}

export async function validateExamForSchedule(examId: string): Promise<ExamValidationResult> {
  const errors: string[] = [];

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        orderBy: { number: "asc" },
      },
    },
  });

  if (!exam) {
    return { isValid: false, errors: ["Ujian tidak ditemukan."] };
  }

  // 1. Validasi jadwal mulai dan selesai
  if (!exam.startAt || !exam.endAt) {
    errors.push("Jadwal mulai (startAt) dan jadwal selesai (endAt) wajib diisi sebelum menjadwalkan ujian.");
  } else if (new Date(exam.endAt) <= new Date(exam.startAt)) {
    errors.push("Jadwal selesai harus lebih besar dari jadwal mulai.");
  }

  // 2. Validasi parameter numerik
  if (!exam.durationMinutes || exam.durationMinutes <= 0) {
    errors.push("Durasi ujian harus lebih dari 0 menit.");
  }
  if (!exam.questionCount || exam.questionCount <= 0) {
    errors.push("Target jumlah butir soal harus lebih dari 0.");
  }
  if (!exam.optionCount || exam.optionCount < 2 || exam.optionCount > 5) {
    errors.push("Jumlah pilihan jawaban per soal harus antara 2 hingga 5.");
  }

  // 3. Validasi kesesuaian jumlah soal
  const currentCount = exam.questions.length;
  if (currentCount !== exam.questionCount) {
    errors.push(
      `Jumlah butir soal saat ini (${currentCount}) belum memenuhi target jumlah soal (${exam.questionCount}).`
    );
  }

  // 4. Validasi nomor soal urut lengkap 1..N
  const expectedNumbers = Array.from({ length: currentCount }, (_, i) => i + 1);
  const actualNumbers = exam.questions.map((q) => q.number);
  const isSequential =
    actualNumbers.length === expectedNumbers.length &&
    actualNumbers.every((num, idx) => num === expectedNumbers[idx]);

  if (!isSequential) {
    errors.push("Penomoran butir soal tidak berurutan lengkap dari 1 sampai " + currentCount + ".");
  }

  // 5. Validasi kelengkapan tiap butir soal
  for (const q of exam.questions) {
    const options = Array.isArray(q.options) ? (q.options as string[]) : [];

    if (options.length !== exam.optionCount) {
      errors.push(
        `Soal nomor ${q.number}: Jumlah pilihan (${options.length}) tidak sesuai dengan konfigurasi ujian (${exam.optionCount}).`
      );
    }

    const hasEmptyOption = options.some((opt) => !opt || opt.trim() === "");
    if (hasEmptyOption) {
      errors.push(`Soal nomor ${q.number}: Terdapat opsi pilihan jawaban yang masih kosong.`);
    }

    if (q.correctIndex < 0 || q.correctIndex >= exam.optionCount) {
      errors.push(`Soal nomor ${q.number}: Kunci jawaban tidak valid (harus antara pilihan A sampai pilihan terakhir).`);
    }

    if (!q.explanation || q.explanation.trim() === "") {
      errors.push(`Soal nomor ${q.number}: Pembahasan soal wajib diisi.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
