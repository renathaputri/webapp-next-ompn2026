import { prisma } from "@/lib/prisma";

export interface ParticipantRankItem {
  rank: number;
  attemptId: string;
  userId: string;
  name: string;
  participantCode: string | null;
  school: string;
  score: number;
  correctCount: number;
  durationSeconds: number;
  submittedAt: Date;
  submitReason: string | null;
}

/**
 * Mengambil peringkat ujian sesuai spesifikasi Bab 9:
 * - Hanya attempt SUBMITTED
 * - Peringkat berurutan tanpa lompat: 1, 2, 3, 4, dst.
 * - Urutan penentu:
 *   1. score DESC
 *   2. durationSeconds ASC
 *   3. submittedAt ASC
 *   4. attempt.id ASC
 */
export async function getExamRankings(
  examId: string,
  limit?: number | null
): Promise<ParticipantRankItem[]> {
  const attempts = await prisma.attempt.findMany({
    where: {
      status: "SUBMITTED",
      score: { not: null },
      durationSeconds: { not: null },
      submittedAt: { not: null },
      registration: {
        examId,
      },
    },
    include: {
      registration: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              participantCode: true,
              school: true,
            },
          },
        },
      },
    },
    orderBy: [
      { score: "desc" },
      { durationSeconds: "asc" },
      { submittedAt: "asc" },
      { id: "asc" },
    ],
  });

  const rankedItems: ParticipantRankItem[] = attempts.map((att, idx) => ({
    rank: idx + 1,
    attemptId: att.id,
    userId: att.registration.user.id,
    name: att.registration.user.name,
    participantCode: att.registration.user.participantCode,
    school: att.registration.user.school,
    score: att.score ? Number(att.score) : 0,
    correctCount: att.correctCount ?? 0,
    durationSeconds: att.durationSeconds ?? 0,
    submittedAt: att.submittedAt ?? att.endsAt,
    submitReason: att.submitReason,
  }));

  if (limit && limit > 0) {
    return rankedItems.slice(0, limit);
  }

  return rankedItems;
}

/**
 * Mengambil posisi peringkat peserta tertentu dalam ujian
 */
export async function getParticipantRank(
  examId: string,
  attemptId: string
): Promise<{ rank: number; totalParticipants: number } | null> {
  const allRanked = await getExamRankings(examId);
  const foundIndex = allRanked.findIndex((item) => item.attemptId === attemptId);

  if (foundIndex === -1) {
    return null;
  }

  return {
    rank: foundIndex + 1,
    totalParticipants: allRanked.length,
  };
}
