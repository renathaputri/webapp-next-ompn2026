import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gradeAttempt } from "@/lib/scoring";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const submitBodySchema = z
  .object({
    submitReason: z.enum(["MANUAL", "TIMEOUT"]).optional(),
  })
  .optional();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const { id: attemptId } = await params;

    let submitReason: "MANUAL" | "TIMEOUT" = "MANUAL";
    try {
      const rawBody = await req.json();
      const parsed = submitBodySchema.safeParse(rawBody);
      if (parsed.success && parsed.data?.submitReason) {
        submitReason = parsed.data.submitReason;
      }
    } catch {
      // Body kosong diperbolehkan, default ke MANUAL
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        registration: {
          include: {
            exam: {
              include: {
                questions: {
                  select: {
                    id: true,
                    correctIndex: true,
                  },
                },
              },
            },
          },
        },
        answers: {
          select: {
            questionId: true,
            selectedIndex: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Sesi ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Pastikan milik user yang sedang login
    if (attempt.registration.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 }
      );
    }

    // IDEMPOTENCY (Bab 6.5): Jika sudah SUBMITTED, kembalikan status berhasil tanpa error
    if (attempt.status === "SUBMITTED") {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        status: "SUBMITTED",
        message: "Jawaban ujian Anda telah tersimpan sebelumnya.",
      });
    }

    const now = new Date();
    // Jika waktu pengerjaan telah lewat toleransi atau alasan eksplisit TIMEOUT
    if (now > new Date(attempt.endsAt.getTime() + 5000) || submitReason === "TIMEOUT") {
      submitReason = "TIMEOUT";
    }

    const exam = attempt.registration.exam;
    const grade = gradeAttempt(exam.questionCount, exam.questions, attempt.answers);

    let submittedAt: Date;
    let durationSeconds: number;

    if (submitReason === "TIMEOUT") {
      // Bab 6.5: Untuk TIMEOUT = durasi penuh (endsAt - startedAt), submittedAt diisi endsAt
      submittedAt = attempt.endsAt;
      durationSeconds = Math.max(
        0,
        Math.round((attempt.endsAt.getTime() - attempt.startedAt.getTime()) / 1000)
      );
    } else {
      submittedAt = now < attempt.endsAt ? now : attempt.endsAt;
      durationSeconds = Math.max(
        0,
        Math.round((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
      );
    }

    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt,
        submitReason,
        correctCount: grade.correctCount,
        score: new Prisma.Decimal(grade.score),
        durationSeconds,
      },
    });

    // PENTING (Bab 6.5 & Bab 8): Nilai & detail jawaban TIDAK dibocorkan di sini
    return NextResponse.json({
      success: true,
      status: "SUBMITTED",
      message: "Jawaban ujian berhasil dikumpulkan.",
    });
  } catch (error) {
    console.error("Error submitting attempt:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server" },
      { status: 500 }
    );
  }
}
