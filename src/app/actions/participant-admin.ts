"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function toggleUserActive(userId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("Peserta tidak ditemukan");
  }

  const updatedStatus = !user.isActive;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isActive: updatedStatus },
    }),
    prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: updatedStatus ? "USER_ACTIVATE" : "USER_DEACTIVATE",
        entity: "User",
        entityId: userId,
        meta: { previousStatus: user.isActive, newStatus: updatedStatus },
      },
    }),
  ]);

  revalidatePath("/admin/participants");
  return { success: true, isActive: updatedStatus };
}

export async function resetUserPassword(userId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("Peserta tidak ditemukan");
  }

  // Buat kata sandi sementara acak 8 karakter
  const tempPassword = crypto.randomBytes(4).toString("hex").toUpperCase();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
        passwordChangedAt: new Date(),
        failedLogins: 0,
        lockedUntil: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "USER_PASSWORD_RESET",
        entity: "User",
        entityId: userId,
        meta: { email: user.email },
      },
    }),
  ]);

  revalidatePath("/admin/participants");
  return {
    success: true,
    tempPassword,
    userName: user.name,
    userEmail: user.email,
  };
}
