import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { id } from "date-fns/locale";

export const TIMEZONE_WIB = "Asia/Jakarta";

/**
 * Format tanggal UTC menjadi string waktu lokal WIB.
 * Format default: "dd MMMM yyyy, HH.mm 'WIB'"
 */
export function formatWIB(date: Date | string | null | undefined, formatStr = "dd MMMM yyyy, HH.mm 'WIB'"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  const zonedDate = toZonedTime(d, TIMEZONE_WIB);
  return format(zonedDate, formatStr, { locale: id });
}

/**
 * Menghitung selisih waktu untuk timer countdown
 */
export function getTimeRemaining(targetDate: Date | string): {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
} {
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const now = new Date();
  const total = target.getTime() - now.getTime();

  if (total <= 0) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
    };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    total,
    days,
    hours,
    minutes,
    seconds,
    isPast: false,
  };
}
