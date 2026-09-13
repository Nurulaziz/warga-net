import { useCallback, useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  BanknotesIcon,
  BellIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useDismissibleLayer } from '@/hooks/useDismissibleLayer';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceType?: string | null;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
};

function relativeTime(value: string) {
  const formatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });
  const ranges: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Infinity, 'year'],
  ];
  let amount = (new Date(value).getTime() - Date.now()) / 1000;
  for (const [limit, unit] of ranges) {
    if (Math.abs(amount) < limit) return formatter.format(Math.round(amount), unit);
    amount /= limit;
  }
  return new Date(value).toLocaleDateString('id-ID');
}

function targetFor(item: Notification) {
  if (item.referenceType === 'bill' || item.referenceType === 'payment') return '/bills';
  if (item.referenceType === 'announcement' && item.referenceId)
    return `/announcements?open=${encodeURIComponent(item.referenceId)}`;
  if (item.referenceType === 'post' && item.referenceId) return `/suara-warga/${item.referenceId}`;
  if (item.referenceType === 'letter') return '/letters';
  return null;
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'bill_created' || type === 'payment_received')
    return <BanknotesIcon className="h-4 w-4" aria-hidden="true" />;
  if (type.includes('letter') || type.includes('announcement'))
    return <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />;
  return <BellIcon className="h-4 w-4" aria-hidden="true" />;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { rootRef, triggerRef } = useDismissibleLayer(open, () => setOpen(false));

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const { data } = await api.get('/notifications', { params: { limit: 20 } });
      setItems(Array.isArray(data.data) ? data.data : []);
      setUnread(Number(data.unread) || 0);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    const timer = window.setInterval(() => void load(), 60000);
    const refresh = () => document.visibilityState === 'visible' && void load();
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);

  useEffect(() => {
    if (open) void load(true);
  }, [open, load]);

  async function openItem(item: Notification) {
    if (!item.isRead) {
      try {
        await api.patch(`/notifications/${item.id}/read`);
        setItems((current) =>
          current.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)),
        );
        setUnread((current) => Math.max(0, current - 1));
      } catch {
        showToast('Notifikasi belum dapat ditandai sebagai dibaca.', 'error');
        return;
      }
    }
    const target = targetFor(item);
    if (target) {
      setOpen(false);
      navigate(target);
    }
  }

  async function readAll() {
    try {
      await api.patch('/notifications/read-all');
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnread(0);
      setError(false);
    } catch {
      showToast('Notifikasi belum dapat ditandai sebagai dibaca.', 'error');
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ''}`}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-sm border-2 border-ink bg-[var(--surface-card)] text-ink shadow-[var(--shadow-small)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-ink/30 focus:ring-offset-1"
      >
        <BellIcon className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-brand-500 px-1 text-[10px] font-black text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Daftar notifikasi"
          className="fixed inset-x-3 top-16 z-50 max-h-[calc(100dvh-5rem)] overflow-hidden rounded-sm border-2 border-ink bg-[var(--surface-card)] shadow-[var(--shadow-card)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96"
        >
          <div className="flex min-h-12 items-center justify-between gap-3 border-b-2 border-ink px-4 py-3">
            <span className="font-black">Notifikasi</span>
            {unread > 0 && (
              <button
                onClick={() => void readAll()}
                className="text-xs font-bold underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-ink/30"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="max-h-[min(24rem,calc(100dvh-9rem))] overflow-y-auto" aria-live="polite">
            {loading ? (
              <div className="space-y-3 p-4" aria-label="Memuat notifikasi">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-sm bg-ink/10" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center px-5 py-8 text-center">
                <p className="text-sm font-black">Notifikasi belum dapat dimuat</p>
                <p className="mt-1 text-xs font-medium text-ink-secondary">
                  Periksa koneksi lalu coba kembali.
                </p>
                <button
                  onClick={() => void load(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-sm border-2 border-ink bg-[var(--surface-card)] px-3 py-2 text-xs font-black shadow-[var(--shadow-small)] hover:bg-[var(--surface-hover)]"
                >
                  <ArrowPathIcon className="h-4 w-4" /> Coba lagi
                </button>
              </div>
            ) : items.length ? (
              items.map((item) => {
                return (
                  <button
                    key={item.id}
                    onClick={() => void openItem(item)}
                    aria-label={`${item.title}${!item.isRead ? ', belum dibaca' : ''}`}
                    className={`w-full border-b border-ink/15 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ink/30 ${!item.isRead ? 'bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-card))]' : ''}`}
                  >
                    <span className="flex gap-3">
                      <span
                        className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-sm border border-ink ${!item.isRead ? 'bg-brand-500 text-white' : 'bg-[var(--surface-hover)] text-ink-secondary'}`}
                      >
                        <TypeIcon type={item.type} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm ${item.isRead ? 'font-bold' : 'font-black'}`}
                        >
                          {item.title}
                        </span>
                        <span className="mt-1 block text-xs font-medium leading-relaxed text-ink-secondary">
                          {item.message}
                        </span>
                        <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                          {relativeTime(item.createdAt)}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-5 py-10 text-center">
                <BellIcon className="mx-auto h-7 w-7 text-ink-muted" />
                <p className="mt-3 text-sm font-black">Belum ada notifikasi</p>
                <p className="mt-1 text-xs font-medium text-ink-secondary">
                  Pembaruan penting akan muncul di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
