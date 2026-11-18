import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { MarkdownView } from "@/components/markdown-view";
import { formatWIB } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function JadwalPage() {
  const page = await prisma.contentPage.findUnique({
    where: { key: "schedule" },
  });

  const exams = await prisma.exam.findMany({
    where: { isActive: true },
    include: {
      level: true,
      subject: true,
    },
    orderBy: [{ level: { sortOrder: "asc" } }, { subject: { name: "asc" } }],
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 md:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm">
            <h1 className="text-3xl font-bold text-[#0B1F4B] mb-6 border-b border-slate-200 pb-4">
              {page?.title || "Jadwal Pelaksanaan"}
            </h1>
            <MarkdownView
              content={
                page?.body ||
                "Informasi jadwal resmi pelaksanaan Olimpiade OMPN 2026."
              }
            />
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-[#0B1F4B] mb-4">Daftar Jadwal Ujian per Jenjang & Mata Pelajaran</h2>
            {exams.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                Jadwal sesi ujian belum ditentukan oleh panitia. Silakan cek kembali secara berkala.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Jenjang</th>
                      <th className="py-3 px-4">Mata Pelajaran</th>
                      <th className="py-3 px-4">Mulai (WIB)</th>
                      <th className="py-3 px-4">Selesai (WIB)</th>
                      <th className="py-3 px-4">Durasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-800">{exam.level.name}</td>
                        <td className="py-3 px-4 text-slate-700">{exam.subject.name}</td>
                        <td className="py-3 px-4 text-slate-600">{exam.startAt ? formatWIB(exam.startAt) : "Belum diatur"}</td>
                        <td className="py-3 px-4 text-slate-600">{exam.endAt ? formatWIB(exam.endAt) : "Belum diatur"}</td>
                        <td className="py-3 px-4 text-slate-600">{exam.durationMinutes} menit</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
