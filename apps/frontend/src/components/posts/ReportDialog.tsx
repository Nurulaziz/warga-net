import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ReportReason } from '@/types/posts';

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Pelecehan' },
  { value: 'INAPPROPRIATE', label: 'Konten tidak pantas' },
  { value: 'MISINFORMATION', label: 'Informasi keliru' },
  { value: 'FRAUD', label: 'Penipuan' },
  { value: 'OTHER', label: 'Lainnya' },
];

export function ReportDialog({
  open,
  onClose,
  onSubmit,
  title = 'Laporkan posting',
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, description?: string) => Promise<void>;
  title?: string;
}) {
  const [reason, setReason] = useState<ReportReason>('SPAM');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(reason, description.trim() || undefined);
      setDescription('');
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-dialog-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-sm border-2 border-ink bg-[#fffaf0] shadow-[6px_6px_0_#171717] dark:border-gray-400 dark:bg-gray-800 dark:shadow-[6px_6px_0_#737373]"
      >
        <div className="border-b-2 border-ink px-5 py-4 dark:border-gray-400">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
            Moderasi warga
          </p>
          <h2
            id="report-dialog-title"
            className="mt-1 font-display text-xl font-bold text-ink dark:text-white"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-ink-secondary dark:text-gray-300">
            Laporan akan ditinjau oleh pengurus RT.
          </p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <label className="block text-sm font-bold text-ink dark:text-gray-200">
            Alasan
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="mt-1 min-h-[44px] w-full rounded-sm border-2 border-ink bg-white px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-ink/25 dark:border-gray-400 dark:bg-gray-700 dark:text-white"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold text-ink dark:text-gray-200">
            Keterangan (opsional)
            <textarea
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-sm border-2 border-ink bg-white p-3 text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-ink/25 dark:border-gray-400 dark:bg-gray-700 dark:text-white"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t-2 border-ink px-5 py-4 dark:border-gray-400">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="danger" size="sm" loading={busy}>
            Kirim laporan
          </Button>
        </div>
      </form>
    </div>
  );
}
