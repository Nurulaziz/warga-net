// Terjemahkan aksi audit log (format "{resource}.{action}", mis. "users.update")
// menjadi kalimat Bahasa Indonesia yang ramah pengguna.
// Contoh: "Sistem users.update · users" → "Sistem memperbarui data pengguna".

const RESOURCE_NOUN: Record<string, string> = {
  residents: 'data warga',
  families: 'data keluarga',
  users: 'data pengguna',
  roles: 'peran pengguna',
  permissions: 'hak akses',
  bills: 'tagihan iuran',
  cash: 'transaksi kas',
  announcements: 'pengumuman',
  letters: 'pengajuan surat',
  settings: 'pengaturan',
  posts: 'postingan',
  comments: 'komentar',
  notifications: 'notifikasi',
};

const RESOURCE_LABEL: Record<string, string> = {
  residents: 'Warga',
  families: 'Keluarga',
  users: 'Pengguna',
  roles: 'Peran & Akses',
  permissions: 'Peran & Akses',
  bills: 'Iuran',
  cash: 'Kas RT',
  announcements: 'Pengumuman',
  posts: 'Suara Warga',
  comments: 'Suara Warga',
  letters: 'Surat',
  settings: 'Pengaturan',
  notifications: 'Notifikasi',
};

const ACTION_VERB: Record<string, string> = {
  create: 'menambah',
  update: 'memperbarui',
  delete: 'menghapus',
};

export function humanizeAuditAction(action: string, resource: string | null): string {
  const [res = '', verb = ''] = action.split('.');
  const noun = RESOURCE_NOUN[res] || RESOURCE_NOUN[resource || ''] || res || 'data';
  const sentenceVerb = ACTION_VERB[verb];

  if (sentenceVerb) {
    return `${sentenceVerb} ${noun}`;
  }

  // Aksi tidak dikenal — fallback ke bentuk pasif yang tetap terbaca natural
  return `melakukan ${verb || 'aksi'} pada ${noun}`;
}

export function humanizeAuditResource(resource: string | null): string {
  if (!resource) return 'Lainnya';
  return RESOURCE_LABEL[resource] || resource.replace(/[-_]/g, ' ');
}

export function humanizeAuditSource(ipAddress: string): string {
  const normalized = ipAddress.replace(/^::ffff:/, '');
  if (normalized === '127.0.0.1' || normalized === '::1') return 'Perangkat lokal';
  if (!normalized || normalized === 'unknown') return 'Tidak diketahui';
  return normalized;
}
