"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeQuestionText, sanitizeTextOnly } from "@/lib/sanitizer";
import { revalidatePath } from "next/cache";

export async function saveQuestion(
  examId: string,
  number: number,
  rawText: string,
  rawOptions: string[],
  correctIndex: number,
  rawExplanation: string
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  });

  if (!exam) {
    return { error: "Ujian tidak ditemukan." };
  }

  if (rawOptions.length !== exam.optionCount) {
    return { error: `Jumlah opsi pilihan harus tepat ${exam.optionCount}.` };
  }

  if (correctIndex < 0 || correctIndex >= exam.optionCount) {
    return { error: "Kunci jawaban yang dipilih tidak valid." };
  }

  // Sanitasi di server sesuai aturan ketat PRD Bab 7.B & 12:
  // - Gambar hanya boleh ada di teks soal
  // - Pilihan dan pembahasan TIDAK BOLEH mengandung gambar (tag <img> dibuang)
  const text = sanitizeQuestionText(rawText);
  const options = rawOptions.map((opt) => sanitizeTextOnly(opt));
  const explanation = sanitizeTextOnly(rawExplanation);

  const question = await prisma.question.upsert({
    where: {
      examId_number: { examId, number },
    },
    update: {
      text,
      options,
      correctIndex,
      explanation,
    },
    create: {
      examId,
      number,
      text,
      options,
      correctIndex,
      explanation,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "QUESTION_UPDATE",
      entity: "Question",
      entityId: question.id,
      meta: { examId, number },
    },
  });

  revalidatePath(`/admin/exams/${examId}/questions`);
  return { success: true, questionId: question.id };
}

export async function deleteQuestion(examId: string, questionId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  await prisma.$transaction([
    prisma.question.delete({
      where: { id: questionId },
    }),
    prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "QUESTION_DELETE",
        entity: "Question",
        entityId: questionId,
        meta: { examId },
      },
    }),
  ]);

  revalidatePath(`/admin/exams/${examId}/questions`);
  return { success: true };
}

export interface CsvRowData {
  number: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export async function importQuestionsCsv(
  examId: string,
  rows: CsvRowData[],
  overwrite: boolean
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: { select: { number: true } } },
  });

  if (!exam) {
    return { error: "Ujian tidak ditemukan." };
  }

  const existingNumbers = new Set(exam.questions.map((q) => q.number));
  let importedCount = 0;
  let skippedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const exists = existingNumbers.has(row.number);

      if (exists && !overwrite) {
        skippedCount++;
        continue;
      }

      const text = sanitizeQuestionText(row.text);
      const options = row.options.map((opt) => sanitizeTextOnly(opt));
      const explanation = sanitizeTextOnly(row.explanation);

      await tx.question.upsert({
        where: {
          examId_number: { examId, number: row.number },
        },
        update: {
          text,
          options,
          correctIndex: row.correctIndex,
          explanation,
        },
        create: {
          examId,
          number: row.number,
          text,
          options,
          correctIndex: row.correctIndex,
          explanation,
        },
      });

      importedCount++;
    }

    await tx.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "QUESTIONS_IMPORT_CSV",
        entity: "Exam",
        entityId: examId,
        meta: { importedCount, skippedCount, overwrite },
      },
    });
  });

  revalidatePath(`/admin/exams/${examId}/questions`);
  return { success: true, importedCount, skippedCount };
}
