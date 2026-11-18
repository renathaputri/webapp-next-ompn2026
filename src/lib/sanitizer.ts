import sanitizeHtml from "sanitize-html";

/**
 * Sanitasi HTML untuk teks soal (mengizinkan tag pemformatan, tabel, rumus, dan gambar)
 */
export function sanitizeQuestionText(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "sub",
      "sup",
      "ul",
      "ol",
      "li",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "img",
      "span",
      "div",
      "hr",
      "blockquote",
      "code",
      "pre",
    ],
    allowedAttributes: {
      img: ["src", "alt", "title", "width", "height", "class"],
      span: ["class", "style", "data-katex", "data-latex"],
      div: ["class", "style", "data-katex", "data-latex"],
      table: ["class", "border", "cellpadding", "cellspacing"],
      th: ["colspan", "rowspan", "class", "style"],
      td: ["colspan", "rowspan", "class", "style"],
      p: ["class", "style"],
    },
    allowedSchemes: ["http", "https", "data", "blob"],
  });
}

/**
 * Sanitasi HTML untuk pilihan jawaban dan pembahasan.
 * ATURAN KERAS: Tag <img> TIDAK BOLEH ada dan otomatis dibuang.
 */
export function sanitizeTextOnly(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "sub",
      "sup",
      "ul",
      "ol",
      "li",
      "span",
      "div",
      "code",
      "pre",
    ],
    allowedAttributes: {
      span: ["class", "style", "data-katex", "data-latex"],
      div: ["class", "style", "data-katex", "data-latex"],
      p: ["class", "style"],
    },
  });
}
