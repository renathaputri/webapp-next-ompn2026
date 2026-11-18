import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const answerSchema = z.object({
  questionId: z.string().min(1, "Question ID wajib diisi"),
  selectedIndex: z.number().int().min(0).nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const { id: attemptId } = await params;
    const body = await req.json();
    const parseResult = answerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Data jawaban tidak valid", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { questionId, selectedIndex } = parseResult.data;

    // Ambil attempt bersama registrasi & exam
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        registration: {
          include: {
            exam: {
              select: {
                id: true,
                optionCount: true,
                status: true,
              },
            },
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

    // Pastikan attempt milik user yang sedang login
    if (attempt.registration.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 }
      );
    }

    // Tolak jika attempt sudah selesai (Bab 6.5)
    if (attempt.status === "SUBMITTED") {
      return NextResponse.json(
        { error: "Ujian telah selesai dikumpulkan" },
        { status: 409 }
      );
    }

    // Cek batas waktu (toleransi toleransi jaringan 5 detik sesuai Bab 6.5)
    const now = new Date();
    const deadlineWithGrace = new Date(attempt.endsAt.getTime() + 5000);
    if (now > deadlineWithGrace) {
      return NextResponse.json(
        { error: "Waktu pengerjaan ujian telah berakhir" },
        { status: 409 }
      );
    }

    const exam = attempt.registration.exam;

    // Validasi selectedIndex < optionCount
    if (selectedIndex !== null && selectedIndex >= exam.optionCount) {
      return NextResponse.json(
        { error: `Pilihan tidak valid. Maksimal pilihan indeks adalah ${exam.optionCount - 1}` },
        { status: 400 }
      );
    }

    // Pastikan questionId milik exam ini
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        examId: exam.id,
      },
      select: { id: true },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Soal tidak ditemukan pada ujian ini" },
        { status: 400 }
      );
    }

    // Upsert jawaban
    await prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      update: {
        selectedIndex,
      },
      create: {
        attemptId,
        questionId,
        selectedIndex,
      },
    });

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving answer:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server" },
      { status: 500 }
    );
  }
}
