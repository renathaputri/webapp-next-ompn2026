import { prisma } from "@/lib/prisma";
import { formatWIB } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1F4B]">Log Aktivitas Administrator</h1>
        <p className="text-xs text-slate-500 mt-1">
          Catatan riwayat tindakan penting oleh administrator sistem (read-only audit trail)
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Belum ada riwayat aktivitas tercatat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Entitas</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4">Detail Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatWIB(log.createdAt, "dd/MM/yyyy HH:mm:ss")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{log.admin.name}</div>
                      <div className="text-[11px] text-slate-400">{log.admin.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-semibold text-[#0B1F4B] bg-slate-100 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{log.entity}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.entityId || "-"}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {log.meta ? JSON.stringify(log.meta) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
