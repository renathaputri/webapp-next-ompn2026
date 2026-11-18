"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        expectedRole: "ADMIN",
        redirect: false,
      });

      if (res?.error) {
        setError("Alamat email atau kata sandi administrator tidak sesuai.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Terjadi kendala sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 md:p-10 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <div className="w-12 h-12 rounded-lg bg-[#0B1F4B] text-white flex items-center justify-center mx-auto">
        <Lock className="w-6 h-6 text-[#C9A227]" />
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold text-[#0B1F4B]">Portal Administrator</h1>
        <p className="text-xs text-slate-500 mt-1">Area terbatas khusus panitia dan pengelola sistem</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Email Administrator
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@ompn2026.id"
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Kata Sandi
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 12 karakter"
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0B1F4B] hover:bg-[#0B1F4B]/90 rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {isLoading ? "Memverifikasi Otorisasi..." : "Masuk ke Panel Admin"}
        </button>
      </form>
    </div>
  );
}
