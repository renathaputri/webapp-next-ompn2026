import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Jika belum login atau bukan admin (misalnya sedang di halaman /admin/login), tampilkan konten langsung
  if (!session || session.user.role !== "ADMIN") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">
            Panel Administrator OMPN 2026
          </div>
          <div className="text-xs text-slate-500">
            Login sebagai: <strong className="text-slate-700">{session.user.name || session.user.email}</strong>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
