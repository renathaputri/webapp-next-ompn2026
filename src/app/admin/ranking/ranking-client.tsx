"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleResultsPublished } from "@/app/actions/exam-admin";
import { updateSettings } from "@/app/actions/content-admin";
import {
  Trophy,
  Medal,
  Award,
  Clock,
  Settings,
  School,
} from "lucide-react";

interface ExamOption {
  id: string;
  title: string;
  levelName: string;
  subjectName: string;
  resultsPublished: boolean;
}

interface RankedParticipant {
  rank: number;
  attemptId: string;
  userId: string;
  name: string;
  participantCode: string | null;
  school: string;
  score: number;
  correctCount: number;
  durationSeconds: number;
  submittedAt: string;
  submitReason: string | null;
}

interface AdminRankingClientProps {
  exams: ExamOption[];
  activeExam: ExamOption | null;
  rankings: RankedParticipant[];
  currentLimit: number | null;
}

export function AdminRankingClient({
  exams,
  activeExam,
  rankings,
  currentLimit,
}: AdminRankingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [limitValue, setLimitValue] = useState<string>(
    currentLimit ? currentLimit.toString() : "all"
  );
  const [isSavingLimit, setIsSavingLimit] = useState(false);

  const handleTogglePublish = (publish: boolean) => {
    if (!activeExam) return;
    const confirmMsg = publish
      ? "Publikasikan peringkat dan hasil ujian ini? Peserta akan dapat melihat posisinya."
      : "Tarik publikasi peringkat?";

    if (confirm(confirmMsg)) {
      startTransition(async () => {
        await toggleResultsPublished(activeExam.id, publish);
        router.refresh();
      });
    }
  };

  const handleSaveLimit = async () => {
    setIsSavingLimit(true);
    const limitNum = limitValue === "all" ? null : parseInt(limitValue, 10);
    try {
      // Pertahankan registrationCloseAt lama
      const res = await updateSettings(null, limitNum);
      if (res.success) {
        alert("Batas kuota peringkat berhasil diperbarui.");
        router.refresh();
      }
    } catch {
      alert("Gagal menyimpan batas kuota peringkat.");
    } finally {
      setIsSavingLimit(false);
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const top3 = rankings.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Trophy className="w-6 h-6 text-gold" />
            Verifikasi & Publikasi Peringkat
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Periksa urutan pemenang berdasarkan skor tertinggi, durasi terkecil, dan waktu submit.
          </p>
        </div>

        {/* Pemilih Ujian */}
        {exams.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="examSelect" className="text-xs text-slate-500 font-medium">
              Ujian:
            </label>
            <select
              id="examSelect"
              value={activeExam?.id ?? ""}
              onChange={(e) => router.push(`/admin/ranking?examId=${e.target.value}`)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-navy focus:outline-hidden focus:ring-2 focus:ring-navy/20 cursor-pointer"
            >
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.levelName} - {e.subjectName} ({e.resultsPublished ? "Publik" : "Draf"})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!activeExam ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          Belum ada ujian. Silakan buat ujian di menu Kelola Ujian.
        </div>
      ) : (
        <>
          {/* Kontrol Pengaturan Peringkat & Publikasi */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Status Publikasi:</span>
                <button
                  type="button"
                  onClick={() => handleTogglePublish(!activeExam.resultsPublished)}
                  disabled={isPending}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeExam.resultsPublished
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  {activeExam.resultsPublished ? "Hasil & Peringkat Terbuka" : "Terkunci (Draf)"}
                </button>
              </div>

              {/* Setting Batas Tampil Peringkat */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-700 font-semibold">Batas Tampil Peserta:</span>
                <select
                  value={limitValue}
                  onChange={(e) => setLimitValue(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800"
                >
                  <option value="all">Semua Peserta</option>
                  <option value="10">Top 10 Saja</option>
                  <option value="25">Top 25 Saja</option>
                  <option value="50">Top 50 Saja</option>
                  <option value="100">Top 100 Saja</option>
                </select>
                <button
                  type="button"
                  onClick={handleSaveLimit}
                  disabled={isSavingLimit}
                  className="px-2.5 py-1 bg-navy text-white rounded text-xs font-semibold hover:bg-navy/90 disabled:opacity-50 cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Total Peserta Selesai: <strong>{rankings.length}</strong>
            </div>
          </div>

          {/* Podium Juara 1, 2, 3 */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Juara 2 */}
              {top3[1] && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col items-center text-center shadow-xs order-2 md:order-1">
                  <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-2 font-bold text-lg border-2 border-slate-300">
                    2
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-slate-500" />
                    Peringkat 2
                  </span>
                  <h3 className="text-sm font-bold text-navy truncate w-full mb-0.5">
                    {top3[1].name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate w-full mb-2">
                    {top3[1].school}
                  </p>
                  <div className="mt-auto pt-2 border-t border-slate-100 w-full flex justify-around text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Skor</span>
                      <span className="font-bold text-navy">{top3[1].score.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Durasi</span>
                      <span className="font-medium text-slate-700">{formatDuration(top3[1].durationSeconds)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Juara 1 */}
              {top3[0] && (
                <div className="bg-gradient-to-b from-amber-50 to-white rounded-xl border-2 border-gold p-6 flex flex-col items-center text-center shadow-sm order-1 md:order-2">
                  <div className="w-14 h-14 bg-gold text-navy rounded-full flex items-center justify-center mb-2 font-extrabold text-xl shadow-xs">
                    1
                  </div>
                  <span className="text-[11px] font-bold text-gold-dark uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-gold" />
                    Juara 1
                  </span>
                  <h3 className="text-base font-bold text-navy truncate w-full mb-0.5">
                    {top3[0].name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate w-full mb-2">
                    {top3[0].school}
                  </p>
                  <div className="mt-auto pt-2 border-t border-amber-200/50 w-full flex justify-around text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Skor</span>
                      <span className="font-extrabold text-navy text-sm">{top3[0].score.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Durasi</span>
                      <span className="font-semibold text-slate-700">{formatDuration(top3[0].durationSeconds)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Juara 3 */}
              {top3[2] && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col items-center text-center shadow-xs order-3 md:order-3">
                  <div className="w-12 h-12 bg-amber-50 text-amber-800 rounded-full flex items-center justify-center mb-2 font-bold text-lg border-2 border-amber-300">
                    3
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-700" />
                    Peringkat 3
                  </span>
                  <h3 className="text-sm font-bold text-navy truncate w-full mb-0.5">
                    {top3[2].name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate w-full mb-2">
                    {top3[2].school}
                  </p>
                  <div className="mt-auto pt-2 border-t border-slate-100 w-full flex justify-around text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Skor</span>
                      <span className="font-bold text-navy">{top3[2].score.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Durasi</span>
                      <span className="font-medium text-slate-700">{formatDuration(top3[2].durationSeconds)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabel Lengkap Peringkat */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy">
                Tabel Urutan Peringkat Resmi ({rankings.length})
              </h2>
              <span className="text-xs text-slate-500">
                Pemecah seri: Skor tertinggi &rarr; Durasi tercepat &rarr; Waktu kumpul &rarr; ID
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">Rank</th>
                    <th className="py-3 px-3">Kode Peserta</th>
                    <th className="py-3 px-3">Nama Lengkap</th>
                    <th className="py-3 px-3">Asal Sekolah</th>
                    <th className="py-3 px-3 text-center">Nilai</th>
                    <th className="py-3 px-3 text-center">Benar</th>
                    <th className="py-3 px-3 text-center">Durasi</th>
                    <th className="py-3 px-3 text-center">Metode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Belum ada peserta yang mengumpulkan ujian ini.
                      </td>
                    </tr>
                  ) : (
                    rankings.map((r) => (
                      <tr key={r.attemptId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              r.rank === 1
                                ? "bg-gold text-navy"
                                : r.rank === 2
                                ? "bg-slate-200 text-slate-800"
                                : r.rank === 3
                                ? "bg-amber-100 text-amber-800"
                                : "text-slate-600"
                            }`}
                          >
                            {r.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {r.participantCode ?? "-"}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {r.name}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-xs">{r.school}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-navy">
                          {r.score.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-700">
                          {r.correctCount}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600">
                          <div className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDuration(r.durationSeconds)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-[10px] text-slate-500">
                          {r.submitReason === "TIMEOUT" ? "Waktu Habis" : "Mandiri"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
