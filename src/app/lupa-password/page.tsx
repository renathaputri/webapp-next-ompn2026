import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { MarkdownView } from "@/components/markdown-view";
import { ArrowLeft, KeyRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LupaPasswordPage() {
  const contactPage = await prisma.contentPage.findUnique({
    where: { key: "contact" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 md:py-16 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 md:p-10 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="w-12 h-12 rounded-lg bg-[#0B1F4B]/10 text-[#0B1F4B] flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#0B1F4B]">Prosedur Reset Kata Sandi</h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Untuk menjaga keamanan data dan karena tidak menggunakan pengiriman email otomatis, reset kata sandi dilakukan secara manual oleh administrator panitia.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-2">
              <div className="font-semibold text-slate-800">Petunjuk Permohonan:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>Hubungi panitia resmi melalui kontak di bawah ini.</li>
                <li>Sebutkan <strong>Nama Lengkap</strong>, <strong>Email Terdaftar</strong>, dan <strong>Kode Peserta (jika ada)</strong>.</li>
                <li>Panitia akan memverifikasi identitas Anda dan memberikan kata sandi sementara.</li>
                <li>Setelah login dengan kata sandi sementara, Anda akan diminta langsung membuat kata sandi baru.</li>
              </ol>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Kontak Panitia Resmi</h2>
              <MarkdownView
                content={
                  contactPage?.body ||
                  "Silakan hubungi WhatsApp resmi panitia di: +62 812-3456-7890 (Hanya pesan teks)."
                }
              />
            </div>

            <div className="border-t border-slate-200 pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B1F4B] hover:text-[#C9A227] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Halaman Masuk
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
