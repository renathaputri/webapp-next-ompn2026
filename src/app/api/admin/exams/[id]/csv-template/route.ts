import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { level: true, subject: true },
  });

  if (!exam) {
    return new Response("Exam not found", { status: 404 });
  }

  // Generate kolom pilihan sesuai exam.optionCount (A, B, C, ...)
  const optionLetters = Array.from({ length: exam.optionCount }, (_, i) =>
    String.fromCharCode(65 + i).toLowerCase()
  );

  const headers = ["jenjang", "mapel", "nomor", "pertanyaan", ...optionLetters, "kunci", "pembahasan"];

  const sampleRow: Record<string, string | number> = {
    jenjang: exam.level.code,
    mapel: exam.subject.name,
    nomor: 1,
    pertanyaan: "Berapakah hasil dari $2^3 + \\sqrt{16}$?",
    kunci: "A",
    pembahasan: "Perhitungannya adalah $2^3 = 8$ dan $\\sqrt{16} = 4$. Maka $8 + 4 = 12$.",
  };

  optionLetters.forEach((letter, idx) => {
    sampleRow[letter] = idx === 0 ? "12" : String(10 + idx * 2);
  });

  const csv = Papa.unparse({
    fields: headers,
    data: [sampleRow],
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="template-soal-${exam.subject.name.toLowerCase().replace(/\s+/g, "-")}.csv"`,
    },
  });
}
