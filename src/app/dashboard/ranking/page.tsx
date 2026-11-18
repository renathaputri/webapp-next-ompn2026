import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getExamRankings } from "@/lib/ranking";
import { redirect } from "next/navigation";
import { RankingClient } from "./ranking-client";

interface PageProps {
  searchParams: Promise<{ examId?: string }>;
}

export default async function ParticipantRankingPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { examId: selectedExamId } = await searchParams;

  // Ambil setting publicRankingLimit
  const limitSetting = await prisma.setting.findUnique({
    where: { key: "publicRankingLimit" },
  });
  const rankingLimit =
    limitSetting?.value && typeof limitSetting.value === "number"
      ? limitSetting.value
      : null;

  // Ambil semua ujian yang sudah dipublikasikan (resultsPublished == true)
  const publishedExams = await prisma.exam.findMany({
    where: {
      resultsPublished: true,
      isActive: true,
    },
    include: {
      level: { select: { name: true } },
      subject: { select: { name: true } },
    },
    orderBy: [
      { level: { sortOrder: "asc" } },
      { subject: { name: "asc" } },
    ],
  });

  // Tentukan ujian yang aktif ditampilkan
  const activeExamId =
    selectedExamId && publishedExams.some((e) => e.id === selectedExamId)
      ? selectedExamId
      : publishedExams[0]?.id ?? null;

  const activeExam = publishedExams.find((e) => e.id === activeExamId) ?? null;

  let rankings: Awaited<ReturnType<typeof getExamRankings>> = [];
  if (activeExamId) {
    rankings = await getExamRankings(activeExamId, rankingLimit);
  }

  // Format serializable data
  const formattedRankings = rankings.map((r) => ({
    rank: r.rank,
    attemptId: r.attemptId,
    userId: r.userId,
    name: r.name,
    participantCode: r.participantCode,
    school: r.school,
    score: r.score,
    durationSeconds: r.durationSeconds,
    submittedAt: r.submittedAt.toISOString(),
    isCurrentUser: r.userId === session.user.id,
  }));

  const userRankItem = formattedRankings.find((r) => r.isCurrentUser) ?? null;

  return (
    <RankingClient
      exams={publishedExams.map((e) => ({
        id: e.id,
        title: e.title,
        levelName: e.level.name,
        subjectName: e.subject.name,
      }))}
      activeExam={
        activeExam
          ? {
              id: activeExam.id,
              title: activeExam.title,
              levelName: activeExam.level.name,
              subjectName: activeExam.subject.name,
            }
          : null
      }
      rankings={formattedRankings}
      userRankItem={userRankItem}
      rankingLimit={rankingLimit}
    />
  );
}
