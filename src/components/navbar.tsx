"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/tentang", label: "Tentang" },
    { href: "/kategori", label: "Kategori" },
    { href: "/jadwal", label: "Jadwal" },
    { href: "/panduan", label: "Panduan" },
    { href: "/kontak", label: "Kontak" },
  ];

  const dashboardUrl = session?.user?.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-1">
              <span className="text-xl font-bold tracking-tight text-[#0B1F4B]">OMPN</span>
              <span className="text-xl font-bold tracking-tight text-[#C9A227]">2026</span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-700 hover:text-[#0B1F4B] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={dashboardUrl}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-[#0B1F4B] hover:bg-[#0B1F4B]/90 rounded-md transition-colors"
                >
                  <User className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-red-600 border border-slate-200 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-[#0B1F4B] hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  className="px-3.5 py-1.5 text-sm font-medium text-white bg-[#C9A227] hover:bg-[#B38F22] rounded-md transition-colors"
                >
                  Daftar Sekarang
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {session?.user ? (
              <>
                <Link
                  href={dashboardUrl}
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-medium text-white bg-[#0B1F4B] rounded-md"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full text-center px-4 py-2 text-sm font-medium text-slate-700 hover:text-red-600 border border-slate-300 rounded-md"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-medium text-[#0B1F4B] border border-slate-300 rounded-md"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-medium text-white bg-[#C9A227] rounded-md"
                >
                  Daftar Sekarang
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
