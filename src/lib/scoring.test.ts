import { describe, it, expect } from "vitest";
import { gradeAttempt } from "./scoring";

describe("gradeAttempt - Sistem Penilaian Ujian OMPN2026 (Bab 6.6)", () => {
  it("menghitung nilai dengan benar untuk ujian 30 butir soal", () => {
    // Buat 30 pertanyaan tiruan dengan kunci jawaban indeks 0 (Pilihan A)
    const questions = Array.from({ length: 30 }, (_, i) => ({
      id: `q-${i + 1}`,
      correctIndex: 0,
    }));

    // Kasus 30/30 benar = 100.00
    const allCorrect = questions.map((q) => ({
      questionId: q.id,
      selectedIndex: 0,
    }));
    expect(gradeAttempt(30, questions, allCorrect)).toEqual({
      correctCount: 30,
      score: 100,
    });

    // Kasus 25/30 benar = 83.33
    const correct25 = questions.map((q, i) => ({
      questionId: q.id,
      selectedIndex: i < 25 ? 0 : 1, // 5 salah
    }));
    expect(gradeAttempt(30, questions, correct25)).toEqual({
      correctCount: 25,
      score: 83.33,
    });

    // Kasus 20/30 benar = 66.67
    const correct20 = questions.map((q, i) => ({
      questionId: q.id,
      selectedIndex: i < 20 ? 0 : 1, // 10 salah
    }));
    expect(gradeAttempt(30, questions, correct20)).toEqual({
      correctCount: 20,
      score: 66.67,
    });

    // Kasus 15/30 benar = 50.00
    const correct15 = questions.map((q, i) => ({
      questionId: q.id,
      selectedIndex: i < 15 ? 0 : 1, // 15 salah
    }));
    expect(gradeAttempt(30, questions, correct15)).toEqual({
      correctCount: 15,
      score: 50,
    });

    // Kasus 10/30 benar = 33.33
    const correct10 = questions.map((q, i) => ({
      questionId: q.id,
      selectedIndex: i < 10 ? 0 : 1, // 20 salah
    }));
    expect(gradeAttempt(30, questions, correct10)).toEqual({
      correctCount: 10,
      score: 33.33,
    });

    // Kasus 0/30 benar = 0.00
    const allWrong = questions.map((q) => ({
      questionId: q.id,
      selectedIndex: 2, // Semua salah
    }));
    expect(gradeAttempt(30, questions, allWrong)).toEqual({
      correctCount: 0,
      score: 0,
    });
  });

  it("menghitung nilai dengan benar untuk ujian 20 butir soal (7/20 = 35.00)", () => {
    const questions = Array.from({ length: 20 }, (_, i) => ({
      id: `q20-${i + 1}`,
      correctIndex: 1, // Kunci pilihan B
    }));

    // 7 benar, 13 salah atau kosong
    const answers = questions.map((q, i) => ({
      questionId: q.id,
      selectedIndex: i < 7 ? 1 : null,
    }));

    expect(gradeAttempt(20, questions, answers)).toEqual({
      correctCount: 7,
      score: 35,
    });
  });

  it("menangani jawaban kosong (null / undefined) sebagai 0 tanpa pengurangan nilai", () => {
    const questions = [
      { id: "q-1", correctIndex: 0 },
      { id: "q-2", correctIndex: 1 },
      { id: "q-3", correctIndex: 2 },
    ];

    const answers = [
      { questionId: "q-1", selectedIndex: 0 }, // Benar (1)
      { questionId: "q-2", selectedIndex: null }, // Kosong
      { questionId: "q-3", selectedIndex: undefined }, // Kosong
    ];

    expect(gradeAttempt(3, questions, answers)).toEqual({
      correctCount: 1,
      score: 33.33,
    });
  });
});
