/**
 * Fungsi murni penilaian ujian OMPN 2026 sesuai spesifikasi Bab 6.6:
 * correctCount = jumlah Answer.selectedIndex == Question.correctIndex
 * score = round((correctCount / exam.questionCount) * 100, 2)
 * Jawaban salah = 0, kosong = 0, tanpa sistem minus / pengurangan.
 */

export interface QuestionKeyItem {
  id: string;
  correctIndex: number;
}

export interface AnswerItem {
  questionId: string;
  selectedIndex: number | null | undefined;
}

export interface GradeResult {
  correctCount: number;
  score: number;
}

export function gradeAttempt(
  questionCount: number,
  questions: QuestionKeyItem[],
  answers: AnswerItem[]
): GradeResult {
  if (questionCount <= 0) {
    return { correctCount: 0, score: 0 };
  }

  // Buat map kunci jawaban untuk lookup O(1)
  const keyMap = new Map<string, number>();
  for (const q of questions) {
    keyMap.set(q.id, q.correctIndex);
  }

  let correctCount = 0;

  for (const ans of answers) {
    if (ans.selectedIndex !== null && ans.selectedIndex !== undefined) {
      const correctIdx = keyMap.get(ans.questionId);
      if (correctIdx !== undefined && ans.selectedIndex === correctIdx) {
        correctCount++;
      }
    }
  }

  // Hitung nilai dengan pembulatan 2 desimal
  const rawScore = (correctCount / questionCount) * 100;
  const score = Math.round(rawScore * 100) / 100;

  return {
    correctCount,
    score,
  };
}
