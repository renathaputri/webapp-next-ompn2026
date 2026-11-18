import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import { formatWIB } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const participants = await prisma.user.findMany({
    where: { role: "PARTICIPANT" },
    include: {
      level: true,
      registrations: {
        include: {
          exam: {
            include: { subject: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = participants.map((p) => ({
    "Kode Peserta": p.participantCode || "-",
    "Nama Lengkap": p.name,
    "Email": p.email,
    "WhatsApp": p.whatsapp,
    "Asal Sekolah": p.school,
    "Sekolah (Normalisasi)": p.schoolNormalized,
    "Kota/Kabupaten": p.city,
    "Jenjang": p.level?.name || "-",
    "Mata Pelajaran": p.registrations.map((r) => r.exam.subject.name).join(", "),
    "Status Akun": p.isActive ? "Aktif" : "Nonaktif",
    "Waktu Daftar (WIB)": formatWIB(p.createdAt),
  }));

  const csv = Papa.unparse(rows);

  // Catat ekspor di AuditLog
  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "PARTICIPANTS_EXPORT_CSV",
      entity: "User",
      meta: { totalCount: rows.length },
    },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="peserta-ompn2026-${Date.now()}.csv"`,
    },
  });
}
