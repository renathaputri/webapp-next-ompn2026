import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getParticipantRank } from "@/lib/ranking";
import { formatWIB } from "@/lib/date";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  Trophy,
  AlertCircle,
} from "lucide-react";

interface ResultPageProps {
  params: Promise<{ examId: string }>;
}

export default async function ExamResultPage({ params }: ResultPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { examId } = await params;

  const registration = await prisma.registration.findUnique({
    where: {
      userId_examId: {
        userId: session.user.id,
        examId,
      },
    },
    include: {
      exam: {
        include: {
          level: { select: { name: true } },
          subject: { select: { name: true } },
        },
      },
      attempt: true,
    },
  });

  if (!registration || !registration.attempt) {
    redirect("/dashboard");
  }

  const { exam, attempt } = registration;

  if (attempt.status !== "SUBMITTED") {
    redirect(`/exam/${exam.id}`);
  }

  // Jika hasil belum dipublikasikan panitia (Bab 6.5 & Bab 8)
  if (!exam.resultsPublished) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Hasil Sedang Diproses</h1>
          <p className="text-sm text-slate-600 mb-6">
            Lembar jawaban Anda untuk <span className="font-semibold text-navy">{exam.title}</span> telah tersimpan. Pengumuman nilai dan peringkat resmi belum dipublikasikan oleh panitia.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 mb-8 border border-slate-100">
            Silakan periksa kembali dashboard Anda secara berkala sesuai jadwal yang telah ditentukan.
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

  // Ambil peringkat peserta
  const rankInfo = await getParticipantRank(exam.id, attempt.id);

  // Format durasi
  const totalSeconds = attempt.durationSeconds ?? 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedDuration = `${minutes} menit ${seconds} detik`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">Hasil Ujian</h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {exam.title} &bull; {exam.level.name} - {exam.subject.name}
            </p>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
            Hasil Resmi Dipublikasikan
          </span>
        </div>
      </div>

      {/* Kartu Ringkasan Nilai & Peringkat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Nilai Akhir */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="w-12 h-12 bg-navy/5 text-navy rounded-full flex items-center justify-center mb-3">
            <Award className="w-6 h-6 text-gold" />
          </div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">
            Nilai Akhir
          </span>
          <div className="text-4xl font-extrabold text-navy mb-2">
            {attempt.score ? Number(attempt.score).toFixed(2) : "0.00"}
          </div>
          <span className="text-xs text-slate-500">
            Skala 0 &ndash; 100
          </span>
        </div>

        {/* Peringkat Peserta */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-gold/15 text-gold-dark rounded-full flex items-center justify-center mb-3">
            <Trophy className="w-6 h-6 text-gold" />
          </div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">
            Peringkat Anda
          </span>
          <div className="text-4xl font-extrabold text-navy mb-2">
            {rankInfo ? `#${rankInfo.rank}` : "-"}
          </div>
          <span className="text-xs text-slate-500">
            dari {rankInfo?.totalParticipants ?? 0} peserta
          </span>
        </div>
      </div>

      {/* Rincian Pengerjaan */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-navy mb-4 pb-2 border-b border-slate-100">
          Rincian Pengerjaan Ujian
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 block text-xs">Jawaban Benar</span>
              <span className="font-bold text-slate-800">
                {attempt.correctCount ?? 0} dari {exam.questionCount} soal
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Clock className="w-5 h-5 text-navy shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 block text-xs">Waktu Pengerjaan</span>
              <span className="font-bold text-slate-800">{formattedDuration}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Clock className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 block text-xs">Waktu Pengumpulan</span>
              <span className="font-bold text-slate-800">
                {attempt.submittedAt ? formatWIB(attempt.submittedAt) : "-"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <AlertCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 block text-xs">Metode Pengumpulan</span>
              <span className="font-bold text-slate-800">
                {attempt.submitReason === "TIMEOUT"
                  ? "Batas Waktu Habis (Otomatis)"
                  : "Pengumpulan Mandiri"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Aksi Tambahan: Pembahasan & Peringkat Lengkap */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center"
        >
          Kembali ke Dashboard
        </Link>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/dashboard/ranking"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs sm:text-sm font-bold rounded-lg transition-colors"
          >
            <Trophy className="w-4 h-4 text-gold" />
            Papan Peringkat
          </Link>

          {exam.discussionOpen ? (
            <Link
              href={`/dashboard/review/${exam.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-navy hover:bg-navy/90 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-gold" />
              Lihat Pembahasan Soal
            </Link>
          ) : (
            <div className="text-xs text-slate-500 text-center sm:text-right">
              Pembahasan soal belum dibuka oleh panitia.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
