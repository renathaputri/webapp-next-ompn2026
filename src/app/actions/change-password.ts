"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi kata sandi minimal 8 karakter"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export type ChangePasswordState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  redirectUrl?: string;
};

export async function changePasswordAction(
  prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sesi telah berakhir. Silakan masuk kembali." };
  }

  const rawData = {
    newPassword: formData.get("newPassword") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validasi panjang khusus admin (min 12 karakter)
  if (session.user.role === "ADMIN" && rawData.newPassword.length < 12) {
    return {
      fieldErrors: {
        newPassword: ["Kata sandi administrator wajib minimal 12 karakter."],
      },
    };
  }

  const validated = changePasswordSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      fieldErrors: validated.error.flatten().fieldErrors,
      error: "Mohon periksa kembali isian kata sandi baru Anda.",
    };
  }

  try {
    const passwordHash = await bcrypt.hash(validated.data.newPassword, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLogins: 0,
        lockedUntil: null,
      },
    });

    const redirectUrl = session.user.role === "ADMIN" ? "/admin" : "/dashboard";
    return {
      success: true,
      redirectUrl,
    };
  } catch (error) {
    console.error("Gagal mengubah kata sandi:", error);
    return {
      error: "Gagal menyimpan kata sandi baru. Silakan coba beberapa saat lagi.",
    };
  }
}
