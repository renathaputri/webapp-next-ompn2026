import { prisma } from "@/lib/prisma";
import { gradeAttempt } from "@/lib/scoring";
import { Prisma } from "@prisma/client";

/**
 * Finalisasi satu attempt yang kedaluwarsa (TIMEOUT).
 * Nilai dihitung dari jawaban yang telah tersimpan di database.
 * Aturan Bab 6.5:
 * - submittedAt diisi endsAt
 * - durationSeconds = durasi penuh (endsAt - startedAt)
 * - submitReason = TIMEOUT
 */
export async function finalizeSingleAttempt(attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      registration: {
        include: {
          exam: {
            include: {
              questions: {
                select: {
                  id: true,
                  correctIndex: true,
                },
              },
            },
          },
        },
      },
      answers: {
        select: {
          questionId: true,
          selectedIndex: true,
        },
      },
    },
  });

  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return attempt;
  }

  const exam = attempt.registration.exam;
  const gradeResult = gradeAttempt(
    exam.questionCount,
    exam.questions,
    attempt.answers
  );

  const durationSeconds = Math.max(
    0,
    Math.round((attempt.endsAt.getTime() - attempt.startedAt.getTime()) / 1000)
  );

  return prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: "SUBMITTED",
      submittedAt: attempt.endsAt,
      submitReason: "TIMEOUT",
      correctCount: gradeResult.correctCount,
      score: new Prisma.Decimal(gradeResult.score),
      durationSeconds,
    },
  });
}

/**
 * Finalisasi seluruh attempt IN_PROGRESS yang telah melewati endsAt.
 * Opsional dapat difilter per examId.
 */
export async function finalizeExpiredAttempts(examId?: string): Promise<number> {
  const now = new Date();

  const expiredAttempts = await prisma.attempt.findMany({
    where: {
      status: "IN_PROGRESS",
      endsAt: { lt: now },
      ...(examId
        ? {
            registration: {
              examId,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  });

  let finalizedCount = 0;
  for (const item of expiredAttempts) {
    try {
      await finalizeSingleAttempt(item.id);
      finalizedCount++;
    } catch (err) {
      console.error(`Gagal finalisasi attempt ${item.id}:`, err);
    }
  }

  return finalizedCount;
}
