import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Masuk Peserta - OMPN 2026",
  description: "Halaman masuk akun peserta Olimpiade OMPN 2026",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 md:py-20 bg-slate-50 flex items-center justify-center">
        <div className="w-full max-w-md px-4 sm:px-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#0B1F4B]">Masuk ke Akun Peserta</h1>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan alamat email dan kata sandi yang telah didaftarkan
            </p>
          </div>
          <Suspense fallback={<div className="p-8 bg-white rounded-xl text-center text-sm">Memuat...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
