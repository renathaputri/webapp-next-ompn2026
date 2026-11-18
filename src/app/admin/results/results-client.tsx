"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleResultsPublished,
  triggerFinalizeExpiredAttempts,
  recalculateExamScores,
} from "@/app/actions/exam-admin";
import {
  Award,
  Download,
  RefreshCw,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface ExamItem {
  id: string;
  title: string;
  levelName: string;
  subjectName: string;
  questionCount: number;
  resultsPublished: boolean;
  discussionOpen: boolean;
  status: string;
  registrationCount: number;
}

interface AttemptItem {
  id: string;
  rank: number | null;
  startedAt: string;
  endsAt: string;
  submittedAt: string | null;
  status: string;
  submitReason: string | null;
  correctCount: number | null;
  score: number | null;
  durationSeconds: number | null;
  user: {
    id: string;
    name: string;
    participantCode: string | null;
    school: string;
    city: string;
  };
}

interface ResultsClientProps {
  exams: ExamItem[];
  activeExam: {
    id: string;
    title: string;
    levelName: string;
    subjectName: string;
    questionCount: number;
    resultsPublished: boolean;
    discussionOpen: boolean;
    status: string;
  } | null;
  attempts: AttemptItem[];
  expiredCount: number;
}

export function ResultsClient({
  exams,
  activeExam,
  attempts,
  expiredCount,
}: ResultsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const handleTogglePublish = (publish: boolean) => {
    if (!activeExam) return;
    const confirmMsg = publish
      ? "Apakah Anda yakin ingin MEMPUBLIKASIKAN hasil ujian ini? Peserta akan dapat melihat nilai dan peringkatnya."
      : "Apakah Anda yakin ingin MENARIK KEMBALI publikasi hasil ujian ini?";

    if (confirm(confirmMsg)) {
      startTransition(async () => {
        await toggleResultsPublished(activeExam.id, publish);
        router.refresh();
      });
    }
  };

  const handleFinalizeExpired = () => {
    if (!activeExam) return;
    if (confirm(`Finalisasi ${expiredCount} attempt kedaluwarsa untuk ujian ini?`)) {
      startTransition(async () => {
        const res = await triggerFinalizeExpiredAttempts(activeExam.id);
        if (res.success) {
          alert(`Berhasil memfinalisasi ${res.finalizedCount} attempt.`);
          router.refresh();
        }
      });
    }
  };

  const handleRecalculate = () => {
    if (!activeExam) return;
    if (confirm("Hitung ulang seluruh nilai peserta pada ujian ini berdasarkan kunci jawaban terbaru?")) {
      startTransition(async () => {
        const res = await recalculateExamScores(activeExam.id);
        if (res.success) {
          alert(`Berhasil menghitung ulang nilai untuk ${res.recalculatedCount} peserta.`);
          router.refresh();
        } else if (res.error) {
          alert(res.error);
        }
      });
    }
  };

  const filteredAttempts = attempts.filter((att) => {
    const q = searchQuery.toLowerCase();
    return (
      att.user.name.toLowerCase().includes(q) ||
      att.user.school.toLowerCase().includes(q) ||
      (att.user.participantCode && att.user.participantCode.toLowerCase().includes(q))
    );
  });

  const formatDuration = (totalSecs: number | null) => {
    if (totalSecs === null || totalSecs === undefined) return "-";
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Award className="w-6 h-6 text-gold" />
            Nilai & Rekapitulasi Ujian
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola hasil penilaian peserta, hitung ulang skor, dan ekspor data nilai serta jawaban.
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
              onChange={(e) => router.push(`/admin/results?examId=${e.target.value}`)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-navy focus:outline-hidden focus:ring-2 focus:ring-navy/20 cursor-pointer"
            >
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.levelName} - {e.subjectName} ({e.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!activeExam ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          Belum ada data ujian yang dibuat. Silakan buat ujian terlebih dahulu di menu Kelola Ujian.
        </div>
      ) : (
        <>
          {/* Peringatan Attempt Kedaluwarsa */}
          {expiredCount > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-amber-900 text-xs sm:text-sm font-medium">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Terdapat <strong>{expiredCount} attempt peserta</strong> yang telah melewati batas waktu pengerjaan tetapi belum difinalisasi.
                </span>
              </div>
              <button
                type="button"
                onClick={handleFinalizeExpired}
                disabled={isPending}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
              >
                Finalisasi {expiredCount} Attempt
              </button>
            </div>
          )}

          {/* Bar Aksi Utama */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Saklar Publikasi Hasil */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-600 font-semibold">Publikasi Hasil:</span>
                <button
                  type="button"
                  onClick={() => handleTogglePublish(!activeExam.resultsPublished)}
                  disabled={isPending}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    activeExam.resultsPublished
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  {activeExam.resultsPublished ? "Dipublikasikan" : "Tertutup (Draf)"}
                </button>
              </div>

              {/* Tombol Hitung Ulang Skor */}
              <button
                type="button"
                onClick={handleRecalculate}
                disabled={isPending}
                className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
                <span>Hitung Ulang Nilai</span>
              </button>
            </div>

            {/* Menu Ekspor Data */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportDropdownOpen((prev) => !prev)}
                className="px-4 py-2 bg-navy hover:bg-navy/90 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-gold" />
                <span>Ekspor Data</span>
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-20 text-xs space-y-1">
                  <div className="px-3 py-1.5 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                    Rekapitulasi Nilai
                  </div>
                  <a
                    href={`/api/admin/export/results?examId=${activeExam.id}&format=csv`}
                    className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium"
                    onClick={() => setExportDropdownOpen(false)}
                  >
                    Rekap Nilai (CSV)
                  </a>
                  <a
                    href={`/api/admin/export/results?examId=${activeExam.id}&format=xlsx`}
                    className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium"
                    onClick={() => setExportDropdownOpen(false)}
                  >
                    Rekap Nilai (Excel .xlsx)
                  </a>

                  <div className="px-3 py-1.5 font-bold text-slate-400 uppercase text-[10px] tracking-wider pt-2 border-t border-slate-100">
                    Matriks Jawaban Peserta
                  </div>
                  <a
                    href={`/api/admin/export/answers?examId=${activeExam.id}&format=csv&mode=wide`}
                    className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium"
                    onClick={() => setExportDropdownOpen(false)}
                  >
                    Matriks Jawaban (Format Lebar CSV)
                  </a>
                  <a
                    href={`/api/admin/export/answers?examId=${activeExam.id}&format=xlsx&mode=wide`}
                    className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium"
                    onClick={() => setExportDropdownOpen(false)}
                  >
                    Matriks Jawaban (Format Lebar Excel)
                  </a>
                  <a
                    href={`/api/admin/export/answers?examId=${activeExam.id}&format=xlsx&mode=long`}
                    className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium"
                    onClick={() => setExportDropdownOpen(false)}
                  >
                    Detail Jawaban (Format Panjang Excel)
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Tabel Hasil Peserta */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-navy">
                  Daftar Pengerjaan Peserta ({attempts.length})
                </h2>
              </div>

              {/* Pencarian */}
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama, kode, sekolah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-navy"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">Rank</th>
                    <th className="py-3 px-3">Kode</th>
                    <th className="py-3 px-3">Nama Lengkap</th>
                    <th className="py-3 px-3">Asal Sekolah</th>
                    <th className="py-3 px-3 text-center">Benar</th>
                    <th className="py-3 px-3 text-center">Nilai</th>
                    <th className="py-3 px-3 text-center">Durasi</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Tidak ada data pengerjaan peserta.
                      </td>
                    </tr>
                  ) : (
                    filteredAttempts.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          {att.rank ?? "-"}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {att.user.participantCode ?? "-"}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {att.user.name}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="truncate max-w-[200px] block">
                            {att.user.school}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-700">
                          {att.correctCount !== null ? `${att.correctCount} / ${activeExam.questionCount}` : "-"}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-navy">
                          {att.score !== null ? att.score.toFixed(2) : "-"}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600">
                          {formatDuration(att.durationSeconds)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {att.status === "SUBMITTED" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Selesai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Berlangsung
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-[11px] text-slate-500">
                          {att.submitReason ?? "-"}
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
