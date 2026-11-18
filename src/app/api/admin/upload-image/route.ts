import { auth } from "@/auth";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // Validasi tipe file (png, jpg, webp)
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Hanya menerima PNG, JPG, atau WEBP." },
        { status: 400 }
      );
    }

    // Validasi ukuran maks 2 MB
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas maksimal 2 MB." },
        { status: 400 }
      );
    }

    // Jika ada token Vercel Blob, upload ke Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`questions/${Date.now()}-${file.name}`, file, {
        access: "public",
      });
      return NextResponse.json({ url: blob.url });
    }

    // Fallback penyimpanan lokal untuk environment development
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.name) || ".png";
    const filename = `soal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const localUrl = `/uploads/${filename}`;
    return NextResponse.json({ url: localUrl });
  } catch (error) {
    console.error("Gagal mengunggah gambar:", error);
    return NextResponse.json({ error: "Gagal memproses unggah gambar" }, { status: 500 });
  }
}
