import { useState, useEffect } from 'react';
import { DocumentTextIcon, UsersIcon, HomeModernIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { api } from '@/services/api';

interface Stats {
  totalUsers: number;
  totalFamilies: number;
  totalResidents: number;
  totalRoles: number;
}

export function ReportsPage() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalFamilies: 0, totalResidents: 0, totalRoles: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, familiesRes, residentsRes, rolesRes] = await Promise.all([
          api.get('/users', { params: { limit: 1 } }),
          api.get('/families', { params: { limit: 1 } }),
          api.get('/residents', { params: { limit: 1 } }),
          api.get('/roles'),
        ]);
        setStats({
          totalUsers: usersRes.data.meta?.total || 0,
          totalFamilies: familiesRes.data.meta?.total || 0,
          totalResidents: residentsRes.data.meta?.total || 0,
          totalRoles: Array.isArray(rolesRes.data) ? rolesRes.data.length : 0,
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Pengguna', value: stats.totalUsers, icon: UsersIcon, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Keluarga', value: stats.totalFamilies, icon: HomeModernIcon, color: 'text-green-600 bg-green-50' },
    { label: 'Total Warga', value: stats.totalResidents, icon: UserGroupIcon, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Role', value: stats.totalRoles, icon: DocumentTextIcon, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Laporan</h1>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card) => (
              <Card key={card.label} className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Ringkasan Data</h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Terdapat <strong>{stats.totalUsers}</strong> pengguna terdaftar dalam sistem.</p>
              <p>• Terdapat <strong>{stats.totalFamilies}</strong> keluarga (KK) yang tercatat.</p>
              <p>• Total <strong>{stats.totalResidents}</strong> warga terdaftar.</p>
              <p>• Sistem menggunakan <strong>{stats.totalRoles}</strong> role untuk manajemen hak akses.</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
