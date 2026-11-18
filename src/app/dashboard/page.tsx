import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { formatWIB } from "@/lib/date";
import {
  Clock,
  BookOpen,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  Lock,
  PlusCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParticipantDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      level: true,
      registrations: {
        include: {
          exam: {
            include: {
              subject: true,
            },
          },
          attempt: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Cek pengaturan pendaftaran terbuka
  const regCloseSetting = await prisma.setting.findUnique({
    where: { key: "registrationCloseAt" },
  });
  const regCloseAt = regCloseSetting?.value ? new Date(regCloseSetting.value as string) : null;
  const isRegistrationOpen = !regCloseAt || new Date() < regCloseAt;

  // Cari mapel lain di jenjang yang sama yang belum didaftarkan
  const registeredExamIds = user.registrations.map((r) => r.examId);
  const otherAvailableExams = user.levelId
    ? await prisma.exam.findMany({
        where: {
          levelId: user.levelId,
          isActive: true,
          id: { notIn: registeredExamIds },
        },
        include: { subject: true },
      })
    : [];

  const now = new Date();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 py-10 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header Profil Peserta */}
          <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#0B1F4B]/10 text-[#0B1F4B]">
                  Peserta Resmi
                </span>
                <span className="text-xs font-mono font-bold text-[#C9A227] px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                  {user.participantCode || "-"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#0B1F4B]">{user.name}</h1>
              <p className="text-sm text-slate-500">
                {user.school} &bull; {user.city} &bull; Jenjang: <strong className="text-slate-700">{user.level?.name || "-"}</strong>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/dashboard/ranking"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#0B1F4B] bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors"
              >
                Lihat Peringkat
              </Link>
              <div className="text-left sm:text-right text-xs text-slate-500">
                <div>Nomor WhatsApp: {user.whatsapp}</div>
                <div>Email: {user.email}</div>
              </div>
            </div>
          </div>

          {/* Daftar Ujian yang Diikuti */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0B1F4B]">Daftar Mata Pelajaran & Sesi Ujian</h2>
                <p className="text-xs text-slate-500">Status pengerjaan dan hasil kompetisi yang Anda ikuti</p>
              </div>
            </div>

            {user.registrations.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
                Anda belum terdaftar pada mata pelajaran ujian apa pun.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.registrations.map((reg) => {
                  const exam = reg.exam;
                  const attempt = reg.attempt;

                  // Pengecekan status tombol ujian sesuai Bab 6.2
                  const isScheduled = exam.status === "SCHEDULED";
                  const isStarted = exam.startAt ? now >= exam.startAt : false;
                  const isEnded = exam.endAt ? now > exam.endAt : false;
                  const isClosed = exam.status === "CLOSED" || isEnded;
                  const hasSubmitted = attempt?.status === "SUBMITTED";
                  const isInProgress = attempt?.status === "IN_PROGRESS" && attempt.endsAt > now;

                  const canStart = isScheduled && isStarted && !isEnded && !hasSubmitted && user.isActive;

                  // Pembahasan (Bab 8):
                  const canDiscuss =
                    (exam.status === "CLOSED" || isEnded) &&
                    exam.discussionOpen &&
                    hasSubmitted;

                  return (
                    <div
                      key={reg.id}
                      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {exam.subject.name}
                            </span>
                            <h3 className="text-lg font-bold text-[#0B1F4B] mt-1">{exam.title}</h3>
                          </div>
                          {hasSubmitted ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Selesai
                            </span>
                          ) : isInProgress ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              Sedang Dikerjakan
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                              Belum Dikerjakan
                            </span>
                          )}
                        </div>

                        {/* Jadwal & Detail */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                          <div>
                            <span className="block text-slate-400">Jadwal Mulai:</span>
                            <span className="font-medium text-slate-800">
                              {exam.startAt ? formatWIB(exam.startAt) : "Belum ditentukan"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-400">Batas Waktu:</span>
                            <span className="font-medium text-slate-800">
                              {exam.endAt ? formatWIB(exam.endAt) : "Belum ditentukan"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-400">Durasi:</span>
                            <span className="font-medium text-slate-800">{exam.durationMinutes} Menit</span>
                          </div>
                          <div>
                            <span className="block text-slate-400">Jumlah Soal:</span>
                            <span className="font-medium text-slate-800">{exam.questionCount} Butir</span>
                          </div>
                        </div>

                        {/* Hasil Nilai jika sudah dipublikasikan */}
                        {exam.resultsPublished && hasSubmitted && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                            <div>
                              <span className="text-slate-500 block">Nilai Ujian</span>
                              <span className="text-xl font-bold text-[#0B1F4B]">
                                {attempt?.score ? Number(attempt.score).toFixed(2) : "0"}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-500 block">Benar / Soal</span>
                              <span className="font-semibold text-slate-800">
                                {attempt?.correctCount || 0} / {exam.questionCount}
                              </span>
                            </div>
                            <div>
                              <Link
                                href={`/dashboard/result/${exam.id}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B1F4B] hover:text-[#C9A227] underline"
                              >
                                Lihat Rekap
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tombol Aksi Ujian */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        {canStart || isInProgress ? (
                          <Link
                            href={`/exam/${exam.id}`}
                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-[#0B1F4B] hover:bg-[#0B1F4B]/90 rounded-lg transition-colors shadow-sm"
                          >
                            <PlayCircle className="w-4 h-4 text-[#C9A227]" />
                            {isInProgress ? "Lanjutkan Ujian" : "Mulai Ujian"}
                          </Link>
                        ) : hasSubmitted ? (
                          <div className="w-full flex flex-col sm:flex-row items-center gap-2">
                            <Link
                              href={`/dashboard/result/${exam.id}`}
                              className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#0B1F4B] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              Lihat Hasil
                            </Link>
                            {canDiscuss ? (
                              <Link
                                href={`/dashboard/review/${exam.id}`}
                                className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-[#0B1F4B] hover:bg-[#0B1F4B]/90 rounded-lg transition-colors"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                Pembahasan
                              </Link>
                            ) : (
                              <div className="w-full sm:flex-1 text-center py-2 px-2 text-[11px] text-slate-400 bg-slate-50 rounded-lg border border-slate-200 inline-flex items-center justify-center gap-1">
                                <Lock className="w-3 h-3 text-slate-400" />
                                Pembahasan Terkunci
                              </div>
                            )}
                          </div>
                        ) : isClosed ? (
                          <div className="w-full text-center py-2 px-3 text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                            Sesi Ujian Telah Ditutup
                          </div>
                        ) : (
                          <div className="w-full text-center py-2 px-3 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                            Ujian Belum Dimulai
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bagian Pendaftaran Mapel Tambahan (Jika pendaftaran masih dibuka) */}
          {isRegistrationOpen && otherAvailableExams.length > 0 && (
            <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[#0B1F4B] flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-[#C9A227]" />
                  Tambah Pendaftaran Mata Pelajaran
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Masa pendaftaran masih terbuka. Anda dapat mendaftarkan mata pelajaran lain pada jenjang {user.level?.name}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {otherAvailableExams.map((extraExam) => (
                  <form
                    key={extraExam.id}
                    action={async () => {
                      "use server";
                      await prisma.registration.create({
                        data: {
                          userId: user.id,
                          examId: extraExam.id,
                        },
                      });
                      redirect("/dashboard");
                    }}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50 hover:border-[#0B1F4B] transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {extraExam.subject.name}
                      </span>
                      <h4 className="text-sm font-bold text-[#0B1F4B] mt-2">{extraExam.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Durasi: {extraExam.durationMinutes} menit &bull; {extraExam.questionCount} butir soal
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="mt-4 w-full py-1.5 px-3 text-xs font-semibold text-white bg-[#0B1F4B] hover:bg-[#0B1F4B]/90 rounded-md transition-colors"
                    >
                      Daftar Mapel Ini
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
