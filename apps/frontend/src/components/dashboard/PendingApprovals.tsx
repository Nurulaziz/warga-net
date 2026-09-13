import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { BanknotesIcon, DocumentTextIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { api } from '@/services/api';
import { formatCurrency } from '@/lib/format';

// Periode bulan berjalan format "YYYY-MM"
function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

interface PendingData {
  unpaidBills: number;
  unpaidAmount: number;
  pendingLetters: number;
}

export function PendingApprovals() {
  const [data, setData] = useState<PendingData>({
    unpaidBills: 0,
    unpaidAmount: 0,
    pendingLetters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [billsRes, lettersRes] = await Promise.all([
          api.get('/bills/summary', { params: { period: currentPeriod() } }),
          api.get('/letters', { params: { status: 'draft', limit: 1 } }),
        ]);
        setData({
          unpaidBills: billsRes.data.unpaidBills || 0,
          unpaidAmount: billsRes.data.unpaidAmount || 0,
          pendingLetters: lettersRes.data.meta?.total || 0,
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const nothingPending = data.unpaidBills === 0 && data.pendingLetters === 0;

  return (
    <Card className="p-6">
      <h3 className="mb-1 font-display text-lg font-bold text-ink dark:text-gray-100">
        Menunggu Persetujuan
      </h3>
      <p className="mb-5 text-sm font-medium text-gray-700 dark:text-gray-300">
        Item yang butuh tindakan Anda
      </p>

      {loading ? (
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      ) : nothingPending ? (
        <div className="mt-5 border-t-2 border-ink/20 py-6 dark:border-gray-600">
          <p className="text-sm font-bold text-ink dark:text-gray-100">Semua sudah ditangani</p>
          <p className="mt-1 text-sm text-ink-secondary dark:text-gray-300">
            Belum ada iuran atau surat yang perlu ditindaklanjuti.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <PendingItem
            to="/bills"
            icon={<BanknotesIcon className="h-5 w-5" />}
            title={`${data.unpaidBills} Iuran Belum Lunas`}
            subtitle={`Nilai: ${formatCurrency(data.unpaidAmount)} (bulan ini)`}
          />
          <PendingItem
            to="/letters"
            icon={<DocumentTextIcon className="h-5 w-5" />}
            title={`${data.pendingLetters} Pengajuan Surat`}
            subtitle="Menunggu diterbitkan / ditandatangani"
          />
        </div>
      )}
    </Card>
  );
}

function PendingItem({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-[44px] items-center gap-3 rounded-[var(--radius-control)] border-2 border-ink bg-[var(--surface-card)] p-3 transition-colors hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-ink/30 focus:ring-offset-2 dark:border-gray-400"
    >
      <div className="rounded-[var(--radius-control)] border-2 border-ink bg-[var(--surface-selected)] p-2 text-ink dark:border-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{subtitle}</p>
      </div>
      <ChevronRightIcon className="w-5 h-5 text-gray-400 shrink-0" />
    </Link>
  );
}
