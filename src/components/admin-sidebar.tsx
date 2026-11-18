"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Award,
  Trophy,
  BookOpen,
  Settings,
  History,
  LogOut,
  ExternalLink,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
    { href: "/admin/participants", label: "Data Peserta", icon: Users },
    { href: "/admin/exams", label: "Kelola Ujian", icon: FileText },
    { href: "/admin/results", label: "Nilai & Hasil", icon: Award },
    { href: "/admin/ranking", label: "Peringkat", icon: Trophy },
    { href: "/admin/review", label: "Pembahasan", icon: BookOpen },
    { href: "/admin/content", label: "Konten & Pengaturan", icon: Settings },
    { href: "/admin/logs", label: "Log Aktivitas", icon: History },
  ];

  return (
    <aside className="w-64 bg-[#0B1F4B] text-white flex flex-col flex-shrink-0 min-h-screen">
      <div className="p-6 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-1.5">
          <span className="text-xl font-bold tracking-tight text-white">OMPN</span>
          <span className="text-xl font-bold tracking-tight text-[#C9A227]">2026</span>
          <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded ml-2">
            ADMIN
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#C9A227] text-white font-semibold"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Lihat Beranda Publik
        </Link>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar Admin
        </button>
      </div>
    </aside>
  );
}
