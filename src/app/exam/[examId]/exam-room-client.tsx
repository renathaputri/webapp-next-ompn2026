"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MathRenderedText } from "@/components/math-rendered-text";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Send,
  Grid,
  X,
  Check,
} from "lucide-react";
import Link from "next/link";

interface QuestionItem {
  id: string;
  number: number;
  displayNumber: number;
  text: string;
  options: string[];
}

interface ExamRoomClientProps {
  attempt: {
    id: string;
    startedAt: string;
    endsAt: string;
  };
  exam: {
    id: string;
    title: string;
    questionCount: number;
    optionCount: number;
    subjectName: string;
    levelName: string;
  };
  questions: QuestionItem[];
  initialAnswers: Record<string, number | null>;
  serverTime: string;
}

type SaveStatus = "saved" | "saving" | "error";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export function ExamRoomClient({
  attempt,
  exam,
  questions,
  initialAnswers,
  serverTime,
}: ExamRoomClientProps) {
  // State navigasi soal (0-indexed)
  const [currentIndex, setCurrentIndex] = useState(0);

  // State jawaban { [questionId]: selectedIndex | null }
  const [answers, setAnswers] = useState<Record<string, number | null>>(initialAnswers);

  // Status sinkronisasi penyimpanan
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  // State dialog konfirmasi submit
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Drawer nomor soal pada tampilan mobile
  const [showMobileGrid, setShowMobileGrid] = useState(false);

  // Antrean autosave lokal untuk retry dengan backoff (Bab 6.5)
  const saveQueueRef = useRef<Map<string, number | null>>(new Map());
  const isFlushingRef = useRef(false);

  // Hitung selisih waktu antara server dan client
  const serverOffsetRef = useRef<number>(
    new Date(serverTime).getTime() - Date.now()
  );

  // State sisa detik timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const estimatedServerNow = Date.now() + serverOffsetRef.current;
    const end = new Date(attempt.endsAt).getTime();
    return Math.max(0, Math.floor((end - estimatedServerNow) / 1000));
  });

  // Fungsi pengiriman antrean autosave ke server
  const flushSaveQueue = useCallback(async () => {
    if (isFlushingRef.current || saveQueueRef.current.size === 0) return;

    isFlushingRef.current = true;
    setSaveStatus("saving");

    const entries = Array.from(saveQueueRef.current.entries());
    let allSucceeded = true;

    for (const [questionId, selectedIndex] of entries) {
      try {
        const res = await fetch(`/api/attempts/${attempt.id}/answer`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, selectedIndex }),
        });

        if (res.ok) {
          // Hapus dari antrean jika nilai belum berubah lagi saat request berjalan
          if (saveQueueRef.current.get(questionId) === selectedIndex) {
            saveQueueRef.current.delete(questionId);
          }
        } else {
          allSucceeded = false;
        }
      } catch {
        allSucceeded = false;
      }
    }

    isFlushingRef.current = false;

    if (allSucceeded && saveQueueRef.current.size === 0) {
      setSaveStatus("saved");
    } else {
      setSaveStatus("error");
      // Coba ulang dengan interval backoff
      setTimeout(flushSaveQueue, 2500);
    }
  }, [attempt.id]);

  // Handler saat peserta memilih opsi jawaban
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted || isSubmitting) return;

    setAnswers((prev) => {
      const currentVal = prev[questionId];
      // Bab 6.4: Klik lagi pilihan yang sama = batalkan jawaban (set null)
      const newVal = currentVal === optionIndex ? null : optionIndex;

      // Masukkan ke antrean autosave
      saveQueueRef.current.set(questionId, newVal);
      setTimeout(flushSaveQueue, 50);

      return {
        ...prev,
        [questionId]: newVal,
      };
    });
  };

  // Handler submit ujian (manual atau timeout)
  const handleSubmit = useCallback(
    async (reason: "MANUAL" | "TIMEOUT" = "MANUAL") => {
      if (isSubmitting || isSubmitted) return;
      setIsSubmitting(true);

      // Kuras sisa antrean jika ada sebelum submit
      await flushSaveQueue();

      try {
        const res = await fetch(`/api/attempts/${attempt.id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submitReason: reason }),
        });

        if (res.ok) {
          setIsSubmitted(true);
          setShowSubmitModal(false);
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.error || "Gagal mengumpulkan lembar jawaban. Silakan coba kembali.");
          setIsSubmitting(false);
        }
      } catch {
        alert("Terjadi kendala jaringan saat mengumpulkan lembar jawaban. Silakan coba kembali.");
        setIsSubmitting(false);
      }
    },
    [attempt.id, flushSaveQueue, isSubmitting, isSubmitted]
  );

  // Interval hitung mundur server-based timer
  useEffect(() => {
    if (isSubmitted) return;

    const interval = setInterval(() => {
      const estimatedServerNow = Date.now() + serverOffsetRef.current;
      const end = new Date(attempt.endsAt).getTime();
      const diff = Math.max(0, Math.floor((end - estimatedServerNow) / 1000));

      setRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
        // Auto-submit saat timer mencapai 0 (Bab 6.5 TIMEOUT)
        handleSubmit("TIMEOUT");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt.endsAt, handleSubmit, isSubmitted]);

  // Format detik menjadi HH:MM:SS
  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Hitung jumlah soal terjawab
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(
    (val) => val !== null && val !== undefined
  ).length;
  const unansweredCount = questions.length - answeredCount;

  // Layar sukses setelah pengumpulan (Bab 6.5: Nilai TIDAK ditampilkan di sini)
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Jawaban Berhasil Dikumpulkan</h1>
          <p className="text-sm text-slate-600 mb-6">
            Terima kasih telah mengikuti ujian {exam.title}. Seluruh jawaban Anda telah tersimpan dengan aman di server panitia. Nilai dan pengumuman peringkat akan dipublikasikan sesuai jadwal.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Mata Pelajaran:</span>
              <span className="font-semibold text-slate-800">{exam.subjectName}</span>
            </div>
            <div className="flex justify-between">
              <span>Jenjang:</span>
              <span className="font-semibold text-slate-800">{exam.levelName}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Soal:</span>
              <span className="font-semibold text-slate-800">{questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Soal Terjawab:</span>
              <span className="font-semibold text-emerald-700">{answeredCount}</span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="w-full inline-flex justify-center items-center py-2.5 px-4 bg-navy hover:bg-navy/90 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Kembali ke Dashboard Peserta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-gold/20">
      {/* Top Header Khusus Ruang Ujian (Fokus, Tanpa Navbar Biasa - Bab 6.4) */}
      <header className="sticky top-0 z-30 bg-navy text-white shadow-md border-b border-navy/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Info Ujian */}
          <div className="flex items-center gap-2 truncate">
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold truncate tracking-wide">{exam.title}</h1>
              <p className="text-xs text-slate-300">
                {exam.levelName} &bull; {exam.subjectName}
              </p>
            </div>
            <div className="sm:hidden truncate">
              <h1 className="text-xs font-bold truncate">{exam.title}</h1>
            </div>
          </div>

          {/* Tengah: Timer Hitung Mundur */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm sm:text-base font-bold shadow-inner ${
                remainingSeconds < 300
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse"
                  : "bg-navy-dark/70 text-gold border border-gold/30"
              }`}
            >
              <Clock className="w-4 h-4 text-gold shrink-0" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>
          </div>

          {/* Kanan: Status Simpan & Tombol Aksi */}
          <div className="flex items-center gap-2">
            {/* Indikator Status Simpan */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300">
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tersimpan
                </span>
              )}
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1 text-amber-300">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1 text-rose-300">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Mencoba lagi...
                </span>
              )}
            </div>

            {/* Tombol Grid Nomor (Mobile) */}
            <button
              type="button"
              onClick={() => setShowMobileGrid(true)}
              className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Daftar nomor soal"
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Tombol Selesai */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-gold hover:bg-gold-hover text-navy font-bold rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Selesai</span>
            </button>
          </div>
        </div>
      </header>

      {/* Kontainer Utama */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Tampilan Soal & Pilihan (Responsive & Focus) */}
        <main className="lg:col-span-8 flex flex-col">
          {currentQuestion ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex-1 flex flex-col">
              {/* Header Nomor Soal */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-navy text-white text-xs sm:text-sm font-bold rounded-md">
                    Soal No. {currentQuestion.displayNumber}
                  </span>
                  <span className="text-xs text-slate-500">
                    dari {questions.length} soal
                  </span>
                </div>

                {/* Status Jawaban Soal Ini */}
                {answers[currentQuestion.id] !== null && answers[currentQuestion.id] !== undefined ? (
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium border border-emerald-200">
                    Terjawab: Pilihan {OPTION_LETTERS[answers[currentQuestion.id]!]}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    Belum dijawab
                  </span>
                )}
              </div>

              {/* Teks Soal (Sanitized HTML + KaTeX + Responsive Image & Table) */}
              <div className="text-sm sm:text-base text-slate-800 leading-relaxed mb-8 overflow-x-auto">
                <MathRenderedText html={currentQuestion.text} />
              </div>

              {/* Daftar Pilihan Jawaban */}
              <div className="space-y-3 mb-8">
                {currentQuestion.options.slice(0, exam.optionCount).map((optionText, optIdx) => {
                  const letter = OPTION_LETTERS[optIdx];
                  const isSelected = answers[currentQuestion.id] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer group ${
                        isSelected
                          ? "bg-navy/5 border-navy ring-1 ring-navy shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                          isSelected
                            ? "bg-navy text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                        }`}
                      >
                        {letter}
                      </div>
                      <div className="flex-1 text-xs sm:text-sm text-slate-800 pt-0.5 overflow-x-auto">
                        <MathRenderedText html={optionText} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Petunjuk Membatalkan Jawaban */}
              <p className="text-[11px] text-slate-400 mb-6 italic">
                Tips: Klik kembali pada pilihan yang sedang aktif untuk mengosongkan/membatalkan jawaban.
              </p>

              {/* Tombol Navigasi Bawah */}
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-4 py-2 bg-navy hover:bg-navy/90 text-white text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="px-4 py-2 bg-gold hover:bg-gold-hover text-navy text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kumpulkan Ujian</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
              Tidak ada soal yang tersedia.
            </div>
          )}
        </main>

        {/* Kolom Kanan: Panel Grid Nomor Soal (Desktop) */}
        <aside className="hidden lg:block lg:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-22">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-navy">Nomor Soal</h2>
              <span className="text-xs text-slate-500 font-medium">
                {answeredCount} / {questions.length} Terjawab
              </span>
            </div>

            {/* Grid Tombol Nomor */}
            <div className="grid grid-cols-5 gap-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? "ring-2 ring-gold ring-offset-2 bg-navy text-white shadow-sm"
                        : isAnswered
                        ? "bg-navy/90 text-white hover:bg-navy"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    {q.displayNumber}
                    {isAnswered && !isCurrent && (
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-gold rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda Warna */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-navy inline-block" />
                <span>Terjawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />
                <span>Belum</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-navy ring-1 ring-gold inline-block" />
                <span>Aktif</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Drawer Nomor Soal (Mobile Popover) */}
      {showMobileGrid && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy">Navigasi Soal</h3>
                <p className="text-xs text-slate-500">
                  {answeredCount} dari {questions.length} soal telah terjawab
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileGrid(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 overflow-y-auto p-1 max-h-[50vh]">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowMobileGrid(false);
                    }}
                    className={`h-11 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center ${
                      isCurrent
                        ? "ring-2 ring-gold ring-offset-1 bg-navy text-white"
                        : isAnswered
                        ? "bg-navy/90 text-white"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {q.displayNumber}
                    {isAnswered && !isCurrent && (
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-gold rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-around text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-navy inline-block" />
                <span>Terjawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />
                <span>Belum</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-navy ring-1 ring-gold inline-block" />
                <span>Sedang dibuka</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pengumpulan Ujian (Bab 6.4) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-navy mb-2">Konfirmasi Pengumpulan</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              Apakah Anda yakin ingin mengakhiri dan mengumpulkan lembar jawaban ujian ini?
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-slate-700">
                <span>Soal telah dijawab:</span>
                <span className="font-bold text-emerald-700">{answeredCount} soal</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Soal belum dijawab:</span>
                <span className={`font-bold ${unansweredCount > 0 ? "text-amber-600" : "text-slate-500"}`}>
                  {unansweredCount} soal
                </span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Masih terdapat {unansweredCount} soal yang belum Anda jawab. Soal yang dikosongkan bernilai 0 (tanpa sistem minus).
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-500 mb-6 italic">
              Setelah lembar jawaban dikumpulkan, Anda tidak dapat mengubah atau mengisi jawaban lagi.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Kembali Mengerjakan
              </button>
              <button
                type="button"
                onClick={() => handleSubmit("MANUAL")}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gold hover:bg-gold-hover text-navy rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengumpulkan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Ya, Kumpulkan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
