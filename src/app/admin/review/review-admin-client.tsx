"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleDiscussionOpen } from "@/app/actions/exam-admin";
import { BookOpen, Lock, Unlock, AlertCircle } from "lucide-react";
import { formatWIB } from "@/lib/date";

interface ExamReviewItem {
  id: string;
  title: string;
  levelName: string;
  subjectName: string;
  status: string;
  startAt: string | null;
  endAt: string | null;
  discussionOpen: boolean;
  canOpen: boolean;
  lockedReason: string;
  questionCount: number;
  registrationCount: number;
}

interface AdminReviewClientProps {
  exams: ExamReviewItem[];
}

export function AdminReviewClient({ exams }: AdminReviewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = (exam: ExamReviewItem, targetState: boolean) => {
    if (targetState && !exam.canOpen) {
      alert(`Tidak dapat membuka pembahasan: ${exam.lockedReason}`);
      return;
    }

    const actionText = targetState ? "MEMBUKA" : "MENUTUP";
    if (confirm(`Apakah Anda yakin ingin ${actionText} akses pembahasan soal untuk ${exam.title}?`)) {
      startTransition(async () => {
        const res = await toggleDiscussionOpen(exam.id, targetState);
        if (res.error) {
          alert(res.error);
        } else {
          router.refresh();
        }
      });
    }
  };

  const handleOpenAllEligible = () => {
    const eligible = exams.filter((e) => e.canOpen && !e.discussionOpen);
    if (eligible.length === 0) {
      alert("Tidak ada ujian yang memenuhi syarat untuk dibuka pembahasannya saat ini.");
      return;
    }

    if (confirm(`Buka pembahasan untuk ${eligible.length} ujian yang telah selesai?`)) {
      startTransition(async () => {
        for (const e of eligible) {
          await toggleDiscussionOpen(e.id, true);
        }
        alert(`Berhasil membuka pembahasan untuk ${eligible.length} ujian.`);
        router.refresh();
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-gold" />
            Kelola Akses Pembahasan Soal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Atur publikasi kunci jawaban dan pembahasan soal untuk peserta yang telah menyelesaikan ujian.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAllEligible}
          disabled={isPending}
          className="px-4 py-2 bg-navy hover:bg-navy/90 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-xs disabled:opacity-50"
        >
          Buka Semua Pembahasan yang Siap
        </button>
      </div>

      {/* Info Aturan Bab 8 */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-navy" />
          Aturan Keamanan Akses Pembahasan (Bab 8 PRD):
        </div>
        <p>
          Pembahasan soal <strong>HANYA BISA DIBUKA</strong> jika status ujian sudah <strong>CLOSED</strong> dan jadwal selesai (<code>endAt</code>) telah berakhir secara real-time. Peserta yang menyelesaikan ujian lebih awal tetap tidak dapat membaca kunci jawaban sampai seluruh periode ujian ditutup.
        </p>
      </div>

      {/* Tabel Ujian */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy">
            Daftar Ujian ({exams.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Jenjang & Mapel</th>
                <th className="py-3 px-4">Status Ujian</th>
                <th className="py-3 px-4">Jadwal Selesai</th>
                <th className="py-3 px-4 text-center">Soal</th>
                <th className="py-3 px-4 text-center">Peserta</th>
                <th className="py-3 px-4 text-center">Akses Pembahasan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada ujian.
                  </td>
                </tr>
              ) : (
                exams.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{e.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {e.levelName} &bull; {e.subjectName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.status === "SCHEDULED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : e.status === "CLOSED"
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {e.endAt ? formatWIB(new Date(e.endAt)) : "-"}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">
                      {e.questionCount}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">
                      {e.registrationCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {e.discussionOpen ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Unlock className="w-3 h-3" />
                          Terbuka
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          <Lock className="w-3 h-3" />
                          Terkunci
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {e.discussionOpen ? (
                        <button
                          type="button"
                          onClick={() => handleToggle(e, false)}
                          disabled={isPending}
                          className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Tutup
                        </button>
                      ) : (
                        <div>
                          <button
                            type="button"
                            onClick={() => handleToggle(e, true)}
                            disabled={isPending || !e.canOpen}
                            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                              e.canOpen
                                ? "bg-navy hover:bg-navy/90 text-white cursor-pointer shadow-xs"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            }`}
                          >
                            Buka
                          </button>
                          {!e.canOpen && (
                            <div className="text-[10px] text-slate-400 mt-1 max-w-[120px] mx-auto truncate" title={e.lockedReason}>
                              {e.lockedReason}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
