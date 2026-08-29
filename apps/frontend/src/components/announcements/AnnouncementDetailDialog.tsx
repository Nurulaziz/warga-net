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
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-detail-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#E8F0FF] dark:bg-[#0054A6]/15 flex items-center justify-center flex-shrink-0">
              <MegaphoneIcon className="w-5 h-5 text-[#0054A6] dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Pengumuman</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${meta.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                <span className="text-xs text-gray-400">{formatDate(announcement.createdAt)}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <h2 id="announcement-detail-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {announcement.title}
          </h2>
          <div
            className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 break-words [&_a]:text-primary-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />

          {/* Lampiran */}
          {url && (
            <div className="mt-5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase mb-2">
                <PaperClipIcon className="w-3.5 h-3.5" /> Lampiran
              </div>

              {isImage(url) ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={url}
                    alt={announcement.attachmentName || 'Lampiran pengumuman'}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 max-h-[420px] object-contain bg-gray-50 dark:bg-gray-900"
                  />
                </a>
              ) : isPdf(url) ? (
                <div className="space-y-2">
                  <object data={url} type="application/pdf" className="w-full h-[420px] rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-4 text-sm text-gray-500">
                      Pratinjau PDF tidak tersedia di browser ini.
                    </div>
                  </object>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
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
                  className="inline-flex items-center gap-2 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-900"
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
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
