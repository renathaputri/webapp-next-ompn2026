"use client";

import { useEffect, useState } from "react";
import { getTimeRemaining } from "@/lib/date";

interface CountdownProps {
  targetDate: string | Date;
  label: string;
  expiredMessage?: string;
}

export function Countdown({ targetDate, label, expiredMessage = "Waktu telah berakhir" }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isPast) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-center">
        <span className="text-sm font-medium text-slate-600">{expiredMessage}</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0A2558] text-white rounded-xl p-6 shadow-md border border-[#0A2558]/50">
      <div className="text-xs uppercase tracking-wider text-[#F59E0B] font-semibold text-center mb-3">
        {label}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center max-w-sm mx-auto">
        <div className="bg-[#071E4A] p-3 rounded-lg border border-white/10">
          <span className="block text-2xl md:text-3xl font-bold text-white">{timeLeft.days}</span>
          <span className="text-[10px] md:text-xs text-slate-300 uppercase">Hari</span>
        </div>
        <div className="bg-[#071E4A] p-3 rounded-lg border border-white/10">
          <span className="block text-2xl md:text-3xl font-bold text-white">{String(timeLeft.hours).padStart(2, "0")}</span>
          <span className="text-[10px] md:text-xs text-slate-300 uppercase">Jam</span>
        </div>
        <div className="bg-[#071E4A] p-3 rounded-lg border border-white/10">
          <span className="block text-2xl md:text-3xl font-bold text-white">{String(timeLeft.minutes).padStart(2, "0")}</span>
          <span className="text-[10px] md:text-xs text-slate-300 uppercase">Menit</span>
        </div>
        <div className="bg-[#071E4A] p-3 rounded-lg border border-white/10">
          <span className="block text-2xl md:text-3xl font-bold text-white">{String(timeLeft.seconds).padStart(2, "0")}</span>
          <span className="text-[10px] md:text-xs text-slate-300 uppercase">Detik</span>
        </div>
      </div>
    </div>
  );
}
