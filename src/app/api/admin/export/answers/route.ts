import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import ExcelJS from "exceljs";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const format = searchParams.get("format") || "csv"; // "csv" | "xlsx"
    const mode = searchParams.get("mode") || "wide"; // "wide" | "long"

    if (!examId) {
      return NextResponse.json(
        { error: "Parameter examId wajib disertakan" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          select: {
            id: true,
            number: true,
            correctIndex: true,
          },
          orderBy: { number: "asc" },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil attempt SUBMITTED
    const attempts = await prisma.attempt.findMany({
      where: {
        registration: { examId },
        status: "SUBMITTED",
      },
      include: {
        registration: {
          include: {
            user: {
              select: {
                participantCode: true,
                name: true,
                school: true,
              },
            },
          },
        },
        answers: {
          select: {
            questionId: true,
            selectedIndex: true,
          },
        },
      },
      orderBy: [
        { score: "desc" },
        { durationSeconds: "asc" },
        { submittedAt: "asc" },
      ],
    });

    // Peta questionId -> original number & correctIndex
    const questionMap = new Map<string, { number: number; correctLetter: string }>();
    for (const q of exam.questions) {
      questionMap.set(q.id, {
        number: q.number,
        correctLetter: OPTION_LETTERS[q.correctIndex] ?? "-",
      });
    }

    const safeTitle = exam.title.replace(/[^a-zA-Z0-9_-]/g, "_");

    if (mode === "long") {
      // Format Panjang (Long Format)
      const longRows: Array<{
        "Kode Peserta": string;
        "Nama Peserta": string;
        "Asal Sekolah": string;
        "Nomor Soal": number;
        "Jawaban Peserta": string;
        "Kunci Jawaban": string;
        Status: string;
      }> = [];

      for (const att of attempts) {
        const u = att.registration.user;
        const ansByQuestion = new Map<string, number | null>();
        att.answers.forEach((a) => ansByQuestion.set(a.questionId, a.selectedIndex));

        for (const q of exam.questions) {
          const selIdx = ansByQuestion.get(q.id);
          const userLetter =
            selIdx !== undefined && selIdx !== null ? OPTION_LETTERS[selIdx] ?? "-" : "";
          const isCorrect = selIdx === q.correctIndex;
          const status =
            selIdx === undefined || selIdx === null
              ? "KOSONG"
              : isCorrect
              ? "BENAR"
              : "SALAH";

          longRows.push({
            "Kode Peserta": u.participantCode ?? "-",
            "Nama Peserta": u.name,
            "Asal Sekolah": u.school,
            "Nomor Soal": q.number,
            "Jawaban Peserta": userLetter,
            "Kunci Jawaban": OPTION_LETTERS[q.correctIndex] ?? "-",
            Status: status,
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "EXPORT_EXAM_ANSWERS",
          entity: "Exam",
          entityId: exam.id,
          meta: { format, mode: "long", rowCount: longRows.length },
        },
      });

      if (format === "xlsx") {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Jawaban Detail");

        if (longRows.length > 0) {
          sheet.columns = Object.keys(longRows[0]).map((key) => ({
            header: key,
            key,
            width: 18,
          }));
          const headerRow = sheet.getRow(1);
          headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
          headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF0B1F4B" },
          };
          longRows.forEach((r) => sheet.addRow(r));
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(buffer, {
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="Jawaban_Detail_${safeTitle}.xlsx"`,
          },
        });
      }

      const csvString = Papa.unparse(longRows);
      return new NextResponse(csvString, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="Jawaban_Detail_${safeTitle}.csv"`,
        },
      });
    }

    // Default: Format Lebar (Wide Format)
    // Baris pertama di bawah header berisi Kunci Jawaban
    const headers = [
      "Kode Peserta",
      "Nama Peserta",
      "Asal Sekolah",
      ...exam.questions.map((q) => `Soal ${q.number}`),
    ];

    const keyRow: Record<string, string> = {
      "Kode Peserta": "KUNCI",
      "Nama Peserta": "KUNCI JAWABAN",
      "Asal Sekolah": "-",
    };
    exam.questions.forEach((q) => {
      keyRow[`Soal ${q.number}`] = OPTION_LETTERS[q.correctIndex] ?? "-";
    });

    const participantRows = attempts.map((att) => {
      const u = att.registration.user;
      const ansByQuestion = new Map<string, number | null>();
      att.answers.forEach((a) => ansByQuestion.set(a.questionId, a.selectedIndex));

      const row: Record<string, string> = {
        "Kode Peserta": u.participantCode ?? "-",
        "Nama Peserta": u.name,
        "Asal Sekolah": u.school,
      };

      exam.questions.forEach((q) => {
        const selIdx = ansByQuestion.get(q.id);
        row[`Soal ${q.number}`] =
          selIdx !== undefined && selIdx !== null ? OPTION_LETTERS[selIdx] ?? "" : "";
      });

      return row;
    });

    const allRows = [keyRow, ...participantRows];

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "EXPORT_EXAM_ANSWERS",
        entity: "Exam",
        entityId: exam.id,
        meta: { format, mode: "wide", participantCount: attempts.length },
      },
    });

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Matriks Jawaban");

      sheet.columns = headers.map((key) => ({
        header: key,
        key,
        width: key.startsWith("Soal") ? 10 : 20,
      }));

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0B1F4B" },
      };

      allRows.forEach((r, idx) => {
        const row = sheet.addRow(r);
        // Beri warna pembeda untuk baris Kunci Jawaban
        if (idx === 0) {
          row.font = { bold: true };
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0FDF4" }, // light emerald
          };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Matriks_Jawaban_${safeTitle}.xlsx"`,
        },
      });
    }

    const csvString = Papa.unparse(allRows);
    return new NextResponse(csvString, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Matriks_Jawaban_${safeTitle}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting answers:", error);
    return NextResponse.json(
      { error: "Gagal mengekspor data jawaban peserta" },
      { status: 500 }
    );
  }
}
