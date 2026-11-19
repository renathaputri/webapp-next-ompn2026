"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerParticipant, type RegisterState } from "@/app/actions/register";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/password-input";

interface ExamItem {
  id: string;
  title: string;
  levelId: string;
  subject: {
    name: string;
  };
}

interface LevelItem {
  id: string;
  code: string;
  name: string;
}

interface RegisterFormProps {
  levels: LevelItem[];
  exams: ExamItem[];
}

export function RegisterForm({ levels, exams }: RegisterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<RegisterState>({});
  const [selectedLevelId, setSelectedLevelId] = useState<string>(levels[0]?.id || "");
  const [selectedExams, setSelectedExams] = useState<string[]>([]);

  // Filter ujian yang sesuai dengan jenjang terpilih
  const availableExams = exams.filter((e) => e.levelId === selectedLevelId);

  const handleLevelChange = (newLevelId: string) => {
    setSelectedLevelId(newLevelId);
    setSelectedExams([]); // Reset mapel terpilih saat ganti jenjang
  };

  const handleExamToggle = (examId: string) => {
    setSelectedExams((prev) =>
      prev.includes(examId) ? prev.filter((id) => id !== examId) : [...prev, examId]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await registerParticipant({}, formData);
      setState(res);
      if (res.success) {
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 2000);
      }
    });
  };

  if (state.success) {
    return (
      <div className="bg-white p-8 md:p-10 rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-[#0B1F4B]">Pendaftaran Berhasil!</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          Akun peserta Anda telah berhasil dibuat. Anda akan dialihkan secara otomatis ke halaman login, atau klik tombol di bawah ini.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 bg-[#0B1F4B] text-white text-sm font-medium rounded-lg hover:bg-[#0B1F4B]/90 transition-colors"
          >
            Masuk Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-xl border border-slate-200 shadow-sm space-y-6">
      {state.error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Informasi Pribadi */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-[#0B1F4B] border-b border-slate-100 pb-2">
          1. Identitas Peserta
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="Masukkan nama lengkap peserta"
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none"
          />
          {state.fieldErrors?.name && (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Alamat Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="nama@email.com"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none"
            />
            {state.fieldErrors?.email && (
              <p className="text-xs text-red-600 mt-1">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nomor WhatsApp Peserta <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="whatsapp"
              required
              placeholder="08xxxxxxxxxx"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">Nomor milik peserta sendiri. 1 nomor = 1 akun.</p>
            {state.fieldErrors?.whatsapp && (
              <p className="text-xs text-red-600 mt-1">{state.fieldErrors.whatsapp[0]}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Asal Sekolah / Instansi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="school"
              required
              placeholder="Contoh: SMAN 1 Sidoarjo"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none"
            />
            {state.fieldErrors?.school && (
              <p className="text-xs text-red-600 mt-1">{state.fieldErrors.school[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Kota / Kabupaten <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              required
              placeholder="Contoh: Kabupaten Sidoarjo"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none"
            />
            {state.fieldErrors?.city && (
              <p className="text-xs text-red-600 mt-1">{state.fieldErrors.city[0]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Pemilihan Jenjang & Mapel */}
      <div className="space-y-4 pt-2">
        <h2 className="text-base font-semibold text-[#0B1F4B] border-b border-slate-100 pb-2">
          2. Jenjang & Mata Pelajaran
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Jenjang Pendidikan <span className="text-red-500">*</span>
          </label>
          <select
            name="levelId"
            value={selectedLevelId}
            onChange={(e) => handleLevelChange(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none bg-white"
          >
            {levels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.name} ({lvl.code})
              </option>
            ))}
          </select>
          {state.fieldErrors?.levelId && (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.levelId[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Pilih Mata Pelajaran <span className="text-red-500">* (Boleh lebih dari satu)</span>
          </label>

          {availableExams.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
              Belum ada mata pelajaran aktif yang dibuka untuk jenjang ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {availableExams.map((exam) => {
                const isChecked = selectedExams.includes(exam.id);
                return (
                  <label
                    key={exam.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? "border-[#0B1F4B] bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="examIds"
                      value={exam.id}
                      checked={isChecked}
                      onChange={() => handleExamToggle(exam.id)}
                      className="mt-0.5 rounded border-slate-300 text-[#0B1F4B] focus:ring-[#0B1F4B]"
                    />
                    <div>
                      <span className="block text-sm font-semibold text-slate-800">
                        {exam.subject.name}
                      </span>
                      <span className="block text-xs text-slate-500">{exam.title}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          {state.fieldErrors?.examIds && (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.examIds[0]}</p>
          )}
        </div>
      </div>

      {/* Keamanan & Kata Sandi */}
      <div className="space-y-4 pt-2">
        <h2 className="text-base font-semibold text-[#0B1F4B] border-b border-slate-100 pb-2">
          3. Kata Sandi Akun
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Kata Sandi <span className="text-red-500">*</span>
            </label>
            <PasswordInput
              name="password"
              required
              minLength={8}
              placeholder="Minimal 8 karakter"
              error={state.fieldErrors?.password?.[0]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Konfirmasi Kata Sandi <span className="text-red-500">*</span>
            </label>
            <PasswordInput
              name="confirmPassword"
              required
              minLength={8}
              placeholder="Ulangi kata sandi"
              error={state.fieldErrors?.confirmPassword?.[0]}
            />
          </div>
        </div>
      </div>

      {/* Persetujuan Kebijakan Privasi */}
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-1 rounded border-slate-300 text-[#0B1F4B] focus:ring-[#0B1F4B]"
          />
          <span className="text-xs text-slate-600 leading-relaxed">
            Saya menyatakan bahwa data yang saya isikan adalah benar dan sah. Saya telah membaca dan menyetujui seluruh ketentuan{" "}
            <Link href="/privasi" target="_blank" className="text-[#0B1F4B] font-semibold underline hover:text-[#C9A227]">
              Kebijakan Privasi & Perlindungan Data Pribadi
            </Link>{" "}
            OMPN 2026. <span className="text-red-500">*</span>
          </span>
        </label>
        {state.fieldErrors?.consent && (
          <p className="text-xs text-red-600 mt-1">{state.fieldErrors.consent[0]}</p>
        )}
      </div>

      {/* Tombol Submit */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-[#0B1F4B] font-semibold underline hover:text-[#C9A227]">
            Masuk di sini
          </Link>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto px-8 py-3 text-sm font-semibold text-white bg-[#C9A227] hover:bg-[#B38F22] rounded-lg shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memproses Pendaftaran...
            </>
          ) : (
            "Daftar Sekarang"
          )}
        </button>
      </div>
    </form>
  );
}
