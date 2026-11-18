"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createExam,
  updateExam,
  changeExamStatus,
  triggerSyncExams,
} from "@/app/actions/exam-admin";
import { formatWIB } from "@/lib/date";
import {
  Plus,
  RefreshCw,
  Edit2,
  FileQuestion,
  AlertCircle,
  CheckCircle2,
  X,
  Play,
  StopCircle,
} from "lucide-react";

interface ExamItem {
  id: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  optionCount: number;
  startAt: Date | null;
  endAt: Date | null;
  shuffleQuestions: boolean;
  status: "DRAFT" | "SCHEDULED" | "CLOSED";
  levelId: string;
  subjectId: string;
  level: {
    name: string;
    code: string;
  };
  subject: {
    name: string;
  };
  _count: {
    questions: number;
    registrations: number;
  };
}

interface LevelItem {
  id: string;
  name: string;
  code: string;
}

interface SubjectItem {
  id: string;
  name: string;
}

interface ExamsClientProps {
  exams: ExamItem[];
  levels: LevelItem[];
  subjects: SubjectItem[];
}

export function ExamsClient({ exams, levels, subjects }: ExamsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSync = () => {
    startTransition(async () => {
      const res = await triggerSyncExams();
      if (res.success) {
        setSuccessMsg(`Sinkronisasi selesai. ${res.closedCount} ujian telah ditutup otomatis.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  const handleStatusChange = (examId: string, newStatus: "DRAFT" | "SCHEDULED" | "CLOSED") => {
    setErrorMsg(null);
    setValidationErrors([]);
    startTransition(async () => {
      const res = await changeExamStatus(examId, newStatus);
      if (!res.success) {
        setErrorMsg(res.error || "Gagal mengubah status ujian.");
        if (res.validationErrors) {
          setValidationErrors(res.validationErrors);
        }
      } else {
        setSuccessMsg(`Status ujian berhasil diubah menjadi ${newStatus}.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createExam(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setShowCreateModal(false);
        setSuccessMsg("Ujian baru berhasil dibuat dalam status DRAFT.");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingExam) return;
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateExam(editingExam.id, formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setEditingExam(null);
        setSuccessMsg("Parameter ujian berhasil diperbarui.");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F4B]">Kelola Ujian & Bank Soal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi parameter ujian, penjadwalan, dan pengelolaan butir soal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSync}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            Sinkronkan Status
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F4B] hover:bg-[#0B1F4B]/90 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 text-[#C9A227]" />
            Buat Ujian Baru
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          {validationErrors.length > 0 && (
            <ul className="list-disc list-inside space-y-1 pl-4 text-[11px]">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tabel Ujian */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {exams.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 italic">
            Belum ada sesi ujian yang dibuat. Klik tombol &quot;Buat Ujian Baru&quot; untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Jenjang & Mapel</th>
                  <th className="py-3 px-4">Judul Ujian</th>
                  <th className="py-3 px-4">Struktur Soal</th>
                  <th className="py-3 px-4">Jadwal Pelaksanaan (WIB)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Kelengkapan Soal</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((ex) => {
                  const isComplete = ex._count.questions === ex.questionCount;
                  return (
                    <tr key={ex.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{ex.level.name}</div>
                        <div className="text-slate-500 text-[11px]">{ex.subject.name}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#0B1F4B]">{ex.title}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>Durasi: {ex.durationMinutes} menit</div>
                        <div className="text-slate-400 text-[11px]">
                          {ex.questionCount} soal &bull; {ex.optionCount} opsi ({ex.shuffleQuestions ? "Acak" : "Urut"})
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        <div>Mulai: {ex.startAt ? formatWIB(ex.startAt, "dd/MM/yyyy HH.mm") : "-"}</div>
                        <div>Selesai: {ex.endAt ? formatWIB(ex.endAt, "dd/MM/yyyy HH.mm") : "-"}</div>
                      </td>
                      <td className="py-3 px-4">
                        {ex.status === "SCHEDULED" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                            SCHEDULED
                          </span>
                        ) : ex.status === "CLOSED" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            CLOSED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            DRAFT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              isComplete ? "text-green-700" : "text-amber-700"
                            }`}
                          >
                            {ex._count.questions} / {ex.questionCount} Soal
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {ex._count.registrations} Peserta terdaftar
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/exams/${ex.id}/questions`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[#0B1F4B] text-white rounded hover:bg-[#0B1F4B]/90 transition-colors"
                          >
                            <FileQuestion className="w-3.5 h-3.5 text-[#C9A227]" />
                            Bank Soal
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setErrorMsg(null);
                              setEditingExam(ex);
                            }}
                            className="p-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-100"
                            title="Edit Parameter Ujian"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {ex.status === "DRAFT" ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleStatusChange(ex.id, "SCHEDULED")}
                              className="px-2 py-1 text-[10px] font-semibold bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                              title="Jadwalkan Ujian"
                            >
                              <Play className="w-3 h-3" />
                              Jadwalkan
                            </button>
                          ) : ex.status === "SCHEDULED" ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleStatusChange(ex.id, "CLOSED")}
                              className="px-2 py-1 text-[10px] font-semibold bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                              title="Tutup Ujian"
                            >
                              <StopCircle className="w-3 h-3" />
                              Tutup
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Buat Ujian Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0B1F4B]">Buat Sesi Ujian Baru</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenjang Pendidikan <span className="text-red-500">*</span>
                  </label>
                  <select name="levelId" required className="w-full px-3 py-2 text-xs border rounded-lg bg-white">
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name} ({lvl.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <select name="subjectId" required className="w-full px-3 py-2 text-xs border rounded-lg bg-white">
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Ujian <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Contoh: Olimpiade Matematika SD Babak Penyisihan"
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durasi (Menit) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="durationMinutes"
                    required
                    min={1}
                    defaultValue={60}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Soal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="questionCount"
                    required
                    min={1}
                    defaultValue={30}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilihan (2-5) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="optionCount"
                    required
                    min={2}
                    max={5}
                    defaultValue={4}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jadwal Mulai</label>
                  <input
                    type="datetime-local"
                    name="startAt"
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jadwal Selesai</label>
                  <input
                    type="datetime-local"
                    name="endAt"
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="shuffleQuestions"
                    className="rounded border-slate-300 text-[#0B1F4B]"
                  />
                  <span className="text-xs text-slate-700">Acak urutan nomor soal per peserta</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0B1F4B] rounded-lg hover:bg-[#0B1F4B]/90 disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Ujian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Parameter Ujian */}
      {editingExam && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0B1F4B]">Edit Parameter Ujian</h3>
              <button
                type="button"
                onClick={() => setEditingExam(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Ujian</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingExam.title}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi (Menit)</label>
                  <input
                    type="number"
                    name="durationMinutes"
                    required
                    min={1}
                    defaultValue={editingExam.durationMinutes}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Soal</label>
                  <input
                    type="number"
                    name="questionCount"
                    required
                    min={1}
                    defaultValue={editingExam.questionCount}
                    disabled={editingExam._count.questions > 0}
                    className="w-full px-3 py-2 text-xs border rounded-lg disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilihan</label>
                  <input
                    type="number"
                    name="optionCount"
                    required
                    min={2}
                    max={5}
                    defaultValue={editingExam.optionCount}
                    disabled={editingExam._count.questions > 0}
                    className="w-full px-3 py-2 text-xs border rounded-lg disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>
              {editingExam._count.questions > 0 && (
                <p className="text-[11px] text-amber-700 italic">
                  * Target soal dan jumlah pilihan dikunci karena bank soal sudah berisi pertanyaan.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jadwal Mulai</label>
                  <input
                    type="datetime-local"
                    name="startAt"
                    defaultValue={
                      editingExam.startAt
                        ? new Date(editingExam.startAt).toISOString().slice(0, 16)
                        : ""
                    }
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jadwal Selesai</label>
                  <input
                    type="datetime-local"
                    name="endAt"
                    defaultValue={
                      editingExam.endAt
                        ? new Date(editingExam.endAt).toISOString().slice(0, 16)
                        : ""
                    }
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="shuffleQuestions"
                    defaultChecked={editingExam.shuffleQuestions}
                    className="rounded border-slate-300 text-[#0B1F4B]"
                  />
                  <span className="text-xs text-slate-700">Acak urutan nomor soal per peserta</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0B1F4B] rounded-lg hover:bg-[#0B1F4B]/90 disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
