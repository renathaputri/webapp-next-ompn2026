"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateExamForSchedule } from "@/lib/exam-validation";
import { syncAllExamsState } from "@/lib/exam-state";
import { finalizeExpiredAttempts } from "@/lib/finalize-attempts";
import { gradeAttempt } from "@/lib/scoring";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ExamStatus } from "@prisma/client";

export async function createExam(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const levelId = formData.get("levelId") as string;
  const subjectId = formData.get("subjectId") as string;
  const title = (formData.get("title") as string)?.trim();
  const durationMinutes = parseInt(formData.get("durationMinutes") as string, 10);
  const questionCount = parseInt(formData.get("questionCount") as string, 10);
  const optionCount = parseInt(formData.get("optionCount") as string, 10);
  const startAtRaw = formData.get("startAt") as string;
  const endAtRaw = formData.get("endAt") as string;
  const shuffleQuestions = formData.get("shuffleQuestions") === "on";

  if (!levelId || !subjectId || !title || isNaN(durationMinutes) || isNaN(questionCount) || isNaN(optionCount)) {
    return { error: "Semua parameter dasar ujian wajib diisi dengan benar." };
  }

  if (optionCount < 2 || optionCount > 5) {
    return { error: "Jumlah pilihan jawaban harus antara 2 hingga 5." };
  }

  // Cek duplikasi jenjang + mapel
  const existing = await prisma.exam.findUnique({
    where: {
      levelId_subjectId: { levelId, subjectId },
    },
  });

  if (existing) {
    return { error: "Ujian untuk kombinasi jenjang dan mata pelajaran ini sudah ada." };
  }

  const startAt = startAtRaw ? new Date(startAtRaw) : null;
  const endAt = endAtRaw ? new Date(endAtRaw) : null;

  if (startAt && endAt && endAt <= startAt) {
    return { error: "Jadwal selesai harus lebih besar dari jadwal mulai." };
  }

  const exam = await prisma.exam.create({
    data: {
      levelId,
      subjectId,
      title,
      durationMinutes,
      questionCount,
      optionCount,
      startAt,
      endAt,
      shuffleQuestions,
      status: "DRAFT",
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "EXAM_CREATE",
      entity: "Exam",
      entityId: exam.id,
      meta: { title, levelId, subjectId },
    },
  });

  revalidatePath("/admin/exams");
  return { success: true, examId: exam.id };
}

