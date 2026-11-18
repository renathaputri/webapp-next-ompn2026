"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizeText, normalizeWhatsapp } from "@/lib/auth-helpers";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama lengkap wajib diisi minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
    whatsapp: z.string().min(8, "Nomor WhatsApp tidak valid"),
    school: z.string().min(2, "Asal sekolah wajib diisi"),
    city: z.string().min(2, "Kota/kabupaten wajib diisi"),
    levelId: z.string().min(1, "Jenjang pendidikan wajib dipilih"),
    examIds: z.array(z.string()).min(1, "Pilih minimal satu mata pelajaran"),
    password: z.string().min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi kata sandi minimal 8 karakter"),
    consent: z.literal(true, {
      message: "Anda wajib menyetujui kebijakan privasi dan perlindungan data",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function registerParticipant(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  try {
    // 1. Cek penutupan pendaftaran di server
    const regCloseSetting = await prisma.setting.findUnique({
      where: { key: "registrationCloseAt" },
    });

    if (regCloseSetting?.value) {
      const closeDate = new Date(regCloseSetting.value as string);
      if (new Date() >= closeDate) {
        return {
          error: "Pendaftaran telah resmi ditutup oleh panitia.",
        };
      }
    }

    // 2. Parse form data
    const rawData = {
      name: formData.get("name") as string,
      email: (formData.get("email") as string)?.toLowerCase().trim(),
      whatsapp: formData.get("whatsapp") as string,
      school: formData.get("school") as string,
      city: formData.get("city") as string,
      levelId: formData.get("levelId") as string,
      examIds: formData.getAll("examIds") as string[],
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
      consent: formData.get("consent") === "on" || formData.get("consent") === "true",
    };

    const validated = registerSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        fieldErrors: validated.error.flatten().fieldErrors,
        error: "Mohon periksa kembali isian formulir pendaftaran Anda.",
      };
    }

    const { name, email, school, city, levelId, examIds, password } = validated.data;
    const normalizedWhatsapp = normalizeWhatsapp(validated.data.whatsapp);
    const schoolNormalized = normalizeText(school);

    if (normalizedWhatsapp.length < 9) {
      return {
        fieldErrors: { whatsapp: ["Nomor WhatsApp tidak valid (minimal 9 digit)."] },
      };
    }

    // 3. Cek duplikasi email dan whatsapp
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return {
        fieldErrors: { email: ["Alamat email ini sudah terdaftar. Silakan login atau gunakan email lain."] },
      };
    }

    const existingWA = await prisma.user.findUnique({
      where: { whatsapp: normalizedWhatsapp },
    });
    if (existingWA) {
      return {
        fieldErrors: {
          whatsapp: ["Nomor WhatsApp ini sudah terdaftar. Setiap nomor hanya dapat digunakan untuk satu akun."],
        },
      };
    }

    // 4. Validasi bahwa ujian yang dipilih sesuai dengan jenjang yang dipilih
    const validExams = await prisma.exam.findMany({
      where: {
        id: { in: examIds },
        levelId,
        isActive: true,
      },
    });

    if (validExams.length !== examIds.length) {
      return {
        error: "Salah satu mata pelajaran yang dipilih tidak sesuai dengan jenjang Anda atau sedang tidak aktif.",
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Simpan peserta dan pendaftaran ujian dalam transaksi database
    await prisma.$transaction(async (tx) => {
      // Cari kode peserta terakhir
      const lastUser = await tx.user.findFirst({
        where: {
          participantCode: { startsWith: "OMPN26-" },
        },
        orderBy: { participantCode: "desc" },
        select: { participantCode: true },
      });

      let nextNumber = 1;
      if (lastUser?.participantCode) {
        const lastNumPart = lastUser.participantCode.replace("OMPN26-", "");
        const parsed = parseInt(lastNumPart, 10);
        if (!isNaN(parsed)) {
          nextNumber = parsed + 1;
        }
      }

      const participantCode = `OMPN26-${String(nextNumber).padStart(4, "0")}`;

      const user = await tx.user.create({
        data: {
          name,
          email,
          whatsapp: normalizedWhatsapp,
          school: school.trim(),
          schoolNormalized,
          city: city.trim(),
          levelId,
          passwordHash,
          participantCode,
          role: "PARTICIPANT",
          isActive: true,
          mustChangePassword: false,
          consentAt: new Date(),
        },
      });

      // Buat registrasi ujian
      for (const examId of examIds) {
        await tx.registration.create({
          data: {
            userId: user.id,
            examId,
          },
        });
      }
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Gagal melakukan pendaftaran:", error);
    return {
      error: "Terjadi kesalahan pada sistem saat memproses pendaftaran. Silakan coba beberapa saat lagi.",
    };
  }
}
