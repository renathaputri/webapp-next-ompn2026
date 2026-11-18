import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getExamRankings } from "@/lib/ranking";
import { formatWIB } from "@/lib/date";
import Papa from "papaparse";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const format = searchParams.get("format") || "csv"; // "csv" | "xlsx"

    if (!examId) {
      return NextResponse.json(
        { error: "Parameter examId wajib disertakan" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        level: { select: { name: true } },
        subject: { select: { name: true } },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil data peringkat (Bab 9 & Bab 7.D)
    const rankings = await getExamRankings(examId);

    const rows = rankings.map((r) => {
      const mins = Math.floor(r.durationSeconds / 60);
      const secs = r.durationSeconds % 60;
      return {
        Peringkat: r.rank,
        "Kode Peserta": r.participantCode ?? "-",
        "Nama Peserta": r.name,
        "Asal Sekolah": r.school,
        Jenjang: exam.level.name,
        "Mata Pelajaran": exam.subject.name,
        "Jumlah Benar": `${r.correctCount} / ${exam.questionCount}`,
        "Nilai Akhir": r.score.toFixed(2),
        "Durasi Pengerjaan": `${mins}m ${secs}s`,
        "Alasan Submit": r.submitReason === "TIMEOUT" ? "Waktu Habis (TIMEOUT)" : "Mandiri (MANUAL)",
        "Waktu Pengumpulan (WIB)": formatWIB(r.submittedAt),
      };
    });

    // Catat AuditLog
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "EXPORT_EXAM_RESULTS",
        entity: "Exam",
        entityId: exam.id,
        meta: { format, rowCount: rows.length },
      },
    });

    const safeTitle = exam.title.replace(/[^a-zA-Z0-9_-]/g, "_");

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Rekap Nilai");

      if (rows.length > 0) {
        const columns = Object.keys(rows[0]).map((key) => ({
          header: key,
          key,
          width: key.length < 15 ? 15 : key.length + 5,
        }));
        sheet.columns = columns;

        // Gaya header
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0B1F4B" },
        };

        rows.forEach((row) => sheet.addRow(row));
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Rekap_Nilai_${safeTitle}.xlsx"`,
        },
      });
    }

    // Default CSV
    const csvString = Papa.unparse(rows);
    return new NextResponse(csvString, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Rekap_Nilai_${safeTitle}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting results:", error);
    return NextResponse.json(
      { error: "Gagal mengekspor data rekap nilai" },
      { status: 500 }
    );
  }
}
