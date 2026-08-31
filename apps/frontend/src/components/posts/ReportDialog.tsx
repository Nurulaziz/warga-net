import { useState } from 'react';
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800"
      >
        <div>
          <h2 className="text-lg font-semibold dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500">Laporan akan ditinjau oleh pengurus RT.</p>
        </div>
        <label className="block text-sm font-medium dark:text-gray-200">
          Alasan
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            className="mt-1 w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium dark:text-gray-200">
          Keterangan (opsional)
          <textarea
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm">
            Batal
          </button>
          <button
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Kirim laporan
          </button>
        </div>
      </form>
    </div>
  );
}
