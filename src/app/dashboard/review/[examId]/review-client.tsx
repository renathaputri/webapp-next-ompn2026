"use client";

import { useState } from "react";
import Link from "next/link";
import { MathRenderedText } from "@/components/math-rendered-text";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Filter,
} from "lucide-react";

interface ReviewQuestionItem {
  id: string;
  number: number;
  displayNumber: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ReviewClientProps {
  exam: {
    id: string;
    title: string;
    levelName: string;
    subjectName: string;
    questionCount: number;
    optionCount: number;
  };
  questions: ReviewQuestionItem[];
  answers: Record<string, number | null>;
  score: number;
  correctCount: number;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export function ReviewClient({
  exam,
  questions,
  answers,
  score,
  correctCount,
}: ReviewClientProps) {
  const [activeFilter, setActiveFilter] = useState<"ALL" | "CORRECT" | "WRONG" | "EMPTY">("ALL");

  // Hitung statistik
  const wrongCount = questions.filter((q) => {
    const ans = answers[q.id];
    return ans !== null && ans !== undefined && ans !== q.correctIndex;
  }).length;

  const emptyCount = questions.filter((q) => {
    const ans = answers[q.id];
    return ans === null || ans === undefined;
  }).length;

  // Filter soal
  const filteredQuestions = questions.filter((q) => {
    const ans = answers[q.id];
    const isAnswered = ans !== null && ans !== undefined;
    const isCorrect = isAnswered && ans === q.correctIndex;

    if (activeFilter === "CORRECT") return isCorrect;
    if (activeFilter === "WRONG") return isAnswered && !isCorrect;
    if (activeFilter === "EMPTY") return !isAnswered;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Navigasi */}
      <div className="mb-6">
        <Link
          href={`/dashboard/result/${exam.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Hasil Ujian
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-navy">Pembahasan Soal</h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {exam.title} &bull; {exam.levelName} - {exam.subjectName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-navy/5 border border-navy/20 rounded-lg text-xs">
              <span className="text-slate-500">Nilai: </span>
              <span className="font-bold text-navy">{score.toFixed(2)}</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
              <span className="text-emerald-700 font-semibold">{correctCount} Benar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        <button
          type="button"
          onClick={() => setActiveFilter("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeFilter === "ALL"
              ? "bg-navy text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Semua ({questions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("CORRECT")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeFilter === "CORRECT"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          Benar ({correctCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("WRONG")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeFilter === "WRONG"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white border border-slate-200 text-rose-700 hover:bg-rose-50"
          }`}
        >
          Salah ({wrongCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("EMPTY")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeFilter === "EMPTY"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white border border-slate-200 text-amber-700 hover:bg-amber-50"
          }`}
        >
          Kosong ({emptyCount})
        </button>
      </div>

      {/* Daftar Soal & Pembahasan */}
      <div className="space-y-6">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            Tidak ada soal untuk filter ini.
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const userChoice = answers[q.id];
            const isAnswered = userChoice !== null && userChoice !== undefined;
            const isCorrect = isAnswered && userChoice === q.correctIndex;

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden"
              >
                {/* Header Kartu Soal */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-navy text-white text-xs font-bold rounded-md">
                      Soal No. {q.displayNumber}
                    </span>
                  </div>

                  {/* Status Jawaban Peserta */}
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Jawaban Benar
                    </span>
                  ) : isAnswered ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
                      <XCircle className="w-3.5 h-3.5" />
                      Jawaban Salah
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Tidak Dijawab
                    </span>
                  )}
                </div>

                {/* Teks Soal */}
                <div className="text-sm sm:text-base text-slate-800 leading-relaxed mb-6 overflow-x-auto">
                  <MathRenderedText html={q.text} />
                </div>

                {/* Pilihan Jawaban */}
                <div className="space-y-2.5 mb-6">
                  {q.options.slice(0, exam.optionCount).map((optionText, optIdx) => {
                    const letter = OPTION_LETTERS[optIdx];
                    const isKey = optIdx === q.correctIndex;
                    const isUserChoice = userChoice === optIdx;

                    let optionBorderClass = "border-slate-200 bg-white text-slate-700";
                    let badgeNode = null;

                    if (isKey) {
                      optionBorderClass = "border-emerald-300 bg-emerald-50/70 text-emerald-950 font-medium";
                      badgeNode = (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                          Kunci Jawaban
                        </span>
                      );
                    } else if (isUserChoice) {
                      optionBorderClass = "border-rose-300 bg-rose-50/70 text-rose-950 font-medium";
                      badgeNode = (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded shrink-0">
                          Pilihan Anda (Salah)
                        </span>
                      );
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs sm:text-sm ${optionBorderClass}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isKey
                              ? "bg-emerald-600 text-white"
                              : isUserChoice
                              ? "bg-rose-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {letter}
                        </div>
                        <div className="flex-1 overflow-x-auto pt-0.5">
                          <MathRenderedText html={optionText} />
                        </div>
                        {badgeNode}
                      </div>
                    );
                  })}
                </div>

                {/* Kotak Pembahasan */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-navy mb-2">
                    <BookOpen className="w-4 h-4 text-gold" />
                    <span>Pembahasan:</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed overflow-x-auto">
                    <MathRenderedText html={q.explanation} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Navigasi */}
      <div className="mt-8 text-center">
        <Link
          href={`/dashboard/result/${exam.id}`}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-navy hover:bg-navy/90 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Halaman Hasil Ujian
        </Link>
      </div>
    </div>
  );
}
