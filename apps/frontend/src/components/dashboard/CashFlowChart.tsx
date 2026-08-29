import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { api } from '@/services/api';
import { formatCurrency } from '@/lib/format';

interface MonthBar {
  label: string; // "Agu"
  period: string; // "2026-08"
  income: number;
  expense: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_TO_SHOW = 6;

// Daftar N bulan terakhir termasuk bulan berjalan
function lastMonths(count: number): { label: string; period: string }[] {
  const result: { label: string; period: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({ label: MONTH_LABELS[d.getMonth()], period });
  }
  return result;
}

export function CashFlowChart() {
  const [bars, setBars] = useState<MonthBar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const months = lastMonths(MONTHS_TO_SHOW);
      try {
        const results = await Promise.all(
          months.map((m) => api.get('/cash/summary', { params: { month: m.period } })),
        );
        setBars(
          months.map((m, i) => ({
            label: m.label,
            period: m.period,
            income: results[i].data.monthIncome || 0,
            expense: results[i].data.monthExpense || 0,
          })),
        );
      } catch {
        setBars(months.map((m) => ({ label: m.label, period: m.period, income: 0, expense: 0 })));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const maxValue = Math.max(1, ...bars.flatMap((b) => [b.income, b.expense]));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Arus Kas RT</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Pemasukan vs Pengeluaran ({MONTHS_TO_SHOW} bulan terakhir)</p>

      {/* Legenda */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Pemasukan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Pengeluaran</span>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-3 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3 h-48 pt-4" role="img" aria-label="Grafik arus kas bulanan">
          {bars.map((bar) => (
            <div key={bar.period} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-1 h-full">
                <div
                  className="flex-1 max-w-[16px] bg-emerald-500 rounded-t hover:bg-emerald-600 transition-colors"
                  style={{ height: `${(bar.income / maxValue) * 100}%` }}
                  title={`Pemasukan ${bar.label}: ${formatCurrency(bar.income)}`}
                />
                <div
                  className="flex-1 max-w-[16px] bg-red-500 rounded-t hover:bg-red-600 transition-colors"
                  style={{ height: `${(bar.expense / maxValue) * 100}%` }}
                  title={`Pengeluaran ${bar.label}: ${formatCurrency(bar.expense)}`}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{bar.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
