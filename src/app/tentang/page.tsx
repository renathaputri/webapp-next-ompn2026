import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { MarkdownView } from "@/components/markdown-view";

export const dynamic = "force-dynamic";

export default async function TentangPage() {
  const page = await prisma.contentPage.findUnique({
    where: { key: "about" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 md:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm">
            <h1 className="text-3xl font-bold text-[#0B1F4B] mb-6 border-b border-slate-200 pb-4">
              {page?.title || "Tentang OMPN 2026"}
            </h1>
            <MarkdownView
              content={
                page?.body ||
                "Informasi mengenai penyelenggaraan Olimpiade Matematika dan Pengetahuan Nasional 2026."
              }
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
