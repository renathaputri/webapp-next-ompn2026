import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatWIB } from "@/lib/date";
import { Users, FileText, Calendar, CheckCircle, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [totalParticipants, totalExams, totalAttempts, regCloseSetting, recentUsers] =
    await Promise.all([
      prisma.user.count({
        where: { role: "PARTICIPANT" },
      }),
      prisma.exam.count(),
      prisma.attempt.count(),
      prisma.setting.findUnique({
        where: { key: "registrationCloseAt" },
      }),
      prisma.user.findMany({
        where: { role: "PARTICIPANT" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          level: true,
          registrations: true,
        },
      }),
    ]);

  const regCloseAt = regCloseSetting?.value ? new Date(regCloseSetting.value as string) : null;
  const isRegistrationOpen = !regCloseAt || new Date() < regCloseAt;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1F4B]">Ringkasan Statistik</h1>
        <p className="text-xs text-slate-500 mt-1">Status dan aktivitas sistem OMPN 2026 secara realtime</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Peserta</span>
            <Users className="w-5 h-5 text-[#0B1F4B]" />
          </div>
          <div className="text-2xl font-bold text-[#0B1F4B] mt-2">{totalParticipants}</div>
          <div className="text-[11px] text-slate-400 mt-1">Peserta terdaftar di sistem</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Ujian</span>
            <FileText className="w-5 h-5 text-[#0B1F4B]" />
          </div>
          <div className="text-2xl font-bold text-[#0B1F4B] mt-2">{totalExams}</div>
          <div className="text-[11px] text-slate-400 mt-1">Sesi ujian terkonfigurasi</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pengerjaan Ujian</span>
            <CheckCircle className="w-5 h-5 text-[#0B1F4B]" />
          </div>
          <div className="text-2xl font-bold text-[#0B1F4B] mt-2">{totalAttempts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Sesi pengerjaan / attempt</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Status Pendaftaran</span>
            <Calendar className="w-5 h-5 text-[#C9A227]" />
          </div>
          <div className="text-xl font-bold text-[#0B1F4B] mt-2">
            {isRegistrationOpen ? "Terbuka" : "Ditutup"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {regCloseAt ? `Batas: ${formatWIB(regCloseAt)}` : "Tanpa batas penutupan"}
          </div>
        </div>
      </div>

      {/* Tabel Peserta Terbaru */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-[#0B1F4B] text-base">Pendaftaran Peserta Terkini</h2>
          <Link
            href="/admin/participants"
            className="text-xs font-semibold text-[#0B1F4B] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
          >
            Lihat Semua Peserta
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Belum ada peserta yang mendaftar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Kode Peserta</th>
                  <th className="py-3 px-6">Nama Lengkap</th>
                  <th className="py-3 px-6">Jenjang & Sekolah</th>
                  <th className="py-3 px-6">Mapel Terdaftar</th>
                  <th className="py-3 px-6">Waktu Daftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-mono font-bold text-xs text-[#0B1F4B]">
                      {u.participantCode || "-"}
                    </td>
                    <td className="py-3 px-6 font-medium text-slate-800">{u.name}</td>
                    <td className="py-3 px-6 text-slate-600 text-xs">
                      <div>{u.level?.name || "-"}</div>
                      <div className="text-slate-400">{u.school}</div>
                    </td>
                    <td className="py-3 px-6 text-xs text-slate-600 font-medium">
                      {u.registrations.length} Mapel
                    </td>
                    <td className="py-3 px-6 text-xs text-slate-500">{formatWIB(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
