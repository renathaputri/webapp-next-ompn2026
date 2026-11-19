import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Countdown } from "@/components/countdown";
import {
  ArrowRight,
  BookOpen,
  Award,
  BarChart3,
  Clock,
  FileText,
  GraduationCap,
  Medal,
  MessageSquareText,
  Save,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { formatWIB } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const regCloseSetting = await prisma.setting.findUnique({
    where: { key: "registrationCloseAt" },
  });

  const regCloseAt = regCloseSetting?.value ? new Date(regCloseSetting.value as string) : null;
  const isRegistrationOpen = !regCloseAt || new Date() < regCloseAt;

  const taglinePage = await prisma.contentPage.findUnique({
    where: { key: "home_tagline" },
  });

  const announcements = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const levels = await prisma.level.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      exams: {
        where: { isActive: true },
        include: { subject: true },
      },
    },
  });

  const now = new Date();
  const nextExam = await prisma.exam.findFirst({
    where: {
      status: "SCHEDULED",
      startAt: { gte: now },
    },
    orderBy: { startAt: "asc" },
  });

  const participantCount = await prisma.user.count({
    where: { role: "PARTICIPANT" },
  });

  const subjectCount = await prisma.subject.count({
    where: { isActive: true },
  });

  const levelIcons: Record<string, typeof GraduationCap> = {
    SD: BookOpen,
    SMP: GraduationCap,
    SMA: Award,
  };

  const steps = [
    {
      icon: FileText,
      title: "Daftar Akun",
      desc: "Buat akun peserta dengan data diri lengkap dan lakukan verifikasi.",
    },
    {
      icon: BookOpen,
      title: "Pilih Kategori",
      desc: "Tentukan jenjang dan mata pelajaran kompetisi yang ingin diikuti.",
    },
    {
      icon: Clock,
      title: "Ikuti Ujian",
      desc: "Kerjakan soal secara daring sesuai jadwal dengan waktu server otomatis.",
    },
    {
      icon: Trophy,
      title: "Lihat Peringkat",
      desc: "Periksa nilai hasil ujian, peringkat nasional, dan unduh sertifikat.",
    },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: "Waktu Server-Authoritative",
      desc: "Semua durasi dan batas waktu dikontrol mutlak dari server. Bebas manipulasi jam perangkat.",
    },
    {
      icon: Save,
      title: "Autosave Jawaban",
      desc: "Jawaban tersimpan otomatis secara instan dengan proteksi antrean lokal jika koneksi terputus.",
    },
    {
      icon: BarChart3,
      title: "Pemeringkatan Transparan",
      desc: "Penilaian otomatis terverifikasi dan peringkat nasional deterministik tanpa lompat nomor urut.",
    },
    {
      icon: Medal,
      title: "Sertifikat Digital",
      desc: "Setiap peserta yang menyelesaikan ujian berhak mendapat sertifikat resmi tingkat nasional.",
    },
    {
      icon: MessageSquareText,
      title: "Pembahasan Soal",
      desc: "Akses pembahasan lengkap setelah sesi ujian selesai untuk sarana evaluasi dan pembelajaran.",
    },
    {
      icon: Users,
      title: "Skala Nasional",
      desc: "Terbuka untuk seluruh siswa SD, SMP, dan SMA di seluruh wilayah Indonesia.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden bg-[#071E4A]">
          {/* Decorative shapes using logo palette */}
          <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#F59E0B]/[.08]" />
            <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-blue-500/[.06]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-[#F59E0B]/[.05]" />
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid)" />
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left — Copy */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-3">
                  <div className="text-xs font-semibold tracking-widest text-[#FBBF24] uppercase">
                    YNF.production mempersembahkan
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                    Olimpiade Mata Pelajaran{" "}
                    <span className="relative inline-block">
                      <span className="relative z-10 text-[#F59E0B]">Nasional</span>
                      <span className="absolute bottom-1 left-0 w-full h-3 bg-[#F59E0B]/25 -skew-x-6 rounded" aria-hidden="true" />
                    </span>{" "}
                    <span className="text-[#FBBF24]">2026</span>
                  </h1>

                  <p className="text-sm sm:text-base font-semibold tracking-wide text-[#FBBF24]">
                    &ldquo;Berprestasi, Berkompetisi, dan Menginspirasi&rdquo; untuk Indonesia Emas
                  </p>

                  <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-xl pt-1">
                    {taglinePage?.body ||
                      "Ajang kompetisi akademik daring berskala nasional untuk mengasah potensi terbaik generasi muda Indonesia dari jenjang SD, SMP, hingga SMA."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  {isRegistrationOpen ? (
                    <Link
                      href="/daftar"
                      className="inline-flex items-center gap-2.5 px-7 py-3.5 text-base font-bold text-[#071E4A] bg-[#F59E0B] hover:bg-[#D97706] rounded-lg shadow-lg shadow-[#F59E0B]/25 transition-colors"
                    >
                      Daftar Sekarang
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white/60 bg-white/10 border border-white/10 rounded-lg cursor-default">
                      Pendaftaran Ditutup
                    </div>
                  )}
                  <Link
                    href="/panduan"
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Panduan Kompetisi
                  </Link>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-8 pt-2">
                  <div>
                    <div className="text-2xl md:text-3xl font-extrabold text-white">
                      {participantCount > 0 ? participantCount.toLocaleString("id-ID") : "500"}+
                    </div>
                    <div className="text-xs text-white/60 font-medium uppercase tracking-wider mt-0.5">Peserta</div>
                  </div>
                  <div className="w-px h-10 bg-white/15" />
                  <div>
                    <div className="text-2xl md:text-3xl font-extrabold text-white">
                      {subjectCount > 0 ? subjectCount : "6"}+
                    </div>
                    <div className="text-xs text-white/60 font-medium uppercase tracking-wider mt-0.5">Mata Pelajaran</div>
                  </div>
                  <div className="w-px h-10 bg-white/15" />
                  <div>
                    <div className="text-2xl md:text-3xl font-extrabold text-white">{levels.length || 3}</div>
                    <div className="text-xs text-white/60 font-medium uppercase tracking-wider mt-0.5">Jenjang</div>
                  </div>
                </div>
              </div>

              {/* Right — Countdown */}
              <div className="lg:col-span-5">
                <div className="bg-white/[.08] backdrop-blur-sm rounded-2xl border border-white/15 p-6 md:p-8 shadow-xl">
                  {regCloseAt && isRegistrationOpen ? (
                    <Countdown
                      targetDate={regCloseAt}
                      label="Batas Waktu Pendaftaran"
                      expiredMessage="Pendaftaran telah ditutup"
                    />
                  ) : nextExam?.startAt ? (
                    <Countdown
                      targetDate={nextExam.startAt}
                      label={`Menuju Ujian: ${nextExam.title}`}
                      expiredMessage="Sesi ujian sedang / telah berlangsung"
                    />
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-xs uppercase tracking-wider text-[#F59E0B] font-semibold mb-3">
                        Status Pendaftaran
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">
                        {isRegistrationOpen ? "Pendaftaran Terbuka" : "Pendaftaran Ditutup"}
                      </div>
                      <p className="text-sm text-white/60">
                        {isRegistrationOpen
                          ? "Daftarkan diri Anda sekarang sebelum kuota dan jadwal ditutup oleh panitia."
                          : "Waktu pendaftaran kompetisi OMPN 2026 telah resmi berakhir."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
              <path d="M0 56V20C240 4 480 0 720 8C960 16 1200 36 1440 44V56H0Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ============ ALUR PENDAFTARAN ============ */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A2558]/5 text-[#0A2558] text-xs font-semibold tracking-wide mb-4">
                Langkah Mudah
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A2558] tracking-tight">
                Cara Mengikuti Kompetisi
              </h2>
              <p className="text-slate-500 mt-3 text-base">
                Empat langkah sederhana dari pendaftaran hingga pengumuman peringkat nasional.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="relative text-center group">
                    {i > 0 && (
                      <div className="hidden lg:block absolute top-10 -left-4 w-8 border-t-2 border-dashed border-slate-200" aria-hidden="true" />
                    )}
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-[#0A2558] flex items-center justify-center mb-5 shadow-lg shadow-[#0A2558]/10 group-hover:shadow-[#F59E0B]/20 transition-shadow">
                      <Icon className="w-8 h-8 text-[#F59E0B]" />
                    </div>
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F59E0B] text-[#0A2558] text-xs font-bold mb-3">
                      {i + 1}
                    </div>
                    <h3 className="text-lg font-bold text-[#0A2558] mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============ KATEGORI JENJANG ============ */}
        <section className="py-16 md:py-24 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A2558]/5 text-[#0A2558] text-xs font-semibold tracking-wide mb-4">
                Jenjang Pendidikan
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A2558] tracking-tight">
                Kategori Kompetisi
              </h2>
              <p className="text-slate-500 mt-3 text-base">
                Tersedia untuk tiga jenjang pendidikan dengan kurikulum dan standar soal yang terdiferensiasi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {levels.map((level) => {
                const Icon = levelIcons[level.code] || GraduationCap;
                const uniqueSubjects = Array.from(
                  new Map(level.exams.map((ex) => [ex.subject.id, ex.subject.name])).values()
                );

                return (
                  <div
                    key={level.id}
                    className="relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
                  >
                    {/* Top accent bar with logo gold */}
                    <div className="h-1.5 bg-[#F59E0B]" />

                    <div className="p-6 md:p-8 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-[#0A2558] flex items-center justify-center shadow-sm">
                          <Icon className="w-7 h-7 text-[#F59E0B]" />
                        </div>
                        <span className="text-xs font-bold text-[#0A2558] bg-[#0A2558]/5 px-3 py-1 rounded-full">
                          {level.code}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[#0A2558] mb-2">{level.name}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed mb-5">
                        Kompetisi akademik terstandarisasi untuk mengukur kompetensi analitis jenjang {level.name}.
                      </p>

                      {uniqueSubjects.length > 0 && (
                        <div className="mt-auto pt-4 border-t border-slate-100">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                            Mata Pelajaran
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {uniqueSubjects.map((name) => (
                              <span
                                key={name}
                                className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-700 rounded-md"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-6 md:px-8 pb-6">
                      <Link
                        href="/kategori"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A2558] hover:text-[#F59E0B] transition-colors"
                      >
                        Lihat Detail
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {levels.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">Kategori kompetisi akan segera ditampilkan.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============ KEUNGGULAN ============ */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A2558]/5 text-[#0A2558] text-xs font-semibold tracking-wide mb-4">
                Mengapa OMPN 2026
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A2558] tracking-tight">
                Keunggulan Sistem Kompetisi
              </h2>
              <p className="text-slate-500 mt-3 text-base">
                Integritas, keamanan, dan kenyamanan peserta menjadi prioritas utama platform kami.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                    <div className="w-12 h-12 rounded-lg bg-[#0A2558] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#F59E0B]" />
                    </div>
                    <h3 className="text-base font-bold text-[#0A2558] mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============ PENGUMUMAN ============ */}
        {announcements.length > 0 && (
          <section className="py-16 md:py-24 bg-slate-50 border-y border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A2558]/5 text-[#0A2558] text-xs font-semibold tracking-wide mb-4">
                    Informasi Terbaru
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-[#0A2558] tracking-tight">
                    Pengumuman Resmi
                  </h2>
                  <p className="text-slate-500 mt-2 text-base">
                    Informasi penting terkini dari panitia OMPN 2026.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {announcements.map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative bg-white p-6 rounded-xl border border-slate-200 hover:border-[#F59E0B]/40 hover:shadow-sm transition-all"
                  >
                    {index === 0 && (
                      <span className="absolute -top-2.5 left-5 inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold text-[#071E4A] bg-[#F59E0B] rounded-full uppercase tracking-wider">
                        Terbaru
                      </span>
                    )}
                    <div className="text-xs text-slate-400 mb-3 font-medium">
                      {formatWIB(item.createdAt, "dd MMMM yyyy")}
                    </div>
                    <h3 className="font-bold text-[#0A2558] mb-2 group-hover:text-[#F59E0B] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 whitespace-pre-line">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============ CTA FINAL ============ */}
        <section className="relative overflow-hidden bg-[#071E4A]">
          <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#F59E0B]/[.06]" />
            <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/[.03]" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Siap Menguji Kemampuanmu?
            </h2>
            <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-8">
              Bergabunglah bersama ribuan siswa terbaik dari seluruh Indonesia dalam Olimpiade Mata Pelajaran Nasional 2026.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {isRegistrationOpen ? (
                <Link
                  href="/daftar"
                  className="inline-flex items-center gap-2.5 px-8 py-4 text-base font-bold text-[#071E4A] bg-[#F59E0B] hover:bg-[#D97706] rounded-lg shadow-lg shadow-[#F59E0B]/25 transition-colors"
                >
                  Daftar Sekarang
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white/60 bg-white/10 border border-white/10 rounded-lg cursor-default">
                  Pendaftaran Telah Ditutup
                </div>
              )}
              <Link
                href="/kontak"
                className="inline-flex items-center gap-2 px-6 py-4 text-base font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg transition-colors"
              >
                Hubungi Panitia
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
