"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  ArrowLeft,
  Medal,
  Award,
  Clock,
  User,
  School,
} from "lucide-react";

interface ExamOption {
  id: string;
  title: string;
  levelName: string;
  subjectName: string;
}

interface RankedParticipant {
  rank: number;
  attemptId: string;
  userId: string;
  name: string;
  participantCode: string | null;
  school: string;
  score: number;
  durationSeconds: number;
  submittedAt: string;
  isCurrentUser: boolean;
}

interface RankingClientProps {
  exams: ExamOption[];
  activeExam: ExamOption | null;
  rankings: RankedParticipant[];
  userRankItem: RankedParticipant | null;
  rankingLimit: number | null;
}

export function RankingClient({
  exams,
  activeExam,
  rankings,
  userRankItem,
  rankingLimit,
}: RankingClientProps) {
  const router = useRouter();

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const top3 = rankings.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
              <Trophy className="w-6 h-6 text-gold" />
              Papan Peringkat Resmi
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Peringkat olimpiade nasional berdasarkan nilai akhir dan efisiensi waktu pengerjaan.
            </p>
          </div>

          {/* Pemilih Ujian */}
          {exams.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="examSelect" className="text-xs text-slate-500 font-medium">
                Pilih Ujian:
              </label>
              <select
                id="examSelect"
                value={activeExam?.id ?? ""}
                onChange={(e) => router.push(`/dashboard/ranking?examId=${e.target.value}`)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-navy focus:outline-hidden focus:ring-2 focus:ring-navy/20 cursor-pointer"
              >
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.levelName} - {e.subjectName} ({e.title})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-navy mb-1">Belum Ada Hasil Ujian Dipublikasikan</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Panitia belum mempublikasikan hasil resmi untuk mata pelajaran manapun. Peringkat akan otomatis tampil begitu hasil telah diverifikasi dan dipublikasikan.
          </p>
        </div>
      ) : (
        <>
          {/* Banner Posisi Peserta yang Login */}
          {userRankItem ? (
            <div className="mb-6 p-4 rounded-xl bg-navy text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-navy/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold text-navy flex items-center justify-center font-bold text-sm shrink-0">
                  #{userRankItem.rank}
                </div>
                <div>
                  <div className="text-xs text-slate-300">Posisi Anda di Ujian Ini</div>
                  <div className="text-sm sm:text-base font-bold">
                    Peringkat #{userRankItem.rank} dari {rankings.length} peserta
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs sm:text-sm self-end sm:self-auto">
                <div className="text-right">
                  <div className="text-slate-300 text-xs">Nilai Akhir</div>
                  <div className="font-extrabold text-gold text-base">{userRankItem.score.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300 text-xs">Durasi</div>
                  <div className="font-semibold">{formatDuration(userRankItem.durationSeconds)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-3.5 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center gap-2 border border-slate-200">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Anda tidak terdaftar atau belum menyelesaikan ujian pada kategori ini.
              </span>
            </div>
          )}

          {/* Podium Top 3 */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Peringkat 2 */}
              {top3[1] && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center text-center shadow-xs order-2 md:order-1 relative">
                  <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-2 font-extrabold text-lg border-2 border-slate-300">
                    2
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5" />
                    Peringkat 2
                  </span>
                  <h3 className="text-sm font-bold text-navy truncate w-full mb-1">
                    {top3[1].name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate w-full mb-3">
                    {top3[1].school}
                  </p>
                  <div className="mt-auto pt-3 border-t border-slate-100 w-full flex justify-around text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Nilai</span>
                      <span className="font-bold text-navy">{top3[1].score.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Waktu</span>
                      <span className="font-medium text-slate-600">{formatDuration(top3[1].durationSeconds)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Peringkat 1 */}
              {top3[0] && (
                <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-gold p-6 flex flex-col items-center text-center shadow-md order-1 md:order-2 relative">
                  <div className="w-14 h-14 bg-gold text-navy rounded-full flex items-center justify-center mb-2 font-extrabold text-xl shadow-xs">
                    1
                  </div>
                  <span className="text-[11px] font-bold text-gold-dark uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-gold" />
                    Juara 1
                  </span>
                  <h3 className="text-base font-bold text-navy truncate w-full mb-1">
                    {top3[0].name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate w-full mb-3">
                    {top3[0].school}
                  </p>
                  <div className="mt-auto pt-3 border-t border-amber-200/50 w-full flex justify-around text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Nilai</span>
                      <span className="font-extrabold text-navy text-sm">{top3[0].score.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Waktu</span>
                      <span className="font-semibold text-slate-700">{formatDuration(top3[0].durationSeconds)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Peringkat 3 */}
              {top3[2] && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center text-center shadow-xs order-3 md:order-3 relative">
                  <div className="w-12 h-12 bg-amber-100/60 text-amber-800 rounded-full flex items-center justify-center mb-2 font-extrabold text-lg border-2 border-amber-300">
                    3
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Peringkat 3
                  </span>
                  <h3 className="text-sm font-bold text-navy truncate w-full mb-1">
                    {top3[2].name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate w-full mb-3">
                    {top3[2].school}
                  </p>
                  <div className="mt-auto pt-3 border-t border-slate-100 w-full flex justify-around text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Nilai</span>
                      <span className="font-bold text-navy">{top3[2].score.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Waktu</span>
                      <span className="font-medium text-slate-600">{formatDuration(top3[2].durationSeconds)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabel Lengkap Peringkat */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy">
                Daftar Lengkap Peringkat
              </h2>
              {rankingLimit && (
                <span className="text-xs text-slate-500">
                  Menampilkan {rankings.length} peringkat teratas
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">No</th>
                    <th className="py-3 px-4">Kode</th>
                    <th className="py-3 px-4">Nama Peserta</th>
                    <th className="py-3 px-4">Asal Sekolah</th>
                    <th className="py-3 px-4 text-center">Nilai</th>
                    <th className="py-3 px-4 text-center">Durasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankings.map((r) => (
                    <tr
                      key={r.attemptId}
                      className={`transition-colors ${
                        r.isCurrentUser
                          ? "bg-amber-50/80 font-semibold"
                          : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
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
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {r.participantCode ?? "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">{r.name}</span>
                          {r.isCurrentUser && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy text-white">
                              Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs">{r.school}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-navy">
                        {r.score.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        <div className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDuration(r.durationSeconds)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
