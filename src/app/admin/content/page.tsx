import { prisma } from "@/lib/prisma";
import { ContentClient } from "./content-client";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const [contentPages, announcements, regCloseSetting, publicRankSetting, subjects] = await Promise.all([
    prisma.contentPage.findMany({
      orderBy: { key: "asc" },
    }),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.setting.findUnique({
      where: { key: "registrationCloseAt" },
    }),
    prisma.setting.findUnique({
      where: { key: "publicRankingLimit" },
    }),
    prisma.subject.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { exams: true },
        },
      },
    }),
  ]);

  const registrationCloseAt = regCloseSetting?.value ? (regCloseSetting.value as string) : null;
  const publicRankingLimit = publicRankSetting?.value ? Number(publicRankSetting.value) : null;

  return (
    <ContentClient
      contentPages={contentPages}
      announcements={announcements}
      registrationCloseAt={registrationCloseAt}
      publicRankingLimit={publicRankingLimit}
      subjects={subjects.map((s) => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive,
        examCount: s._count.exams,
      }))}
    />
  );
}
