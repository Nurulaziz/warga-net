import {
  TopMetrics,
  CashFlowChart,
  PendingApprovals,
  RecentAuditLog,
  RecentAnnouncements,
} from '../components/dashboard';
import { Navigate } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
  const { settings } = useSettings();
  const { isAdmin } = useAuth();

  // Warga tidak punya dashboard; arahkan ke halaman Iuran sebagai halaman utama
  if (!isAdmin()) {
    return <Navigate to="/bills" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Selamat datang di {settings.app_name}
          </p>
        </div>

        {/* Metric ringkas: 4 kartu operasional utama */}
        <TopMetrics />

        {/* Kiri: grafik keuangan + pengumuman · Kanan: panel aksi & aktivitas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <CashFlowChart />
            <RecentAnnouncements limit={5} />
          </div>
          <div className="space-y-6">
            <PendingApprovals />
            <RecentAuditLog />
          </div>
        </div>
      </div>
    </div>
  );
}
