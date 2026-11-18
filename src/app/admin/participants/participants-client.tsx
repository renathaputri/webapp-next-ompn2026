"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toggleUserActive, resetUserPassword } from "@/app/actions/participant-admin";
import { formatWIB } from "@/lib/date";
import {
  Search,
  Download,
  KeyRound,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from "lucide-react";

interface ParticipantItem {
  id: string;
  participantCode: string | null;
  name: string;
  email: string;
  whatsapp: string;
  school: string;
  city: string;
  isActive: boolean;
  createdAt: Date;
  level: {
    name: string;
  } | null;
  registrations: {
    id: string;
    exam: {
      subject: {
        name: string;
      };
    };
  }[];
}

interface LevelItem {
  id: string;
  name: string;
  code: string;
}

interface ParticipantsClientProps {
  participants: ParticipantItem[];
  levels: LevelItem[];
  searchQuery: string;
  selectedLevel: string;
  selectedStatus: string;
}

export function ParticipantsClient({
  participants,
  levels,
  searchQuery,
  selectedLevel,
  selectedStatus,
}: ParticipantsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchQuery);
  const [resetModalData, setResetModalData] = useState<{
    userName: string;
    userEmail: string;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/participants?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilter("q", search);
  };

  const handleToggleActive = (userId: string) => {
    if (confirm("Apakah Anda yakin ingin mengubah status keaktifan akun peserta ini?")) {
      startTransition(async () => {
        await toggleUserActive(userId);
      });
    }
  };

  const handleResetPassword = (userId: string) => {
    if (confirm("Reset kata sandi peserta ini? Sistem akan membuat kata sandi sementara acak.")) {
      startTransition(async () => {
        const res = await resetUserPassword(userId);
        if (res.success && res.tempPassword) {
          setResetModalData({
            userName: res.userName || "",
            userEmail: res.userEmail || "",
            tempPassword: res.tempPassword,
          });
        }
      });
    }
  };

  const copyToClipboard = () => {
    if (resetModalData?.tempPassword) {
      navigator.clipboard.writeText(resetModalData.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F4B]">Data Peserta Olimpiade</h1>
          <p className="text-xs text-slate-500 mt-1">
            Total {participants.length} peserta terdata sesuai kriteria filter
          </p>
        </div>

        <a
          href="/api/admin/export/participants"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F4B] hover:bg-[#0B1F4B]/90 rounded-lg shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Ekspor Data (CSV)
        </a>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, kode peserta, atau asal sekolah..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none"
          />
        </form>

        <select
          value={selectedLevel}
          onChange={(e) => handleFilter("level", e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none bg-white"
        >
          <option value="">Semua Jenjang</option>
          {levels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              {lvl.name} ({lvl.code})
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => handleFilter("status", e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none bg-white"
        >
          <option value="">Semua Status Akun</option>
          <option value="active">Hanya Aktif</option>
          <option value="inactive">Hanya Nonaktif</option>
        </select>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {participants.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Tidak ditemukan data peserta yang sesuai dengan pencarian atau filter Anda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Jenjang & Sekolah</th>
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waktu Daftar</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0B1F4B]">
                      {p.participantCode || "-"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{p.email}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{p.whatsapp}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{p.level?.name || "-"}</div>
                      <div className="text-slate-400 text-[11px]">{p.school} &bull; {p.city}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="flex flex-wrap gap-1">
                        {p.registrations.map((r) => (
                          <span key={r.id} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">
                            {r.exam.subject.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {p.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-green-700 font-medium bg-green-50 px-2 py-0.5 rounded border border-green-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <XCircle className="w-3 h-3" />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {formatWIB(p.createdAt, "dd/MM/yyyy HH.mm")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleResetPassword(p.id)}
                          title="Reset Kata Sandi"
                          className="p-1.5 text-slate-600 hover:text-[#0B1F4B] hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleToggleActive(p.id)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                            p.isActive
                              ? "text-red-700 border-red-200 hover:bg-red-50"
                              : "text-green-700 border-green-200 hover:bg-green-50"
                          }`}
                        >
                          {p.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tampilan Password Sementara */}
      {resetModalData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#0B1F4B]">Kata Sandi Sementara Dibuat</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kata sandi untuk peserta <strong>{resetModalData.userName}</strong> ({resetModalData.userEmail}) telah berhasil direset. Harap catat dan sampaikan kepada peserta karena kata sandi ini <strong>hanya ditampilkan satu kali</strong>.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <span className="font-mono text-base font-bold tracking-wider text-[#0B1F4B]">
                {resetModalData.tempPassword}
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#0B1F4B] text-white rounded hover:bg-[#0B1F4B]/90 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Tersalin" : "Salin"}
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Peserta akan diwajibkan mengganti kata sandi secara langsung saat pertama kali masuk ke sistem.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setResetModalData(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Tutup Jendela Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
