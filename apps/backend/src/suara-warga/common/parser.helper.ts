/**
 * Parser untuk ekstraksi hashtag (#tag) dan mention (@Nama) dari konten.
 * Hashtag dinormalisasi ke lowercase tanpa simbol '#'. Mention dikembalikan
 * sebagai nama lengkap dan harus di-resolve ke userId oleh pemanggil.
 */

export function normalizeHashtag(raw: string): string {
  return raw.toLowerCase();
}

export function extractHashtags(content: string): string[] {
  const matches = content.match(/#([\p{L}\p{N}_]+)/gu);
  if (!matches) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of matches) {
    const tag = normalizeHashtag(m.slice(1));
    if (tag.length > 0 && !seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
    }
  }
  return result;
}

export function extractMentions(content: string): string[] {
  const matches = content.match(/@([\p{L}\p{N} .\-']+)/gu);
  if (!matches) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of matches) {
    const name = m.slice(1).trim();
    if (name.length > 0 && !seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}
