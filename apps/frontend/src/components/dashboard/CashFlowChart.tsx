import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card } from '../ui/Card';
import { api } from '@/services/api';
import { formatCurrency } from '@/lib/format';
import { useTheme } from '@/hooks/useTheme';

interface MonthBar {
  label: string; // "Agu"
  period: string; // "2026-08"
  income: number;
  expense: number;
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];
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

// Nilai sumbu Y dibuat ringkas: 100rb, 1jt, dst.
function formatTick(value: number): string {
  if (value >= 1_000_000) return `Rp${value / 1_000_000}jt`;
  if (value >= 1_000) return `Rp${value / 1_000}rb`;
  return `Rp${value}`;
}

export function CashFlowChart() {
  const [bars, setBars] = useState<MonthBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await api.get('/cash/cashflow', { params: { months: MONTHS_TO_SHOW } });
        const months = lastMonths(MONTHS_TO_SHOW);
        const byPeriod = new Map<string, { income: number; expense: number }>();
        if (Array.isArray(data?.data)) {
          for (const row of data.data) {
            if (row && typeof row.month === 'string') {
              byPeriod.set(row.month, {
                income: Number(row.income) || 0,
                expense: Number(row.expense) || 0,
              });
            }
          }
        }
        setBars(
          months.map((m) => ({
            label: m.label,
            period: m.period,
            income: byPeriod.get(m.period)?.income ?? 0,
            expense: byPeriod.get(m.period)?.expense ?? 0,
          })),
        );
      } catch {
        setError(true);
        setBars([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.18)';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  const isEmpty = bars.length > 0 && bars.every((b) => b.income === 0 && b.expense === 0);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Arus Kas RT</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pemasukan vs Pengeluaran ({MONTHS_TO_SHOW} bulan terakhir)
          </p>
        </div>
        <Link
          to="/cash"
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 shrink-0"
        >
          Kas RT
        </Link>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mb-2">
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
      ) : error ? (
        <div className="h-48 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Gagal memuat data arus kas.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Silakan muat ulang halaman.
          </p>
        </div>
      ) : isEmpty ? (
        <div className="h-48 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum ada transaksi kas pada {MONTHS_TO_SHOW} bulan terakhir
          </p>
        </div>
      ) : (
        <div className="h-56 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} barGap={3} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: axisColor, fontSize: 12 }}
                dy={6}
              />
              <YAxis
                width={64}
                tickLine={false}
                axisLine={false}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickFormatter={formatTick}
              />
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.08)' }}
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(15,23,42,0.12)',
                  fontSize: '13px',
                }}
                labelStyle={{ color: axisColor, fontWeight: 600, marginBottom: 4 }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Bar
                dataKey="income"
                name="Pemasukan"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
              <Bar
                dataKey="expense"
                name="Pengeluaran"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
