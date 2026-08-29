// Sumber kebenaran metadata halaman: judul tab & label breadcrumb per path.
// Dipakai oleh useDocumentTitle dan komponen Breadcrumb.

export interface PageMeta {
  title: string; // Judul untuk tab browser & breadcrumb
  group?: string; // Grup induk untuk breadcrumb (opsional)
}

export const PAGE_META: Record<string, PageMeta> = {
  '/dashboard': { title: 'Dashboard' },
  '/residents': { title: 'Warga', group: 'Data Warga' },
  '/families': { title: 'Keluarga', group: 'Data Warga' },
  '/users': { title: 'Pengguna Sistem', group: 'Pengguna & Akses' },
  '/roles': { title: 'Role & Permission', group: 'Pengguna & Akses' },
  '/bills': { title: 'Iuran', group: 'Keuangan' },
  '/cash': { title: 'Kas RT', group: 'Keuangan' },
  '/reports': { title: 'Laporan', group: 'Keuangan' },
  '/announcements': { title: 'Pengumuman', group: 'Komunikasi' },
  '/letters': { title: 'Surat', group: 'Komunikasi' },
  '/audit-log': { title: 'Audit Log', group: 'Sistem' },
  '/settings': { title: 'Pengaturan', group: 'Sistem' },
  '/profile': { title: 'Profil Saya' },
};

// Metadata untuk halaman detail dinamis (path dengan parameter, mis. /families/:id)
const DYNAMIC_PAGE_META: { prefix: string; meta: PageMeta }[] = [
  { prefix: '/families/', meta: { title: 'Detail Keluarga', group: 'Data Warga' } },
];

// Ambil metadata halaman dari pathname; fallback untuk path tak dikenal
export function getPageMeta(pathname: string): PageMeta {
  const exact = PAGE_META[pathname];
  if (exact) return exact;

  // Cocokkan path dinamis (mis. /families/<id>)
  const dynamic = DYNAMIC_PAGE_META.find(
    (d) => pathname.startsWith(d.prefix) && pathname.length > d.prefix.length,
  );
  if (dynamic) return dynamic.meta;

  return { title: 'Halaman Tidak Ditemukan' };
}
