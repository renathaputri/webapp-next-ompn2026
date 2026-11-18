"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  saveQuestion,
  deleteQuestion,
  importQuestionsCsv,
  type CsvRowData,
} from "@/app/actions/question-admin";
import { validateExamForSchedule } from "@/lib/exam-validation";
import { TiptapEditor } from "@/components/tiptap-editor";
import { MathRenderedText } from "@/components/math-rendered-text";
import Papa from "papaparse";
import {
  ArrowLeft,
  Upload,
  Download,
  ShieldAlert,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
} from "lucide-react";

interface QuestionItem {
  id: string;
  number: number;
  text: string;
  options: string[] | unknown;
  correctIndex: number;
  explanation: string;
}

interface ExamDetail {
  id: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  optionCount: number;
  status: string;
  level: {
    name: string;
    code: string;
  };
  subject: {
    name: string;
  };
  questions: QuestionItem[];
}

interface QuestionsClientProps {
  exam: ExamDetail;
}

export function QuestionsClient({ exam }: QuestionsClientProps) {
  const [isPending, startTransition] = useTransition();

  // Status & Notifikasi
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    tested: boolean;
    isValid: boolean;
    errors: string[];
  }>({ tested: false, isValid: false, errors: [] });

  // Modal Editor Soal
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editorNumber, setEditorNumber] = useState<number>(1);
  const [editorText, setEditorText] = useState<string>("");
  const [editorOptions, setEditorOptions] = useState<string[]>(
    Array(exam.optionCount).fill("")
  );
  const [editorCorrectIndex, setEditorCorrectIndex] = useState<number>(0);
  const [editorExplanation, setEditorExplanation] = useState<string>("");

  // Modal Impor CSV
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvRowData[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvOverwrite, setCsvOverwrite] = useState(true);

  // Map soal yang sudah ada berdasarkan nomor (1..N)
  const questionMap = new Map<number, QuestionItem>();
  exam.questions.forEach((q) => questionMap.set(q.number, q));

  // Daftar nomor lengkap 1..questionCount
  const allNumbers = Array.from({ length: exam.questionCount }, (_, i) => i + 1);

  const handleOpenCreateForNumber = (num: number) => {
    setErrorMsg(null);
    const existing = questionMap.get(num);
    setEditorNumber(num);
    if (existing) {
      setEditorText(existing.text);
      const opts = Array.isArray(existing.options)
        ? (existing.options as string[])
        : Array(exam.optionCount).fill("");
      setEditorOptions(
        opts.length === exam.optionCount
          ? opts
          : Array.from({ length: exam.optionCount }, (_, i) => opts[i] || "")
      );
      setEditorCorrectIndex(existing.correctIndex);
      setEditorExplanation(existing.explanation);
    } else {
      setEditorText("");
      setEditorOptions(Array(exam.optionCount).fill(""));
      setEditorCorrectIndex(0);
      setEditorExplanation("");
    }
    setShowEditorModal(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorText.trim()) {
      setErrorMsg("Teks pertanyaan soal tidak boleh kosong.");
      return;
    }

    startTransition(async () => {
      const res = await saveQuestion(
        exam.id,
        editorNumber,
        editorText,
        editorOptions,
        editorCorrectIndex,
        editorExplanation
      );

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setShowEditorModal(false);
        setSuccessMsg(`Soal nomor ${editorNumber} berhasil disimpan.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  const handleDelete = (questionId: string, number: number) => {
    if (confirm(`Apakah Anda yakin ingin menghapus butir soal nomor ${number}?`)) {
      startTransition(async () => {
        const res = await deleteQuestion(exam.id, questionId);
        if (res.success) {
          setSuccessMsg(`Soal nomor ${number} berhasil dihapus.`);
          setTimeout(() => setSuccessMsg(null), 3000);
        }
      });
    }
  };

  const handleCheckValidation = () => {
    startTransition(async () => {
      const res = await validateExamForSchedule(exam.id);
      setValidationResult({
        tested: true,
        isValid: res.isValid,
        errors: res.errors,
      });
    });
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvErrors([]);
    setCsvRows([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows: CsvRowData[] = [];
        const parseErrors: string[] = [];

        (results.data as Record<string, string>[]).forEach((row, idx) => {
          const rowNum = idx + 2; // header baris 1
          const number = parseInt(row.nomor, 10);
          if (isNaN(number) || number < 1 || number > exam.questionCount) {
            parseErrors.push(`Baris ${rowNum}: Nomor soal '${row.nomor}' tidak valid (harus 1..${exam.questionCount}).`);
            return;
          }

          const text = (row.pertanyaan || "").trim();
          if (!text) {
            parseErrors.push(`Baris ${rowNum}: Teks pertanyaan kosong.`);
            return;
          }

          // Baca kolom pilihan sesuai exam.optionCount: a, b, c, ...
          const options: string[] = [];
          for (let i = 0; i < exam.optionCount; i++) {
            const letter = String.fromCharCode(97 + i); // a, b, c, ...
            const val = (row[letter] || row[letter.toUpperCase()] || "").trim();
            if (!val) {
              parseErrors.push(`Baris ${rowNum}: Pilihan ${letter.toUpperCase()} masih kosong.`);
            }
            options.push(val);
          }

          // Baca kunci jawaban (huruf A..Z)
          const kunciStr = (row.kunci || "").trim().toUpperCase();
          const correctIdx = kunciStr.charCodeAt(0) - 65; // A -> 0, B -> 1
          if (correctIdx < 0 || correctIdx >= exam.optionCount) {
            parseErrors.push(`Baris ${rowNum}: Kunci '${row.kunci}' tidak valid. Harus antara A hingga ${String.fromCharCode(64 + exam.optionCount)}.`);
            return;
          }

          const explanation = (row.pembahasan || "").trim();

          parsedRows.push({
            number,
            text,
            options,
            correctIndex: correctIdx,
            explanation,
          });
        });

        setCsvRows(parsedRows);
        setCsvErrors(parseErrors);
      },
      error: () => {
        setCsvErrors(["Gagal membaca file CSV. Pastikan format berkas valid."]);
      },
    });
  };

  const handleConfirmImport = () => {
    if (csvRows.length === 0) return;
    startTransition(async () => {
      const res = await importQuestionsCsv(exam.id, csvRows, csvOverwrite);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setShowCsvModal(false);
        setSuccessMsg(
          `Impor berhasil! ${res.importedCount} soal disimpan (${res.skippedCount} dilewati).`
        );
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/exams"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B1F4B] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Daftar Ujian
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0B1F4B]">{exam.title}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
              {exam.status}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {exam.level.name} &bull; {exam.subject.name} &bull; Target: {exam.questionCount} Soal &bull; {exam.optionCount} Opsi Pilihan &bull; Terisi: {exam.questions.length} Soal
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCheckValidation}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Uji Kesiapan Ujian
          </button>

          <a
            href={`/api/admin/exams/${exam.id}/csv-template`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Template CSV
          </a>

          <button
            type="button"
            onClick={() => {
              setCsvErrors([]);
              setCsvRows([]);
              setShowCsvModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Impor Soal CSV
          </button>
        </div>
      </div>

      {/* Pesan Sukses / Error */}
      {successMsg && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hasil Uji Kesiapan Ujian */}
      {validationResult.tested && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-2 ${
            validationResult.isValid
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {validationResult.isValid ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Bank Soal Siap Dijadwalkan!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Ujian Belum Siap Dijadwalkan (Terdapat Masalah):</span>
              </>
            )}
          </div>
          {validationResult.errors.length > 0 && (
            <ul className="list-disc list-inside space-y-1 pl-2 text-[11px]">
              {validationResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Grid Nomor Soal (1..N) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0B1F4B]">Navigasi Nomor Butir Soal (1..{exam.questionCount})</h2>
          <span className="text-xs text-slate-500">
            Klik nomor untuk membuat atau menyunting soal
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {allNumbers.map((num) => {
            const hasQuestion = questionMap.has(num);
            return (
              <button
                key={num}
                type="button"
                onClick={() => handleOpenCreateForNumber(num)}
                className={`w-10 h-10 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                  hasQuestion
                    ? "bg-[#0B1F4B] text-white border-[#0B1F4B] hover:bg-[#0B1F4B]/90"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400 hover:bg-slate-100"
                }`}
              >
                <span>{num}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daftar Tampilan Butir Soal */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#0B1F4B]">Daftar Soal yang Telah Terisi</h2>

        {exam.questions.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500 italic">
            Belum ada soal yang diinput. Klik kotak nomor di atas atau gunakan fitur &quot;Impor Soal CSV&quot;.
          </div>
        ) : (
          <div className="space-y-4">
            {exam.questions.map((q) => {
              const options = Array.isArray(q.options) ? (q.options as string[]) : [];
              return (
                <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-[#0B1F4B] font-bold text-xs rounded-md">
                      <FileText className="w-3.5 h-3.5" />
                      Nomor {q.number}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenCreateForNumber(q.number)}
                        className="p-1.5 text-slate-600 hover:text-[#0B1F4B] rounded border border-slate-200 hover:bg-slate-50 text-xs inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id, q.number)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 text-xs inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </div>
                  </div>

                  {/* Pertanyaan */}
                  <div className="text-sm">
                    <MathRenderedText html={q.text} />
                  </div>

                  {/* Pilihan Jawaban */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {options.map((opt, idx) => {
                      const isCorrect = idx === q.correctIndex;
                      const letter = String.fromCharCode(65 + idx);
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                            isCorrect
                              ? "bg-green-50 border-green-300 text-green-900 font-medium"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                              isCorrect
                                ? "bg-green-600 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {letter}
                          </span>
                          <div className="flex-1">
                            <MathRenderedText html={opt} />
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-semibold">
                              Kunci
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pembahasan */}
                  {q.explanation && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <span className="font-semibold text-slate-600 block text-[11px] uppercase tracking-wider">
                        Pembahasan:
                      </span>
                      <MathRenderedText html={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Editor Soal (Tiptap) */}
      {showEditorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0B1F4B]">
                Editor Butir Soal Nomor {editorNumber}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              {/* Nomor Soal */}
              <div className="w-48">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Soal
                </label>
                <select
                  value={editorNumber}
                  onChange={(e) => handleOpenCreateForNumber(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white"
                >
                  {allNumbers.map((n) => (
                    <option key={n} value={n}>
                      Nomor {n} {questionMap.has(n) ? "(Sudah terisi)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teks Pertanyaan (dengan tombol gambar) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teks Pertanyaan Soal (Boleh gambar & rumus KaTeX) <span className="text-red-500">*</span>
                </label>
                <TiptapEditor
                  content={editorText}
                  onChange={setEditorText}
                  allowImage={true}
                />
              </div>

              {/* Pilihan Jawaban (A..Z sesuai optionCount, tanpa gambar) */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Opsi Pilihan Jawaban ({exam.optionCount} Pilihan) & Pilih Kunci yang Benar <span className="text-red-500">*</span>
                </label>

                {editorOptions.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isChecked = editorCorrectIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border space-y-2 ${
                        isChecked ? "border-green-400 bg-green-50/40" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="correctIndex"
                            checked={isChecked}
                            onChange={() => setEditorCorrectIndex(idx)}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <span className="font-bold text-xs text-slate-800">
                            Pilihan {letter} {isChecked ? "(Kunci Jawaban)" : ""}
                          </span>
                        </label>
                      </div>

                      <TiptapEditor
                        content={opt}
                        onChange={(val) => {
                          const updated = [...editorOptions];
                          updated[idx] = val;
                          setEditorOptions(updated);
                        }}
                        allowImage={false}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Pembahasan (tanpa gambar) */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pembahasan Soal (Teks & rumus KaTeX, tanpa gambar) <span className="text-red-500">*</span>
                </label>
                <TiptapEditor
                  content={editorExplanation}
                  onChange={setEditorExplanation}
                  allowImage={false}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0B1F4B] rounded-lg hover:bg-[#0B1F4B]/90 disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Butir Soal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Impor Soal CSV */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0B1F4B]">Impor Butir Soal dari CSV</h3>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Unggah berkas CSV sesuai format template ({exam.optionCount} pilihan jawaban: A, B, C, ...). Rumus matematika dapat ditulis menggunakan format LaTeX <code>$...$</code>.
              </p>

              <div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0B1F4B] file:text-white hover:file:bg-[#0B1F4B]/90"
                />
              </div>

              {csvErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg space-y-1">
                  <span className="font-bold block">Terdapat kesalahan validasi CSV:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] max-h-32 overflow-y-auto">
                    {csvErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {csvRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <span>Pratinjau ({csvRows.length} Soal Siap Diimpor)</span>
                    <label className="flex items-center gap-1.5 font-normal cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={csvOverwrite}
                        onChange={(e) => setCsvOverwrite(e.target.checked)}
                        className="rounded border-slate-300 text-[#0B1F4B]"
                      />
                      <span>Timpa nomor soal yang sudah ada</span>
                    </label>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">Pertanyaan</th>
                          <th className="py-2 px-3">Kunci</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvRows.map((r, i) => (
                          <tr key={i}>
                            <td className="py-1.5 px-3 font-bold text-[#0B1F4B]">{r.number}</td>
                            <td className="py-1.5 px-3 truncate max-w-xs">{r.text}</td>
                            <td className="py-1.5 px-3 font-semibold text-green-700">
                              {String.fromCharCode(65 + r.correctIndex)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPending || csvRows.length === 0 || csvErrors.length > 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0B1F4B] rounded-lg hover:bg-[#0B1F4B]/90 disabled:opacity-50"
                >
                  {isPending ? "Mengimpor..." : `Konfirmasi Impor (${csvRows.length} Soal)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
