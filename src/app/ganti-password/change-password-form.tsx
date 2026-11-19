"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { changePasswordAction, type ChangePasswordState } from "@/app/actions/change-password";
import { AlertCircle, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/password-input";

export function ChangePasswordForm() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ChangePasswordState>({});

  const isAdmin = session?.user?.role === "ADMIN";
  const minLength = isAdmin ? 12 : 8;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await changePasswordAction({}, formData);
      setState(res);
      if (res.success && res.redirectUrl) {
        await update({ mustChangePassword: false });
        router.push(res.redirectUrl || "/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-white p-8 md:p-10 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
        <Lock className="w-6 h-6" />
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold text-[#0A2558]">Wajib Ganti Kata Sandi</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Demi keamanan akun, Anda diwajibkan memperbarui kata sandi sebelum dapat mengakses sistem.
        </p>
      </div>

      {state.success && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
          <span className="flex items-center gap-2">
            Kata sandi berhasil diperbarui! Mengalihkan...
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          </span>
        </div>
      )}

      {state.error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Kata Sandi Baru ({`Minimal ${minLength} karakter`})
          </label>
          <PasswordInput
            name="newPassword"
            required
            minLength={minLength}
            placeholder={`Masukkan kata sandi baru (min. ${minLength} karakter)`}
            error={state.fieldErrors?.newPassword?.[0]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Konfirmasi Kata Sandi Baru
          </label>
          <PasswordInput
            name="confirmPassword"
            required
            minLength={minLength}
            placeholder="Ulangi kata sandi baru"
            error={state.fieldErrors?.confirmPassword?.[0]}
          />
        </div>

        <button
          type="submit"
          disabled={isPending || state.success}
          className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0A2558] hover:bg-[#0A2558]/90 rounded-lg shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan & Lanjutkan"
          )}
        </button>
      </form>
    </div>
  );
}
