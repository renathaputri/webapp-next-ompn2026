import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { RegisterForm } from "./register-form";
import Link from "next/link";
import { formatWIB } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function DaftarPage() {
  const regCloseSetting = await prisma.setting.findUnique({
    where: { key: "registrationCloseAt" },
  });

  const regCloseAt = regCloseSetting?.value ? new Date(regCloseSetting.value as string) : null;
  const isRegistrationOpen = !regCloseAt || new Date() < regCloseAt;

  const levels = await prisma.level.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const exams = await prisma.exam.findMany({
    where: { isActive: true },
    include: {
      subject: true,
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 md:py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#0B1F4B]">Formulir Pendaftaran Peserta</h1>
            <p className="text-sm text-slate-600 mt-2">
              Lengkapi data di bawah ini untuk mengikuti Olimpiade Matematika dan Pengetahuan Nasional 2026.
            </p>
            {regCloseAt && isRegistrationOpen && (
              <div className="mt-3 inline-block px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800">
                Pendaftaran ditutup pada: <strong>{formatWIB(regCloseAt)}</strong>
              </div>
            )}
          </div>

          {!isRegistrationOpen ? (
            <div className="bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="text-2xl font-bold text-[#0B1F4B]">Pendaftaran Ditutup</div>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Masa pendaftaran untuk kompetisi OMPN 2026 telah resmi berakhir pada {formatWIB(regCloseAt)}. Peserta yang telah mendaftar sebelumnya tetap dapat masuk ke akun masing-masing.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-block px-6 py-2.5 bg-[#0B1F4B] text-white text-sm font-medium rounded-lg hover:bg-[#0B1F4B]/90 transition-colors"
                >
                  Masuk ke Akun Peserta
                </Link>
              </div>
            </div>
          ) : (
            <RegisterForm levels={levels} exams={exams} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
