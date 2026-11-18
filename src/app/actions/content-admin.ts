"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateContentPage(key: string, title: string, body: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  await prisma.$transaction([
    prisma.contentPage.upsert({
      where: { key },
      update: { title, body },
      create: { key, title, body },
    }),
    prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "CONTENT_PAGE_UPDATE",
        entity: "ContentPage",
        entityId: key,
      },
    }),
  ]);

  revalidatePath("/admin/content");
  revalidatePath("/");
  revalidatePath(`/${key}`);
  return { success: true };
}

export async function updateSettings(
  registrationCloseAt: string | null,
  publicRankingLimit: number | null
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: "registrationCloseAt" },
      update: { value: registrationCloseAt ?? Prisma.JsonNull },
      create: { key: "registrationCloseAt", value: registrationCloseAt ?? Prisma.JsonNull },
    }),
    prisma.setting.upsert({
      where: { key: "publicRankingLimit" },
      update: { value: publicRankingLimit ?? Prisma.JsonNull },
      create: { key: "publicRankingLimit", value: publicRankingLimit ?? Prisma.JsonNull },
    }),
    prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "SETTINGS_UPDATE",
        entity: "Setting",
        meta: { registrationCloseAt, publicRankingLimit },
      },
    }),
  ]);

  revalidatePath("/admin/content");
  revalidatePath("/");
  revalidatePath("/daftar");
  return { success: true };
}

export async function createAnnouncement(title: string, body: string, isPublished: boolean) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const created = await prisma.announcement.create({
    data: {
      title,
      body,
      isPublished,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "ANNOUNCEMENT_CREATE",
      entity: "Announcement",
      entityId: created.id,
      meta: { title, isPublished },
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/");
  return { success: true };
}

export async function toggleAnnouncementPublish(id: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const item = await prisma.announcement.findUnique({ where: { id } });
  if (!item) throw new Error("Pengumuman tidak ditemukan");

  const newStatus = !item.isPublished;

  await prisma.$transaction([
    prisma.announcement.update({
      where: { id },
      data: { isPublished: newStatus },
    }),
    prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: newStatus ? "ANNOUNCEMENT_PUBLISH" : "ANNOUNCEMENT_UNPUBLISH",
        entity: "Announcement",
        entityId: id,
      },
    }),
  ]);

  revalidatePath("/admin/content");
  revalidatePath("/");
  return { success: true, isPublished: newStatus };
}

export async function deleteAnnouncement(id: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  await prisma.$transaction([
    prisma.announcement.delete({
      where: { id },
    }),
    prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "ANNOUNCEMENT_DELETE",
        entity: "Announcement",
        entityId: id,
      },
    }),
  ]);

  revalidatePath("/admin/content");
  revalidatePath("/");
  return { success: true };
}

export async function createSubject(name: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const cleanName = name.trim();
  if (!cleanName) {
    return { error: "Nama mata pelajaran wajib diisi." };
  }

  const existing = await prisma.subject.findUnique({
    where: { name: cleanName },
  });

  if (existing) {
    return { error: "Mata pelajaran dengan nama ini sudah terdaftar." };
  }

  const created = await prisma.subject.create({
    data: { name: cleanName, isActive: true },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "SUBJECT_CREATE",
      entity: "Subject",
      entityId: created.id,
      meta: { name: cleanName },
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin/exams");
  revalidatePath("/daftar");
  return { success: true, subject: created };
}

export async function updateSubject(id: string, name: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const cleanName = name.trim();
  if (!cleanName) {
    return { error: "Nama mata pelajaran tidak boleh kosong." };
  }

  const duplicate = await prisma.subject.findFirst({
    where: {
      name: cleanName,
      id: { not: id },
    },
  });

  if (duplicate) {
    return { error: "Mata pelajaran lain dengan nama ini sudah ada." };
  }

  await prisma.subject.update({
    where: { id },
    data: { name: cleanName, isActive },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "SUBJECT_UPDATE",
      entity: "Subject",
      entityId: id,
      meta: { name: cleanName, isActive },
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin/exams");
  revalidatePath("/daftar");
  return { success: true };
}

export async function toggleSubjectActive(id: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak");
  }

  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) return { error: "Mata pelajaran tidak ditemukan." };

  const newStatus = !subject.isActive;
  await prisma.subject.update({
    where: { id },
    data: { isActive: newStatus },
  });

  await prisma.auditLog.create({
    data: {
      adminId: session.user.id,
      action: newStatus ? "SUBJECT_ACTIVATE" : "SUBJECT_DEACTIVATE",
      entity: "Subject",
      entityId: id,
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin/exams");
  revalidatePath("/daftar");
  return { success: true, isActive: newStatus };
}
