import { prisma } from "@/lib/prisma";
import type { Exam } from "@prisma/client";

/**
 * Memeriksa dan memperbarui status ujian secara otomatis:
 * Jika status == SCHEDULED dan waktu saat ini telah melewati endAt,
 * ubah status menjadi CLOSED dan catat riwayat log sistem.
 */
export async function ensureExamState(exam: Exam): Promise<Exam> {
  if (exam.status === "SCHEDULED" && exam.endAt && new Date() > new Date(exam.endAt)) {
    const updated = await prisma.exam.update({
      where: { id: exam.id },
      data: { status: "CLOSED" },
    });

    // Catat aksi sistem
    const systemAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (systemAdmin) {
      await prisma.auditLog.create({
        data: {
          adminId: systemAdmin.id,
          action: "EXAM_AUTO_CLOSE",
          entity: "Exam",
          entityId: exam.id,
          meta: { reason: "Waktu pelaksanaan (endAt) telah berakhir", endAt: exam.endAt },
        },
      });
    }

    return updated;
  }

  return exam;
}

/**
 * Sinkronisasi massal seluruh ujian yang telah melewati waktu endAt
 */
export async function syncAllExamsState(adminId?: string): Promise<number> {
  const now = new Date();
  const expiredExams = await prisma.exam.findMany({
    where: {
      status: "SCHEDULED",
      endAt: { lt: now },
    },
  });

  if (expiredExams.length === 0) return 0;

  for (const exam of expiredExams) {
    await prisma.exam.update({
      where: { id: exam.id },
      data: { status: "CLOSED" },
    });

    if (adminId) {
      await prisma.auditLog.create({
        data: {
          adminId,
          action: "EXAM_SYNC_CLOSE",
          entity: "Exam",
          entityId: exam.id,
          meta: { title: exam.title, endAt: exam.endAt },
        },
      });
    }
  }

  return expiredExams.length;
}
