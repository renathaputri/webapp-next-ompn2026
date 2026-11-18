import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Countdown } from "@/components/countdown";
import { ArrowRight, BookOpen, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { formatWIB } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Ambil pengaturan penutupan pendaftaran
  const regCloseSetting = await prisma.setting.findUnique({
    where: { key: "registrationCloseAt" },
  });

  const regCloseAt = regCloseSetting?.value ? new Date(regCloseSetting.value as string) : null;
  const isRegistrationOpen = !regCloseAt || new Date() < regCloseAt;

  // Ambil tagline dari ContentPage
  const taglinePage = await prisma.contentPage.findUnique({
    where: { key: "home_tagline" },
  });

  // Ambil pengumuman yang dipublikasikan
  const announcements = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // Ambil jenjang pendidikan
  const levels = await prisma.level.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      exams: {
        where: { isActive: true },
        include: { subject: true },
      },
    },
  });

  // Ambil ujian terdekat untuk informasi countdown alternatif
  const now = new Date();
  const nextExam = await prisma.exam.findFirst({
    where: {
      status: "SCHEDULED",
      startAt: { gte: now },
    },
    orderBy: { startAt: "asc" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-24 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[#0B1F4B] text-xs font-semibold tracking-wide border border-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A227]" />
                  Olimpiade Daring Berskala Nasional
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0B1F4B] leading-tight">
                  OMPN <span className="text-[#C9A227]">2026</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl">
                  {taglinePage?.body ||
                    "Ajang Prestasi Sains dan Pengetahuan Tingkat Nasional untuk Mengasah Potensi Terbaik Generasi Muda Indonesia."}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  {isRegistrationOpen ? (
                    <Link
                      href="/daftar"
                      className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-[#C9A227] hover:bg-[#B38F22] rounded-lg shadow-sm transition-colors"
                    >
                      Daftar Sekarang
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg">
                      Pendaftaran Ditutup
                    </div>
                  )}

                  <Link
                    href="/panduan"
                    className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-[#0B1F4B] bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Panduan & Peraturan
                  </Link>
                </div>
              </div>

              {/* Countdown Column */}
              <div className="lg:col-span-5">
                {regCloseAt && isRegistrationOpen ? (
                  <Countdown
                    targetDate={regCloseAt}
                    label="Batas Waktu Pendaftaran"
                    expiredMessage="Pendaftaran telah ditutup"
                  />
                ) : nextExam?.startAt ? (
                  <Countdown
                    targetDate={nextExam.startAt}
                    label={`Menuju Ujian Terdekat: ${nextExam.title}`}
                    expiredMessage="Sesi ujian sedang / telah berlangsung"
                  />
                ) : (
                  <div className="bg-[#0B1F4B] text-white rounded-xl p-8 text-center border border-slate-700 shadow-md">
                    <div className="text-xs uppercase tracking-wider text-[#C9A227] font-semibold mb-2">
                      Status Pendaftaran
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {isRegistrationOpen ? "Pendaftaran Terbuka" : "Pendaftaran Ditutup"}
                    </div>
                    <p className="text-sm text-slate-300">
                      {isRegistrationOpen
                        ? "Daftarkan diri Anda sekarang sebelum kuota dan jadwal ditutup oleh panitia."
                        : "Waktu pendaftaran kompetisi OMPN 2026 telah resmi berakhir."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Pengumuman Terbaru */}
        {announcements.length > 0 && (
          <section className="py-12 bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#0B1F4B]">Pengumuman Resmi</h2>
                <p className="text-sm text-slate-500 mt-1">Informasi penting terkini dari panitia OMPN 2026</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {announcements.map((item) => (
                  <div key={item.id} className="p-5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                    <div className="text-xs text-slate-400 mb-2">{formatWIB(item.createdAt, "dd MMMM yyyy")}</div>
                    <h3 className="font-semibold text-[#0B1F4B] mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-line">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Kategori Jenjang */}
        <section className="py-16 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-[#0B1F4B]">Kategori Kompetisi</h2>
              <p className="text-slate-600 mt-2">
                OMPN 2026 diselenggarakan untuk tiga jenjang pendidikan dengan kurikulum yang terstandarisasi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {levels.map((level) => (
                <div key={level.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="inline-block px-3 py-1 rounded bg-[#0B1F4B]/10 text-[#0B1F4B] text-xs font-bold mb-4">
                      {level.code}
                    </div>
                    <h3 className="text-xl font-bold text-[#0B1F4B] mb-3">{level.name}</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Kompetisi akademik yang dirancang khusus untuk mengukur kompetensi analitis jenjang {level.name}.
                    </p>
                    {level.exams.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                          Mata Pelajaran Aktif:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {level.exams.map((ex) => (
                            <span key={ex.id} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                              {ex.subject.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      href="/kategori"
                      className="text-sm font-semibold text-[#0B1F4B] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
                    >
                      Lihat Detail Kategori
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Keunggulan Sistem */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-[#0B1F4B]">Standar Pelaksanaan Ujian</h2>
              <p className="text-slate-600 mt-2">
                Integritas, akurasi, dan kenyamanan peserta adalah prioritas utama sistem kami.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                <div className="w-12 h-12 rounded-lg bg-[#0B1F4B] text-white flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-[#C9A227]" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1F4B] mb-2">Sinkronisasi Waktu Server</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Semua durasi, pembukaan, dan penutupan ujian dikontrol mutlak dari server untuk memastikan tidak ada kecurangan jam perangkat.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                <div className="w-12 h-12 rounded-lg bg-[#0B1F4B] text-white flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-[#C9A227]" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1F4B] mb-2">Penyimpanan Jawaban Otomatis</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Fitur autosave menyimpan jawaban tiap butir secara instan dengan proteksi antrean lokal jika koneksi internet sempat terputus.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                <div className="w-12 h-12 rounded-lg bg-[#0B1F4B] text-white flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[#C9A227]" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1F4B] mb-2">Pemeringkatan Transparan</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Penilaian otomatis terverifikasi dan pemeringkatan deterministik tanpa lompat nomor peringkat bagi seluruh peserta yang telah selesai.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
