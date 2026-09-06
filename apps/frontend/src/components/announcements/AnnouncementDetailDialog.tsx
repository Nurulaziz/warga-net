import { useEffect, type ReactNode } from 'react';
import { XMarkIcon, PaperClipIcon, ArrowTopRightOnSquareIcon, MegaphoneIcon } from '@heroicons/react/24/outline';

export interface AnnouncementDetail {
  id: string;
  title: string;
  content: string;
  priority: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
}

export const PRIORITY_META: Record<string, { label: string; badge: string; dot: string }> = {
  low: { label: 'Rendah', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', dot: 'bg-gray-400' },
  normal: { label: 'Normal', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' },
  high: { label: 'Penting', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
};

function isImage(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
}

function isPdf(url: string): boolean {
  return /\.pdf$/i.test(url);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface Props {
  announcement: AnnouncementDetail;
  onClose: () => void;
  footer?: ReactNode; // aksi tambahan di footer (opsional)
}

// Dialog detail pengumuman (judul, isi, dan lampiran gambar/PDF). Dipakai ulang
// oleh popup pertama-buka dan saat warga membuka kembali dari daftar.
export function AnnouncementDetailDialog({ announcement, onClose, footer }: Props) {
  // Tutup dengan ESC + kunci scroll body
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const meta = PRIORITY_META[announcement.priority] || PRIORITY_META.normal;
  const url = announcement.attachmentUrl;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm border-2 border-ink bg-[#fffdf8] shadow-[7px_7px_0_#171717] dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-ink bg-[#fff8ec] px-6 py-4 dark:bg-gray-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border-2 border-ink bg-[#f1dfc4] shadow-[2px_2px_0_#171717]">
              <MegaphoneIcon className="h-5 w-5 text-ink" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600">Pengumuman</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-sm border border-ink px-2 py-0.5 text-xs font-bold ${meta.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                <span className="text-xs font-medium text-ink-secondary dark:text-gray-300">{formatDate(announcement.createdAt)}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm border-2 border-ink bg-white text-ink shadow-[2px_2px_0_#171717] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-[#f1dfc4] hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <h2 id="announcement-detail-title" className="mb-3 font-display text-xl font-black text-ink dark:text-white">
            {announcement.title}
          </h2>
          <div
            className="break-words text-sm font-medium leading-relaxed text-ink-secondary dark:text-gray-200 [&_a]:font-bold [&_a]:text-brand-600 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />

          {/* Lampiran */}
          {url && (
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink">
                <PaperClipIcon className="w-3.5 h-3.5" /> Lampiran
              </div>

              {isImage(url) ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-sm border-2 border-ink bg-white p-2 shadow-[3px_3px_0_#171717]">
                  <img
                    src={url}
                    alt={announcement.attachmentName || 'Lampiran pengumuman'}
                    className="max-h-[420px] w-full object-contain"
                  />
                </a>
              ) : isPdf(url) ? (
                <div className="space-y-2">
                  <object data={url} type="application/pdf" className="h-[420px] w-full rounded-sm border-2 border-ink bg-white shadow-[3px_3px_0_#171717]">
                    <div className="p-4 text-sm font-medium text-ink-secondary">
                      Pratinjau PDF tidak tersedia di browser ini.
                    </div>
                  </object>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:underline"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    Buka {announcement.attachmentName || 'PDF'} di tab baru
                  </a>
                </div>
              ) : (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-sm border-2 border-ink bg-white px-4 py-3 text-sm font-bold text-brand-600 shadow-[3px_3px_0_#171717] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-[#fff8ec] hover:shadow-none"
                >
                  <PaperClipIcon className="w-4 h-4" />
                  {announcement.attachmentName || 'Lihat lampiran'}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-between gap-3 border-t-2 border-ink bg-[#fff8ec] px-6 py-4 dark:bg-gray-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
