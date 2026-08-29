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
const PRIORITY_META: Record<string, { label: string; badge: string; dot: string }> = {
  low: { label: 'Rendah', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', dot: 'bg-gray-400' },
  normal: { label: 'Normal', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' },
  high: { label: 'Penting', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
};

// Buang tag HTML untuk ringkasan teks
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pengumuman Terbaru</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Info terkini dari pengurus RT</p>
        </div>
        <Link to="/announcements" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
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
          <MegaphoneIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada pengumuman</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const meta = PRIORITY_META[a.priority] || PRIORITY_META.normal;
            return (
              <li key={a.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-3 last:pb-0">
                <Link to="/announcements" className="block group">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${meta.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                    {a.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{stripHtml(a.content)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
