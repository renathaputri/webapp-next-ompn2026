import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ResultsClient } from "./results-client";

interface ResultsPageProps {
  searchParams: Promise<{ examId?: string }>;
}

export default async function AdminResultsPage({ searchParams }: ResultsPageProps) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const { examId: selectedExamId } = await searchParams;

  const exams = await prisma.exam.findMany({
    include: {
      level: { select: { name: true } },
      subject: { select: { name: true } },
      _count: {
        select: {
          registrations: true,
        },
      },
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

  // Cek attempt untuk exam terpilih
  let attempts: Array<{
    id: string;
    startedAt: Date;
    endsAt: Date;
    submittedAt: Date | null;
    status: string;
    submitReason: string | null;
    correctCount: number | null;
    score: number | null;
    durationSeconds: number | null;
    user: {
      id: string;
      name: string;
      participantCode: string | null;
      school: string;
      city: string;
    };
  }> = [];

  let expiredCount = 0;

  if (activeExamId) {
    const rawAttempts = await prisma.attempt.findMany({
      where: {
        registration: { examId: activeExamId },
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
                city: true,
              },
            },
          },
        },
      },
      orderBy: [
        { score: "desc" },
        { durationSeconds: "asc" },
        { submittedAt: "asc" },
      ],
    });

    const now = new Date();
    expiredCount = rawAttempts.filter(
      (a) => a.status === "IN_PROGRESS" && new Date(a.endsAt) < now
    ).length;

    attempts = rawAttempts.map((a) => ({
      id: a.id,
      startedAt: a.startedAt,
      endsAt: a.endsAt,
      submittedAt: a.submittedAt,
      status: a.status,
      submitReason: a.submitReason,
      correctCount: a.correctCount,
      score: a.score ? Number(a.score) : null,
      durationSeconds: a.durationSeconds,
      user: a.registration.user,
    }));
  }

  return (
    <ResultsClient
      exams={exams.map((e) => ({
        id: e.id,
        title: e.title,
        levelName: e.level.name,
        subjectName: e.subject.name,
        questionCount: e.questionCount,
        resultsPublished: e.resultsPublished,
        discussionOpen: e.discussionOpen,
        status: e.status,
        registrationCount: e._count.registrations,
      }))}
      activeExam={
        activeExam
          ? {
              id: activeExam.id,
              title: activeExam.title,
              levelName: activeExam.level.name,
              subjectName: activeExam.subject.name,
              questionCount: activeExam.questionCount,
              resultsPublished: activeExam.resultsPublished,
              discussionOpen: activeExam.discussionOpen,
              status: activeExam.status,
            }
          : null
      }
      attempts={attempts.map((a, idx) => ({
        ...a,
        rank: a.status === "SUBMITTED" ? idx + 1 : null,
        startedAt: a.startedAt.toISOString(),
        endsAt: a.endsAt.toISOString(),
        submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
      }))}
      expiredCount={expiredCount}
    />
  );
}
