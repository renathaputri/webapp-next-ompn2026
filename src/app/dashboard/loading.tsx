import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <div className="w-12 h-12 rounded-xl bg-[#0A2558] flex items-center justify-center shadow-md">
        <Loader2 className="w-6 h-6 animate-spin text-[#F59E0B]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#0A2558]">Memuat Dashboard Peserta...</p>
        <p className="text-xs text-slate-400 mt-0.5">Menyiapkan jadwal dan status ujian Anda</p>
      </div>
    </div>
  );
}
