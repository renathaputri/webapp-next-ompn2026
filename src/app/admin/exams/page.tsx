import { prisma } from "@/lib/prisma";
import { ExamsClient } from "./exams-client";

export const dynamic = "force-dynamic";

export default async function AdminExamsPage() {
  const [exams, levels, subjects] = await Promise.all([
    prisma.exam.findMany({
      include: {
        level: true,
        subject: true,
        _count: {
          select: {
            questions: true,
            registrations: true,
          },
        },
      },
      orderBy: [{ level: { sortOrder: "asc" } }, { subject: { name: "asc" } }],
    }),
    prisma.level.findMany({
      orderBy: { sortOrder: "asc" },
    }),
    prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <ExamsClient exams={exams} levels={levels} subjects={subjects} />;
}