export async function updateExam(examId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const currentExam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      _count: {
        select: { questions: true, registrations: true },
      },
    },
  });

  if (!currentExam) {
    return { error: "Ujian tidak ditemukan." };
  }

  // Cek apakah sudah ada peserta yang mulai ujian
  const hasStartedAttempt = await prisma.attempt.count({
    where: {
      registration: { examId },
    },
  });

  const title = (formData.get("title") as string)?.trim();
  const durationMinutes = parseInt(formData.get("durationMinutes") as string, 10);
  const questionCount = parseInt(formData.get("questionCount") as string, 10);
  const optionCount = parseInt(formData.get("optionCount") as string, 10);
  const startAtRaw = formData.get("startAt") as string;
  const endAtRaw = formData.get("endAt") as string;
  const shuffleQuestions = formData.get("shuffleQuestions") === "on";

  // Aturan PRD Bab 4 & 7.C:
  // optionCount dan questionCount hanya bisa diubah selama ujian belum punya soal
  let finalOptionCount = currentExam.optionCount;
  let finalQuestionCount = currentExam.questionCount;

  if (currentExam._count.questions > 0) {
    if (optionCount !== currentExam.optionCount || questionCount !== currentExam.questionCount) {
      return {
        error: "Jumlah soal dan jumlah pilihan tidak dapat diubah karena bank soal sudah berisi pertanyaan. Hapus soal terlebih dahulu untuk mengubah struktur ini.",
      };
    }
  } else {
    finalOptionCount = optionCount;
    finalQuestionCount = questionCount;
  }

  // Acak soal tidak bisa diubah setelah ada peserta yang mulai
  let finalShuffle = currentExam.shuffleQuestions;
  if (hasStartedAttempt > 0) {
    if (shuffleQuestions !== currentExam.shuffleQuestions) {
      return {
        error: "Pengaturan acak soal tidak dapat diubah karena sudah ada peserta yang memulai sesi ujian.",
      };
    }
  } else {
    finalShuffle = shuffleQuestions;
  }

  const startAt = startAtRaw ? new Date(startAtRaw) : null;
  const endAt = endAtRaw ? new Date(endAtRaw) : null;

  if (startAt && endAt && endAt <= startAt) {
    return { error: "Jadwal selesai harus lebih besar dari jadwal mulai." };
  }

  await prisma.exam.update({
    where: { id: examId },
    data: {
      title,
      durationMinutes,
      questionCount: finalQuestionCount,
      optionCount: finalOptionCount,
      startAt,
      endAt,
      shuffleQuestions: finalShuffle,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "EXAM_UPDATE",
      entity: "Exam",
      entityId: examId,
      meta: { title, durationMinutes },
    },
  });

  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${examId}`);
  return { success: true };
}

export async function changeExamStatus(examId: string, newStatus: ExamStatus) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  // Jika ingin mengubah ke SCHEDULED, lakukan validasi kelayakan ujian (Bab 6.7)
  if (newStatus === "SCHEDULED") {
    const validation = await validateExamForSchedule(examId);
    if (!validation.isValid) {
      return {
        success: false,
        error: "Ujian belum memenuhi syarat untuk dijadwalkan:",
        validationErrors: validation.errors,
      };
    }
  }

  await prisma.exam.update({
    where: { id: examId },
    data: { status: newStatus },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "EXAM_STATUS_CHANGE",
      entity: "Exam",
      entityId: examId,
      meta: { newStatus },
    },
  });

  revalidatePath("/admin/exams");
  revalidatePath("/");
  return { success: true };
}

export async function triggerSyncExams() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const closedCount = await syncAllExamsState(session.user.id);
  revalidatePath("/admin/exams");
  return { success: true, closedCount };
}

export async function triggerFinalizeExpiredAttempts(examId?: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const finalizedCount = await finalizeExpiredAttempts(examId);

  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "EXAM_FINALIZE_TIMEOUTS",
      entity: "Attempt",
      entityId: examId ?? null,
      meta: { finalizedCount, examId },
    },
  });

  revalidatePath("/admin/exams");
  revalidatePath("/admin/results");
  return { success: true, finalizedCount };
}

export async function toggleResultsPublished(examId: string, resultsPublished: boolean) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  await prisma.exam.update({
    where: { id: examId },
    data: { resultsPublished },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: resultsPublished ? "RESULTS_PUBLISH" : "RESULTS_UNPUBLISH",
      entity: "Exam",
      entityId: examId,
      meta: { resultsPublished },
    },
  });

  revalidatePath("/admin/exams");
  revalidatePath("/admin/results");
  revalidatePath("/admin/ranking");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleDiscussionOpen(examId: string, discussionOpen: boolean) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  // Bab 7.F & Bab 8: Pembahasan HANYA bisa dibuka jika exam.status == CLOSED dan now > exam.endAt
  if (discussionOpen) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { status: true, endAt: true },
    });

    if (!exam) {
      return { error: "Ujian tidak ditemukan." };
    }

    const now = new Date();
    if (exam.status !== "CLOSED" || !exam.endAt || now <= new Date(exam.endAt)) {
      return {
        error: "Pembahasan hanya dapat dibuka jika status ujian SUDAH CLOSED dan jadwal selesai (endAt) telah lewat.",
      };
    }
  }

  await prisma.exam.update({
    where: { id: examId },
    data: { discussionOpen },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: discussionOpen ? "DISCUSSION_OPEN" : "DISCUSSION_CLOSE",
      entity: "Exam",
      entityId: examId,
      meta: { discussionOpen },
    },
  });

  revalidatePath("/admin/exams");
  revalidatePath("/admin/review");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function recalculateExamScores(examId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        select: {
          id: true,
          correctIndex: true,
        },
      },
    },
  });

  if (!exam) {
    return { error: "Ujian tidak ditemukan." };
  }

  const attempts = await prisma.attempt.findMany({
    where: {
      registration: {
        examId,
      },
      status: "SUBMITTED",
    },
    include: {
      answers: {
        select: {
          questionId: true,
          selectedIndex: true,
        },
      },
    },
  });

  for (const attempt of attempts) {
    const grade = gradeAttempt(exam.questionCount, exam.questions, attempt.answers);
    await prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        correctCount: grade.correctCount,
        score: new Prisma.Decimal(grade.score),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "EXAM_RECALCULATE_SCORES",
      entity: "Exam",
      entityId: examId,
      meta: { attemptCount: attempts.length },
    },
  });

  revalidatePath("/admin/results");
  revalidatePath("/admin/ranking");
  revalidatePath("/dashboard");
  return { success: true, recalculatedCount: attempts.length };
}
