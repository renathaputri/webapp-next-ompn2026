/**
 * Normalisasi teks sekolah sesuai aturan PRD Bagian 5:
 * Unicode NFKC, trim, spasi berlebih menjadi satu spasi, huruf kecil.
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Normalisasi nomor WhatsApp sesuai aturan PRD Bagian 5:
 * Hapus karakter non-digit, ubah awalan 08xx / +628xx menjadi 628xx.
 */
export function normalizeWhatsapp(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    return "62" + cleaned.slice(1);
  }
  if (cleaned.startsWith("62")) {
    return cleaned;
  }
  return cleaned;
}
