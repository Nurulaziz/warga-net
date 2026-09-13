import { useState, useEffect } from 'react';
import { StatCard } from './StatCard';
import {
  UserGroupIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/services/api';
import { formatCurrency } from '@/lib/format';

// Periode bulan berjalan format "YYYY-MM"
function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

interface Metrics {
  totalResidents: number;
  totalFamilies: number;
  balance: number;
  unpaidBills: number;
  pendingLetters: number;
}

interface MetricResponse {
  meta?: { total?: number };
  balance?: number;
  unpaidBills?: number;
}

export function TopMetrics() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalResidents: 0,
    totalFamilies: 0,
    balance: 0,
    unpaidBills: 0,
    pendingLetters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      const period = currentPeriod();
      try {
        const results = await Promise.allSettled([
          api.get('/residents', { params: { limit: 1 } }),
          api.get('/families', { params: { limit: 1 } }),
          api.get('/cash/summary'),
          api.get('/bills/summary', { params: { period } }),
          api.get('/letters', { params: { status: 'draft', limit: 1 } }),
        ]);

        const value = <T,>(index: number, fallback: T, read: (data: MetricResponse) => T) => {
          const result = results[index];
          return result.status === 'fulfilled' ? read(result.value.data) : fallback;
        };
        setMetrics({
          totalResidents: value(0, 0, (data) => data.meta?.total || 0),
          totalFamilies: value(1, 0, (data) => data.meta?.total || 0),
          balance: value(2, 0, (data) => data.balance || 0),
          unpaidBills: value(3, 0, (data) => data.unpaidBills || 0),
          pendingLetters: value(4, 0, (data) => data.meta?.total || 0),
        });
        setError(results.some((result) => result.status === 'rejected'));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-[var(--surface-hover)] rounded-[var(--radius-control)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs font-semibold text-ink-secondary">
          Sebagian data belum tersedia.{' '}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-ink/30"
          >
            Coba muat ulang
          </button>
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          to="/residents"
          icon={<UserGroupIcon className="w-6 h-6" aria-hidden="true" />}
          value={`${metrics.totalResidents} Warga (${metrics.totalFamilies} KK)`}
          label="Total Warga & Keluarga"
        />
        <StatCard
          to="/cash"
          icon={<BanknotesIcon className="w-6 h-6" aria-hidden="true" />}
          value={formatCurrency(metrics.balance)}
          label="Saldo Kas RT"
          valueClassName={metrics.balance < 0 ? 'text-red-600 dark:text-rose-400' : ''}
          badge={
            metrics.balance < 0
              ? {
                  text: 'Defisit',
                  className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-rose-400',
                }
              : undefined
          }
        />
        <StatCard
          to="/bills"
          icon={<ExclamationTriangleIcon className="w-6 h-6" aria-hidden="true" />}
          value={metrics.unpaidBills.toString()}
          label="Iuran Belum Lunas (Bulan Ini)"
        />
        <StatCard
          to="/letters"
          icon={<DocumentTextIcon className="w-6 h-6" aria-hidden="true" />}
          value={metrics.pendingLetters.toString()}
          label="Permohonan Surat Pending"
        />
      </div>
    </div>
  );
}
