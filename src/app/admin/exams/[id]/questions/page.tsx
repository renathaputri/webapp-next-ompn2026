import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuestionsClient } from "./questions-client";

export const dynamic = "force-dynamic";

interface QuestionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminQuestionsPage({ params }: QuestionsPageProps) {
  const { id } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      level: true,
      subject: true,
      questions: {
        orderBy: { number: "asc" },
      },
    },
  });

  if (!exam) {
    notFound();
  }

  return <QuestionsClient exam={exam} />;
}
