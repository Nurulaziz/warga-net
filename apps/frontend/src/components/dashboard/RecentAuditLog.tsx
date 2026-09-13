import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { api } from '@/services/api';
import { humanizeAuditAction } from '@/lib/auditLogHumanize';

interface AuditEntry {
  id: string;
  action: string;
  resource: string | null;
  createdAt: string;
  user: { fullName: string } | null;
}

// Waktu relatif sederhana dalam Bahasa Indonesia
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function RecentAuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data } = await api.get('/audit-logs', { params: { limit: 5 } });
        setLogs(data.data || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-lg font-bold text-ink dark:text-gray-100">
            Aktivitas Terbaru
          </h3>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            5 log sistem terakhir
          </p>
        </div>
        <Link
          to="/audit-log"
          className="text-sm font-bold text-ink underline-offset-4 hover:underline dark:text-gray-200"
        >
          Lihat semua
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="border-t-2 border-ink/20 py-6 dark:border-gray-600">
          <p className="text-sm font-bold text-ink dark:text-gray-100">Belum ada aktivitas</p>
          <p className="mt-1 text-sm text-ink-secondary dark:text-gray-300">
            Perubahan terbaru akan tercatat di sini.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {logs.map((log) => (
            <li
              key={log.id}
              className="border-b-2 border-ink/20 py-2.5 last:border-0 dark:border-gray-600"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-medium">{log.user?.fullName || 'Sistem'}</span>{' '}
                  <span className="text-gray-600 dark:text-gray-400">
                    {humanizeAuditAction(log.action, log.resource)}
                  </span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(log.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
