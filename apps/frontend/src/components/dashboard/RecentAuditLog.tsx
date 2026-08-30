import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { ClockIcon } from '@heroicons/react/24/outline';
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Aktivitas Terbaru
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">5 log sistem terakhir</p>
        </div>
        <Link
          to="/audit-log"
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
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
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ClockIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada aktivitas</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
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
