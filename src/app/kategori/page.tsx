import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const dynamic = "force-dynamic";

export default async function KategoriPage() {
  const levels = await prisma.level.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      exams: {
        where: { isActive: true },
        include: { subject: true },
      },
    },
  });

  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 md:py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <h1 className="text-3xl font-bold text-[#0B1F4B]">Kategori & Mata Pelajaran</h1>
            <p className="text-slate-600 mt-2">
              Informasi lengkap jenjang pendidikan dan mata pelajaran yang diperlombakan pada OMPN 2026.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {levels.map((level) => (
              <div key={level.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="inline-block px-3 py-1 rounded bg-[#0B1F4B]/10 text-[#0B1F4B] text-xs font-bold mb-3">
                    Jenjang {level.code}
                  </div>
                  <h2 className="text-xl font-bold text-[#0B1F4B] mb-2">{level.name}</h2>
                  <p className="text-sm text-slate-600 mb-4">
                    Peserta jenjang ini dapat memilih satu atau beberapa mata pelajaran yang tersedia di bawah ini.
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Mata Pelajaran:
                    </span>
                    {level.exams.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">Belum ada ujian yang dibuka</span>
                    ) : (
                      <ul className="space-y-1.5">
                        {level.exams.map((ex) => (
                          <li key={ex.id} className="text-sm text-slate-700 flex items-center justify-between">
                            <span>{ex.subject.name}</span>
                            <span className="text-xs text-slate-400">{ex.durationMinutes} menit</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-[#0B1F4B] mb-4">Daftar Seluruh Mata Pelajaran</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {subjects.map((subj) => (
                <div key={subj.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm font-medium text-slate-800">
                  {subj.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
