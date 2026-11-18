"use client";

import { useState, useTransition } from "react";
import {
  updateContentPage,
  updateSettings,
  createAnnouncement,
  toggleAnnouncementPublish,
  deleteAnnouncement,
  createSubject,
  updateSubject,
  toggleSubjectActive,
} from "@/app/actions/content-admin";
import { formatWIB } from "@/lib/date";
import {
  Settings,
  Bell,
  FileEdit,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
} from "lucide-react";

interface ContentPageItem {
  key: string;
  title: string;
  body: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  isPublished: boolean;
  createdAt: Date;
}

interface SubjectItem {
  id: string;
  name: string;
  isActive: boolean;
  examCount: number;
}

interface ContentClientProps {
  contentPages: ContentPageItem[];
  announcements: AnnouncementItem[];
  registrationCloseAt: string | null;
  publicRankingLimit: number | null;
  subjects: SubjectItem[];
}

export function ContentClient({
  contentPages,
  announcements,
  registrationCloseAt,
  publicRankingLimit,
  subjects,
}: ContentClientProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "announcements" | "pages" | "subjects">("settings");
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // State Subjects
  const [newSubjectName, setNewSubjectName] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");

  // State Settings
  const [regCloseDate, setRegCloseDate] = useState<string>(
    registrationCloseAt ? new Date(registrationCloseAt).toISOString().slice(0, 16) : ""
  );
  const [rankingLimit, setRankingLimit] = useState<string>(
    publicRankingLimit ? String(publicRankingLimit) : ""
  );

  // State Pages
  const [selectedPageKey, setSelectedPageKey] = useState<string>(contentPages[0]?.key || "about");
  const activePage = contentPages.find((p) => p.key === selectedPageKey) || {
    key: selectedPageKey,
    title: "",
    body: "",
  };
  const [pageTitle, setPageTitle] = useState(activePage.title);
  const [pageBody, setPageBody] = useState(activePage.body);

  // State New Announcement Form
  const [showNewAnnounce, setShowNewAnnounce] = useState(false);
  const [newAnnounceTitle, setNewAnnounceTitle] = useState("");
  const [newAnnounceBody, setNewAnnounceBody] = useState("");
  const [newAnnouncePublish, setNewAnnouncePublish] = useState(true);

  const handleSelectPage = (key: string) => {
    setSelectedPageKey(key);
    const target = contentPages.find((p) => p.key === key);
    if (target) {
      setPageTitle(target.title);
      setPageBody(target.body);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const closeIso = regCloseDate ? new Date(regCloseDate).toISOString() : null;
        const limitNum = rankingLimit ? parseInt(rankingLimit, 10) : null;
        await updateSettings(closeIso, limitNum);
        setStatusMessage({ type: "success", text: "Pengaturan sistem berhasil disimpan!" });
        setTimeout(() => setStatusMessage(null), 3000);
      } catch {
        setStatusMessage({ type: "error", text: "Gagal menyimpan pengaturan." });
      }
    });
  };

  const handleSavePage = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateContentPage(selectedPageKey, pageTitle, pageBody);
        setStatusMessage({ type: "success", text: `Konten '${pageTitle}' berhasil diperbarui!` });
        setTimeout(() => setStatusMessage(null), 3000);
      } catch {
        setStatusMessage({ type: "error", text: "Gagal memperbarui konten." });
      }
    });
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createAnnouncement(newAnnounceTitle, newAnnounceBody, newAnnouncePublish);
        setNewAnnounceTitle("");
        setNewAnnounceBody("");
        setShowNewAnnounce(false);
        setStatusMessage({ type: "success", text: "Pengumuman baru berhasil diterbitkan!" });
        setTimeout(() => setStatusMessage(null), 3000);
      } catch {
        setStatusMessage({ type: "error", text: "Gagal menerbitkan pengumuman." });
      }
    });
  };

  const handleTogglePublish = (id: string) => {
    startTransition(async () => {
      try {
        await toggleAnnouncementPublish(id);
      } catch {
        alert("Gagal mengubah status pengumuman");
      }
    });
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm("Hapus pengumuman ini secara permanen?")) {
      startTransition(async () => {
        try {
          await deleteAnnouncement(id);
        } catch {
          alert("Gagal menghapus pengumuman");
        }
      });
    }
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    startTransition(async () => {
      const res = await createSubject(newSubjectName);
      if (res.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else {
        setNewSubjectName("");
        setStatusMessage({ type: "success", text: "Mata pelajaran baru berhasil ditambahkan." });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    });
  };

  const handleToggleSubject = (id: string) => {
    startTransition(async () => {
      const res = await toggleSubjectActive(id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleSaveEditSubject = (id: string, currentActive: boolean) => {
    if (!editingSubjectName.trim()) return;
    startTransition(async () => {
      const res = await updateSubject(id, editingSubjectName, currentActive);
      if (res.error) {
        alert(res.error);
      } else {
        setEditingSubjectId(null);
        setEditingSubjectName("");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1F4B]">Pengaturan & Konten Web</h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola parameter operasional, teks halaman statis, dan pengumuman resmi
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "settings"
              ? "border-[#0B1F4B] text-[#0B1F4B]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Settings className="w-4 h-4" />
          Pengaturan Sistem
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("announcements")}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "announcements"
              ? "border-[#0B1F4B] text-[#0B1F4B]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Bell className="w-4 h-4" />
          Pengumuman ({announcements.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pages")}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "pages"
              ? "border-[#0B1F4B] text-[#0B1F4B]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileEdit className="w-4 h-4" />
          Halaman Konten (Markdown)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subjects")}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "subjects"
              ? "border-[#0B1F4B] text-[#0B1F4B]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Mata Pelajaran ({subjects.length})
        </button>
      </div>

      {/* Tab 1: Settings */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 md:p-8 rounded-b-xl border border-slate-200 shadow-sm space-y-6">
          <div className="max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Waktu Penutupan Pendaftaran (WIB)
              </label>
              <input
                type="datetime-local"
                value={regCloseDate}
                onChange={(e) => setRegCloseDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Kosongkan input untuk membiarkan pendaftaran terbuka tanpa batas waktu otomatis.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Batas Kuota Tampilan Peringkat Publik (`publicRankingLimit`)
              </label>
              <input
                type="number"
                min={1}
                value={rankingLimit}
                onChange={(e) => setRankingLimit(e.target.value)}
                placeholder="Kosongkan untuk menampilkan semua peserta"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Misal isi 10 untuk hanya menampilkan 10 besar ke peserta. Kosongkan untuk menampilkan seluruh peringkat.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0B1F4B] hover:bg-[#0B1F4B]/90 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Announcements */}
      {activeTab === "announcements" && (
        <div className="bg-white p-6 md:p-8 rounded-b-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0B1F4B]">Daftar Pengumuman Resmi</h2>
            <button
              type="button"
              onClick={() => setShowNewAnnounce(!showNewAnnounce)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#C9A227] hover:bg-[#B38F22] rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {showNewAnnounce ? "Tutup Form" : "Buat Pengumuman"}
            </button>
          </div>

          {showNewAnnounce && (
            <form onSubmit={handleCreateAnnouncement} className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Form Pengumuman Baru</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  value={newAnnounceTitle}
                  onChange={(e) => setNewAnnounceTitle(e.target.value)}
                  placeholder="Contoh: Perubahan Jadwal Sesi Ujian Matematika"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Pesan</label>
                <textarea
                  rows={4}
                  required
                  value={newAnnounceBody}
                  onChange={(e) => setNewAnnounceBody(e.target.value)}
                  placeholder="Tuliskan isi pengumuman secara rinci..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pubNow"
                  checked={newAnnouncePublish}
                  onChange={(e) => setNewAnnouncePublish(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B1F4B]"
                />
                <label htmlFor="pubNow" className="text-xs text-slate-700">
                  Langsung publikasikan ke halaman beranda
                </label>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#0B1F4B] hover:bg-[#0B1F4B]/90 rounded-lg"
              >
                {isPending ? "Menerbitkan..." : "Terbitkan Pengumuman"}
              </button>
            </form>
          )}

          {announcements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">Belum ada pengumuman yang dibuat.</div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {announcements.map((item) => (
                <div key={item.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0B1F4B]">{item.title}</span>
                      {item.isPublished ? (
                        <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                          Dipublikasikan
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Draft (Disembunyikan)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-line">{item.body}</p>
                    <span className="text-[11px] text-slate-400 block pt-1">
                      Dibuat pada: {formatWIB(item.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleTogglePublish(item.id)}
                      title={item.isPublished ? "Sembunyikan" : "Tampilkan"}
                      className="p-1.5 text-slate-600 hover:text-[#0B1F4B] hover:bg-slate-100 rounded border border-slate-200"
                    >
                      {item.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteAnnouncement(item.id)}
                      title="Hapus Pengumuman"
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Content Pages */}
      {activeTab === "pages" && (
        <form onSubmit={handleSavePage} className="bg-white p-6 md:p-8 rounded-b-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0B1F4B]">Edit Halaman Statis</h2>
              <p className="text-xs text-slate-500">Pilih halaman yang ingin diperbarui konten teks atau panduannya</p>
            </div>

            <select
              value={selectedPageKey}
              onChange={(e) => handleSelectPage(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#0B1F4B]"
            >
              {contentPages.map((page) => (
                <option key={page.key} value={page.key}>
                  {page.title} ({page.key})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Judul Halaman
              </label>
              <input
                type="text"
                required
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Isi Konten (Format Markdown)
              </label>
              <textarea
                rows={12}
                required
                value={pageBody}
                onChange={(e) => setPageBody(e.target.value)}
                className="w-full font-mono text-xs p-3.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] focus:border-transparent outline-none leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0B1F4B] hover:bg-[#0B1F4B]/90 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan Konten"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: Kelola Mata Pelajaran (Bab 7.G) */}
      {activeTab === "subjects" && (
        <div className="bg-white p-6 md:p-8 rounded-b-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-[#0B1F4B]">Kelola Mata Pelajaran</h2>
            <p className="text-xs text-slate-500">
              Tambah mata pelajaran baru, perbarui nama, atau aktifkan/nonaktifkan dari pendaftaran
            </p>
          </div>

          {/* Form Tambah Mapel */}
          <form onSubmit={handleCreateSubject} className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="Nama mata pelajaran baru..."
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              required
              className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1F4B] outline-none"
            />
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-[#0B1F4B] hover:bg-[#0B1F4B]/90 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              Tambah Mapel
            </button>
          </form>

          {/* Tabel Mapel */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Mata Pelajaran</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Ujian Terkait</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {editingSubjectId === sub.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingSubjectName}
                            onChange={(e) => setEditingSubjectName(e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditSubject(sub.id, sub.isActive)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubjectId(null)}
                            className="px-2 py-1 border border-slate-300 text-slate-600 rounded text-[11px]"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <span>{sub.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {sub.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-600">
                      {sub.examCount}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {editingSubjectId !== sub.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubjectId(sub.id);
                            setEditingSubjectName(sub.name);
                          }}
                          className="px-2.5 py-1 text-slate-600 hover:text-navy hover:bg-slate-100 rounded text-[11px] font-semibold"
                        >
                          Ubah Nama
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleSubject(sub.id)}
                        disabled={isPending}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                          sub.isActive
                            ? "text-rose-600 hover:bg-rose-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {sub.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
