import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { MegaphoneIcon } from '@heroicons/react/24/outline';
import { api } from '@/services/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
}

// Metadata prioritas untuk badge
const PRIORITY_META: Record<string, { label: string; className: string }> = {
  low: {
    label: 'Rendah',
    className: 'text-ink-secondary dark:text-gray-400',
  },
  normal: {
    label: 'Normal',
    className: 'text-ink-secondary dark:text-gray-400',
  },
  high: {
    label: 'Penting',
    className: 'font-bold text-orange-700 dark:text-orange-300',
  },
  urgent: {
    label: 'Mendesak',
    className: 'font-bold text-red-700 dark:text-red-300',
  },
};

// Buang tag HTML untuk ringkasan teks
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function RecentAnnouncements({ limit = 5 }: { limit?: number }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Backend otomatis menyaring sesuai role (warga: hanya terbit & scope 'all')
        const { data } = await api.get('/announcements', { params: { limit } });
        setItems(data.data || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [limit]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-lg font-bold text-ink dark:text-gray-100">
            Pengumuman Terbaru
          </h3>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Info terkini dari pengurus RT
          </p>
        </div>
        <Link
          to="/announcements"
          className="text-sm font-bold text-ink underline-offset-4 hover:underline dark:text-gray-200"
        >
          Lihat semua
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[var(--radius-control)] border-2 border-ink bg-[var(--surface-selected)]">
            <MegaphoneIcon className="h-7 w-7 text-ink" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Belum ada pengumuman
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const meta = PRIORITY_META[a.priority] || PRIORITY_META.normal;
            return (
              <li
                key={a.id}
                className="border-b-2 border-ink/20 pb-3 last:border-0 last:pb-0 dark:border-gray-600"
              >
                <Link to="/announcements" className="block group">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                    {a.priority !== 'normal' && (
                      <>
                        <span className="text-xs text-ink-secondary" aria-hidden="true">
                          ·
                        </span>
                        <span className={`text-xs ${meta.className}`}>{meta.label}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                    {a.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {stripHtml(a.content)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
