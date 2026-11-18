import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getExamRankings } from "@/lib/ranking";
import { redirect } from "next/navigation";
import { AdminRankingClient } from "./ranking-client";

interface AdminRankingPageProps {
  searchParams: Promise<{ examId?: string }>;
}

export default async function AdminRankingPage({ searchParams }: AdminRankingPageProps) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const { examId: selectedExamId } = await searchParams;

  const exams = await prisma.exam.findMany({
    include: {
      level: { select: { name: true } },
      subject: { select: { name: true } },
    },
    orderBy: [
      { level: { sortOrder: "asc" } },
      { subject: { name: "asc" } },
    ],
  });

  const activeExamId =
    selectedExamId && exams.some((e) => e.id === selectedExamId)
      ? selectedExamId
      : exams[0]?.id ?? null;

  const activeExam = exams.find((e) => e.id === activeExamId) ?? null;

  let rankings: Awaited<ReturnType<typeof getExamRankings>> = [];
  if (activeExamId) {
    rankings = await getExamRankings(activeExamId);
  }

  // Setting limit
  const limitSetting = await prisma.setting.findUnique({
    where: { key: "publicRankingLimit" },
  });
  const currentLimit =
    limitSetting?.value && typeof limitSetting.value === "number"
      ? limitSetting.value
      : null;

  return (
    <AdminRankingClient
      exams={exams.map((e) => ({
        id: e.id,
        title: e.title,
        levelName: e.level.name,
        subjectName: e.subject.name,
        resultsPublished: e.resultsPublished,
      }))}
      activeExam={
        activeExam
          ? {
              id: activeExam.id,
              title: activeExam.title,
              levelName: activeExam.level.name,
              subjectName: activeExam.subject.name,
              resultsPublished: activeExam.resultsPublished,
            }
          : null
      }
      rankings={rankings.map((r) => ({
        ...r,
        submittedAt: r.submittedAt.toISOString(),
      }))}
      currentLimit={currentLimit}
    />
  );
}
