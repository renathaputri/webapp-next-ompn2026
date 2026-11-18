import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getQuestionsForReview } from "@/lib/exam-questions";
import { ensureExamState } from "@/lib/exam-state";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldAlert } from "lucide-react";
import { ReviewClient } from "./review-client";

interface ReviewPageProps {
  params: Promise<{ examId: string }>;
}

export default async function ExamReviewPage({ params }: ReviewPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { examId } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      level: { select: { name: true } },
      subject: { select: { name: true } },
    },
  });

  if (!exam) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-navy mb-2">Ujian Tidak Ditemukan</h1>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  // Sinkronkan status ujian
  const updatedExam = await ensureExamState(exam);
  exam.status = updatedExam.status;

  const registration = await prisma.registration.findUnique({
    where: {
      userId_examId: {
        userId: session.user.id,
        examId: exam.id,
      },
    },
    include: {
      attempt: true,
    },
  });

  const now = new Date();
  const isTimePassed = exam.endAt ? now > new Date(exam.endAt) : false;
  const isClosed = exam.status === "CLOSED";
  const isDiscussionOpen = exam.discussionOpen;
  const hasSubmitted = registration?.attempt?.status === "SUBMITTED";

  // VALIDASI KETAT ATURAN AKSES PEMBAHASAN (Bab 8):
  // 1. exam.status == CLOSED
  // 2. now > exam.endAt
  // 3. exam.discussionOpen == true
  // 4. Peserta punya attempt SUBMITTED
  const canAccess = isClosed && isTimePassed && isDiscussionOpen && hasSubmitted;

  if (!canAccess) {
    let reason = "Pembahasan soal untuk ujian ini belum dapat diakses.";

    if (!hasSubmitted) {
      reason = "Anda belum menyelesaikan atau mengumpulkan lembar jawaban ujian ini.";
    } else if (!isClosed || !isTimePassed) {
      reason = "Ujian masih berlangsung. Pembahasan baru dapat dibuka setelah seluruh periode ujian berakhir.";
    } else if (!isDiscussionOpen) {
      reason = "Pembahasan soal belum dibuka secara resmi oleh panitia pelaksana.";
    }

    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-navy mb-2">Pembahasan Terkunci</h1>
          <p className="text-sm text-slate-600 mb-6">{reason}</p>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-left text-slate-500 mb-6 space-y-1.5">
            <div className="font-semibold text-slate-700 mb-1">Syarat Akses Pembahasan:</div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasSubmitted ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span>Telah menyelesaikan dan mengumpulkan ujian</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isClosed && isTimePassed ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span>Periode waktu ujian telah resmi berakhir</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isDiscussionOpen ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span>Panitia membuka akses pembahasan soal</span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy hover:bg-navy/90 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const attempt = registration.attempt!;

  // Ambil soal pembahasan (dengan urutan pengerjaan peserta)
  const questionOrderArray = Array.isArray(attempt.questionOrder)
    ? (attempt.questionOrder as string[])
    : null;
  const questions = await getQuestionsForReview(exam.id, questionOrderArray);

  // Ambil jawaban peserta
  const userAnswers = await prisma.answer.findMany({
    where: { attemptId: attempt.id },
    select: {
      questionId: true,
      selectedIndex: true,
    },
  });

  const answersMap: Record<string, number | null> = {};
  for (const ans of userAnswers) {
    answersMap[ans.questionId] = ans.selectedIndex;
  }

  return (
    <ReviewClient
      exam={{
        id: exam.id,
        title: exam.title,
        levelName: exam.level.name,
        subjectName: exam.subject.name,
        questionCount: exam.questionCount,
        optionCount: exam.optionCount,
      }}
      questions={questions}
      answers={answersMap}
      score={attempt.score ? Number(attempt.score) : 0}
      correctCount={attempt.correctCount ?? 0}
    />
  );
}
