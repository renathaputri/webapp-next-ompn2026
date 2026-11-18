import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold tracking-tight text-white">OMPN</span>
              <span className="text-xl font-bold tracking-tight text-[#C9A227]">2026</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Platform Resmi Olimpiade Matematika dan Pengetahuan Nasional 2026. Wadah kompetisi akademik daring berintegritas untuk siswa jenjang SD, SMP, dan SMA di seluruh Indonesia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Navigasi</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/tentang" className="hover:text-white transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/kategori" className="hover:text-white transition-colors">
                  Kategori & Jenjang
                </Link>
              </li>
              <li>
                <Link href="/jadwal" className="hover:text-white transition-colors">
                  Jadwal Ujian
                </Link>
              </li>
              <li>
                <Link href="/panduan" className="hover:text-white transition-colors">
                  Panduan & Peraturan
                </Link>
              </li>
            </ul>
          </div>

          {/* Bantuan & Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Pusat Informasi</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/kontak" className="hover:text-white transition-colors">
                  Kontak Panitia
                </Link>
              </li>
              <li>
                <Link href="/privasi" className="hover:text-white transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/lupa-password" className="hover:text-white transition-colors">
                  Lupa Kata Sandi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          Hak Cipta &copy; 2026 OMPN2026. Seluruh hak cipta dilindungi undang-undang.
        </div>
      </div>
    </footer>
  );
}
