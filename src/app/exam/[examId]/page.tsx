import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureExamState } from "@/lib/exam-state";
import { getQuestionsForExam } from "@/lib/exam-questions";
import { finalizeSingleAttempt } from "@/lib/finalize-attempts";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { ExamRoomClient } from "./exam-room-client";
import Link from "next/link";
import { ArrowLeft, Clock, ShieldAlert } from "lucide-react";
import { formatWIB } from "@/lib/date";

interface ExamPageProps {
  params: Promise<{ examId: string }>;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default async function ExamPage({ params }: ExamPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { examId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isActive: true },
  });

  if (!user || !user.isActive) {
    redirect("/login");
  }

  // Cari exam
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      level: { select: { name: true } },
      subject: { select: { name: true } },
    },
  });

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 text-center border border-slate-200">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-navy mb-2">Ujian Tidak Ditemukan</h1>
          <p className="text-sm text-slate-600 mb-6">
            Data ujian yang Anda tuju tidak ditemukan atau telah dihapus.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Sinkronkan status jika waktu endAt sudah lewat (Bab 6.1)
  const updatedExam = await ensureExamState(exam);
  exam.status = updatedExam.status;

  // Periksa registrasi peserta (Bab 6.2)
  const registration = await prisma.registration.findUnique({
    where: {
      userId_examId: {
        userId: user.id,
        examId: exam.id,
      },
    },
    include: {
      attempt: true,
    },
  });

  if (!registration) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 text-center border border-slate-200">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-navy mb-2">Akses Ditolak</h1>
          <p className="text-sm text-slate-600 mb-6">
            Anda belum terdaftar untuk mengikuti ujian {exam.title}.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();

  // Validasi jendela waktu dan status ujian (Bab 6.2)
  if (
    exam.status !== "SCHEDULED" ||
    !exam.startAt ||
    !exam.endAt ||
    now < new Date(exam.startAt) ||
    now > new Date(exam.endAt)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 text-center border border-slate-200">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-navy mb-2">Ujian Belum atau Tidak Aktif</h1>
          <p className="text-sm text-slate-600 mb-2">
            Status ujian saat ini: <span className="font-semibold">{exam.status}</span>
          </p>
          {exam.startAt && exam.endAt && (
            <p className="text-xs text-slate-500 mb-6">
              Jadwal pelaksanaan: {formatWIB(exam.startAt)} s/d {formatWIB(exam.endAt)}
            </p>
          )}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  let attempt = registration.attempt;

  // Jika attempt sudah SUBMITTED, peserta tidak boleh mengulang (Bab 6.2)
  if (attempt && attempt.status === "SUBMITTED") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 text-center border border-slate-200">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-navy mb-2">Ujian Telah Selesai</h1>
          <p className="text-sm text-slate-600 mb-6">
            Anda telah mengumpulkan lembar jawaban ujian ini. Nilai dan peringkat akan diumumkan sesuai jadwal panitia.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Jika attempt masih IN_PROGRESS tapi sudah melewati batas waktu endsAt (Bab 6.5 Finalisasi Lazy)
  if (attempt && attempt.status === "IN_PROGRESS" && now > new Date(attempt.endsAt)) {
    await finalizeSingleAttempt(attempt.id);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 text-center border border-slate-200">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-navy mb-2">Waktu Pengerjaan Telah Habis</h1>
          <p className="text-sm text-slate-600 mb-6">
            Waktu pengerjaan ujian Anda telah berakhir. Jawaban yang sempat Anda pilih telah disimpan secara otomatis ke sistem.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Jika belum ada attempt, buat attempt baru dalam transaksi aman (Bab 6.3)
  if (!attempt) {
    try {
      let questionOrder: string[] | null = null;
      if (exam.shuffleQuestions) {
        const rawQuestionIds = await prisma.question.findMany({
          where: { examId: exam.id },
          select: { id: true },
          orderBy: { number: "asc" },
        });
        const ids = rawQuestionIds.map((q) => q.id);
        questionOrder = shuffleArray(ids);
      }

      // endsAt = min(now + durationMinutes, exam.endAt)
      const calculatedEnd = new Date(now.getTime() + exam.durationMinutes * 60 * 1000);
      const endsAt = calculatedEnd < exam.endAt ? calculatedEnd : exam.endAt;

      attempt = await prisma.attempt.create({
        data: {
          registrationId: registration.id,
          startedAt: now,
          endsAt,
          status: "IN_PROGRESS",
          questionOrder: questionOrder ?? undefined,
        },
      });
    } catch {
      // Tangani race condition klik ganda/dua tab: ambil attempt yang berhasil dibuat di tab lain
      attempt = await prisma.attempt.findUnique({
        where: { registrationId: registration.id },
      });

      if (!attempt) {
        throw new Error("Gagal memulai sesi ujian. Silakan coba lagi.");
      }
    }
  }

  // Ambil soal ujian (STRICT: tanpa correctIndex dan tanpa explanation per Bab 2 Poin 3)
  const questionOrderArray = Array.isArray(attempt.questionOrder)
    ? (attempt.questionOrder as string[])
    : null;
  const questions = await getQuestionsForExam(exam.id, questionOrderArray);

  // Ambil jawaban yang telah tersimpan
  const savedAnswers = await prisma.answer.findMany({
    where: { attemptId: attempt.id },
    select: {
      questionId: true,
      selectedIndex: true,
    },
  });

  const initialAnswers: Record<string, number | null> = {};
  for (const ans of savedAnswers) {
    initialAnswers[ans.questionId] = ans.selectedIndex;
  }

  return (
    <ExamRoomClient
      attempt={{
        id: attempt.id,
        startedAt: attempt.startedAt.toISOString(),
        endsAt: attempt.endsAt.toISOString(),
      }}
      exam={{
        id: exam.id,
        title: exam.title,
        questionCount: exam.questionCount,
        optionCount: exam.optionCount,
        subjectName: exam.subject.name,
        levelName: exam.level.name,
      }}
      questions={questions}
      initialAnswers={initialAnswers}
      serverTime={new Date().toISOString()}
    />
  );
}
