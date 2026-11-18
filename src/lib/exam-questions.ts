import { prisma } from "@/lib/prisma";

export interface QuestionForExam {
  id: string;
  number: number;
  displayNumber: number;
  text: string;
  options: string[];
}

export interface QuestionForReview extends QuestionForExam {
  correctIndex: number;
  explanation: string;
}

/**
 * ATURAN KERAS BAB 2 POIN 3:
 * correctIndex dan explanation TIDAK BOLEH ikut terkirim ke client ruang ujian!
 * Menggunakan select eksplisit tanpa kunci jawaban dan tanpa pembahasan.
 */
export async function getQuestionsForExam(
  examId: string,
  questionOrder?: string[] | null
): Promise<QuestionForExam[]> {
  const rawQuestions = await prisma.question.findMany({
    where: { examId },
    select: {
      id: true,
      number: true,
      text: true,
      options: true,
    },
    orderBy: { number: "asc" },
  });

  const questionMap = new Map<string, (typeof rawQuestions)[0]>();
  for (const q of rawQuestions) {
    questionMap.set(q.id, q);
  }

  // Jika ada urutan acak per peserta (questionOrder)
  if (questionOrder && Array.isArray(questionOrder) && questionOrder.length > 0) {
    const ordered: QuestionForExam[] = [];
    questionOrder.forEach((qid, idx) => {
      const q = questionMap.get(qid);
      if (q) {
        ordered.push({
          id: q.id,
          number: q.number,
          displayNumber: idx + 1,
          text: q.text,
          options: Array.isArray(q.options) ? (q.options as string[]) : [],
        });
      }
    });

    // Tambahkan soal lain jika ada yang belum masuk order
    if (ordered.length === rawQuestions.length) {
      return ordered;
    }
  }

  // Default urut 1..N
  return rawQuestions.map((q, idx) => ({
    id: q.id,
    number: q.number,
    displayNumber: idx + 1,
    text: q.text,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
  }));
}

/**
 * Helper khusus halaman pembahasan yang lolos otorisasi ketat (Bab 8).
 * Mengambil kunci jawaban dan pembahasan.
 */
export async function getQuestionsForReview(
  examId: string,
  questionOrder?: string[] | null
): Promise<QuestionForReview[]> {
  const rawQuestions = await prisma.question.findMany({
    where: { examId },
    select: {
      id: true,
      number: true,
      text: true,
      options: true,
      correctIndex: true,
      explanation: true,
    },
    orderBy: { number: "asc" },
  });

  const questionMap = new Map<string, (typeof rawQuestions)[0]>();
  for (const q of rawQuestions) {
    questionMap.set(q.id, q);
  }

  if (questionOrder && Array.isArray(questionOrder) && questionOrder.length > 0) {
    const ordered: QuestionForReview[] = [];
    questionOrder.forEach((qid, idx) => {
      const q = questionMap.get(qid);
      if (q) {
        ordered.push({
          id: q.id,
          number: q.number,
          displayNumber: idx + 1,
          text: q.text,
          options: Array.isArray(q.options) ? (q.options as string[]) : [],
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        });
      }
    });

    if (ordered.length === rawQuestions.length) {
      return ordered;
    }
  }

  return rawQuestions.map((q, idx) => ({
    id: q.id,
    number: q.number,
    displayNumber: idx + 1,
    text: q.text,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));
}
