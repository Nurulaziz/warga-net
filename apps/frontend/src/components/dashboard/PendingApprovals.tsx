import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import {
  BanknotesIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
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
  const [data, setData] = useState<PendingData>({ unpaidBills: 0, unpaidAmount: 0, pendingLetters: 0 });
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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Menunggu Persetujuan</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Item yang butuh tindakan Anda</p>

      {loading ? (
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      ) : nothingPending ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircleIcon className="w-10 h-10 text-green-500 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada item yang menunggu tindakan</p>
        </div>
      ) : (
        <div className="space-y-3">
          <PendingItem
            to="/bills"
            icon={<BanknotesIcon className="w-5 h-5 text-yellow-600" />}
            iconBg="bg-yellow-100 dark:bg-yellow-900/30"
            title={`${data.unpaidBills} Iuran Belum Lunas`}
            subtitle={`Nilai: ${formatCurrency(data.unpaidAmount)} (bulan ini)`}
          />
          <PendingItem
            to="/letters"
            icon={<DocumentTextIcon className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-100 dark:bg-blue-900/30"
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
  iconBg,
  title,
  subtitle,
}: {
  to: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors min-h-[44px]"
    >
      <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
      </div>
      <ChevronRightIcon className="w-5 h-5 text-gray-400 shrink-0" />
    </Link>
  );
}
