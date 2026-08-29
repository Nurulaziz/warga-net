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

export function TopMetrics() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalResidents: 0,
    totalFamilies: 0,
    balance: 0,
    unpaidBills: 0,
    pendingLetters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      const period = currentPeriod();
      try {
        const [residentsRes, familiesRes, cashRes, billsRes, lettersRes] = await Promise.all([
          api.get('/residents', { params: { limit: 1 } }),
          api.get('/families', { params: { limit: 1 } }),
          api.get('/cash/summary'),
          api.get('/bills/summary', { params: { period } }),
          api.get('/letters', { params: { status: 'draft', limit: 1 } }),
        ]);

        setMetrics({
          totalResidents: residentsRes.data.meta?.total || 0,
          totalFamilies: familiesRes.data.meta?.total || 0,
          balance: cashRes.data.balance || 0,
          unpaidBills: billsRes.data.unpaidBills || 0,
          pendingLetters: lettersRes.data.meta?.total || 0,
        });
      } catch {
        // Tetap tampilkan nilai default jika gagal
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
          <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<UserGroupIcon className="w-6 h-6" aria-hidden="true" />}
        value={`${metrics.totalResidents} / ${metrics.totalFamilies} KK`}
        label="Total Warga / Keluarga"
        iconBgColor="bg-primary-500"
      />
      <StatCard
        icon={<BanknotesIcon className="w-6 h-6" aria-hidden="true" />}
        value={formatCurrency(metrics.balance)}
        label="Saldo Kas RT"
        iconBgColor="bg-emerald-500"
      />
      <StatCard
        icon={<ExclamationTriangleIcon className="w-6 h-6" aria-hidden="true" />}
        value={metrics.unpaidBills.toString()}
        label="Iuran Belum Lunas (Bulan Ini)"
        iconBgColor="bg-yellow-500"
      />
      <StatCard
        icon={<DocumentTextIcon className="w-6 h-6" aria-hidden="true" />}
        value={metrics.pendingLetters.toString()}
        label="Permohonan Surat Pending"
        iconBgColor="bg-blue-500"
      />
    </div>
  );
}
