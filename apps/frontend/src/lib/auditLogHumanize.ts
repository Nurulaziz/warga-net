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
