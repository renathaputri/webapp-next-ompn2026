import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/auth-helpers";
import { ParticipantsClient } from "./participants-client";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface ParticipantsPageProps {
  searchParams: Promise<{
    q?: string;
    level?: string;
    status?: string;
  }>;
}

export default async function AdminParticipantsPage({ searchParams }: ParticipantsPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const levelId = params.level || "";
  const status = params.status || "";

  const where: Prisma.UserWhereInput = {
    role: "PARTICIPANT",
  };

  if (levelId) {
    where.levelId = levelId;
  }

  if (status === "active") {
    where.isActive = true;
  } else if (status === "inactive") {
    where.isActive = false;
  }

  if (q) {
    const qNormalized = normalizeText(q);
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { participantCode: { contains: q, mode: "insensitive" } },
      { schoolNormalized: { contains: qNormalized } },
    ];
  }

  const [participants, levels] = await Promise.all([
    prisma.user.findMany({
      where,
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
    }),
    prisma.level.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <ParticipantsClient
      participants={participants}
      levels={levels}
      searchQuery={q}
      selectedLevel={levelId}
      selectedStatus={status}
    />
  );
}
