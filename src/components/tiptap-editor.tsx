"use client";

import { useEditor, EditorContent, type Extensions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Subscript as SubIcon,
  Superscript as SuperIcon,
  List,
  ListOrdered,
  Table as TableIcon,
  ImageIcon,
  Sigma,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  allowImage?: boolean;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  allowImage = false,
}: TiptapEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extensions: Extensions = [
    StarterKit,
    Underline,
    Subscript,
    Superscript,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
  ];

  if (allowImage) {
    extensions.push(
      Image.configure({
        inline: true,
        allowBase64: true,
      })
    );
  }

  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        className:
          "min-h-[140px] p-3 text-sm focus:outline-none max-w-none prose prose-slate",
      },
    },
  });

  if (!editor) {
    return (
      <div className="border border-slate-300 rounded-lg p-4 text-xs text-slate-400">
        Memuat editor...
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      } else {
        alert(data.error || "Gagal mengunggah gambar.");
      }
    } catch {
      alert("Terjadi kendala saat mengunggah gambar.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleInsertMath = () => {
    const latex = prompt("Masukkan rumus LaTeX (contoh: \\frac{a}{b} atau x^2 + y^2 = r^2):");
    if (latex) {
      editor.chain().focus().insertContent(`$${latex.trim()}$`).run();
    }
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#0B1F4B] focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-50 border-b border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("bold")
              ? "bg-[#0B1F4B] text-white"
              : "text-slate-700 hover:bg-slate-200"
          }`}
          title="Tebal (Bold)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("italic")
              ? "bg-[#0B1F4B] text-white"
              : "text-slate-700 hover:bg-slate-200"
          }`}
          title="Miring (Italic)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("underline")
              ? "bg-[#0B1F4B] text-white"
              : "text-slate-700 hover:bg-slate-200"
          }`}
          title="Garis Bawah (Underline)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("subscript")
              ? "bg-[#0B1F4B] text-white"
              : "text-slate-700 hover:bg-slate-200"
          }`}
          title="Indeks Bawah (Subscript)"
        >
          <SubIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("superscript")
              ? "bg-[#0B1F4B] text-white"
              : "text-slate-700 hover:bg-slate-200"
          }`}
          title="Pangkat Atas (Superscript)"
        >
          <SuperIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("bulletList")
              ? "bg-[#0B1F4B] text-white"
              : "text-slate-700 hover:bg-slate-200"
          }`}
          title="Daftar Butir"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive("orderedList")
              ? "bg-[#0B1F4B] text-white"
              : "text-slate-700 hover:bg-slate-200"
          }`}
          title="Daftar Nomor"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className="p-1.5 rounded text-xs text-slate-700 hover:bg-slate-200 transition-colors"
          title="Sisipkan Tabel"
        >
          <TableIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleInsertMath}
          className="p-1.5 rounded text-xs text-slate-700 hover:bg-slate-200 transition-colors"
          title="Sisipkan Rumus Matematika (KaTeX)"
        >
          <Sigma className="w-3.5 h-3.5" />
        </button>

        {/* Tombol Gambar Khusus Teks Soal */}
        {allowImage && (
          <>
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded text-xs text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
              title="Unggah Gambar Soal (Maks 2 MB)"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            {isUploading && (
              <span className="text-[10px] text-[#0B1F4B] font-semibold animate-pulse">
                Mengunggah...
              </span>
            )}
          </>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
