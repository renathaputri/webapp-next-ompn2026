import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminReviewClient } from "./review-admin-client";

export default async function AdminReviewPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const exams = await prisma.exam.findMany({
    include: {
      level: { select: { name: true } },
      subject: { select: { name: true } },
      _count: {
        select: {
          questions: true,
          registrations: true,
        },
      },
    },
    orderBy: [
      { level: { sortOrder: "asc" } },
      { subject: { name: "asc" } },
    ],
  });

  const now = new Date();

  const formattedExams = exams.map((e) => {
    const isPastEnd = e.endAt ? now > new Date(e.endAt) : false;
    const isClosed = e.status === "CLOSED";
    const canOpen = isClosed && isPastEnd;

    let lockedReason = "";
    if (!isClosed) {
      lockedReason = "Status ujian belum CLOSED.";
    } else if (!isPastEnd) {
      lockedReason = "Jadwal selesai (endAt) belum berakhir.";
    }

    return {
      id: e.id,
      title: e.title,
      levelName: e.level.name,
      subjectName: e.subject.name,
      status: e.status,
      startAt: e.startAt ? e.startAt.toISOString() : null,
      endAt: e.endAt ? e.endAt.toISOString() : null,
      discussionOpen: e.discussionOpen,
      canOpen,
      lockedReason,
      questionCount: e._count.questions,
      registrationCount: e._count.registrations,
    };
  });

  return <AdminReviewClient exams={formattedExams} />;
}
