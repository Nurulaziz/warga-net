import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  MegaphoneIcon,
  EnvelopeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RecentAnnouncements } from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { api } from '@/services/api';

interface Bill {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  period: string;
  billType: { id: string; name: string };
}

interface Summary {
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

export function WargaDashboard() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingOnline, setPayingOnline] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, billsRes] = await Promise.all([
        api.get('/bills/summary'),
        api.get('/bills', { params: { limit: 50 } }),
      ]);
      setSummary(summaryRes.data);
      setBills(billsRes.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load Midtrans Snap.js
  useEffect(() => {
    async function loadSnap() {
      try {
        const { data } = await api.get('/bills/midtrans/config');
        const { clientKey, isProduction } = data as { clientKey: string; isProduction: boolean };
        if (!clientKey) return;
        const scriptUrl = isProduction
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';
        if (document.querySelector(`script[src="${scriptUrl}"]`)) return;
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.setAttribute('data-client-key', clientKey);
        script.async = true;
        document.head.appendChild(script);
      } catch {
        // Midtrans tidak dikonfigurasi
      }
    }
    loadSnap();
  }, []);

  const handlePayOnline = useCallback(
    async (bill: Bill) => {
      setPayingOnline(bill.id);
      try {
        const { data } = await api.post(`/bills/pay/${bill.id}`);
        const { token } = data as { token: string };
        // Verifikasi status ke backend (fallback jika webhook Midtrans tak sampai di lokal)
        const verifyAndRefresh = async () => {
          try {
            await api.post(`/bills/verify/${bill.id}`);
          } catch {
            // abaikan; tetap refresh
          }
          fetchData();
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).snap?.pay(token, {
          onSuccess: verifyAndRefresh,
          onPending: verifyAndRefresh,
          onError: () => {},
          onClose: verifyAndRefresh,
        });
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal memproses pembayaran';
        alert(msg);
      } finally {
        setPayingOnline(null);
      }
    },
    [fetchData],
  );

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  const displayName =
    user?.name && !user.name.startsWith('+') ? user.name : `Warga ${settings.app_name}`;

  const unpaidBills = bills.filter((b) => b.status !== 'paid');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Halo, {displayName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Selamat datang di {settings.app_name}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Ringkasan iuran keluarga */}
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <BanknotesIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Tagihan</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(summary.totalAmount)}
                    </p>
                  </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sudah Dibayar</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(summary.paidAmount)}
                    </p>
                  </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Belum Dibayar</p>
                    <p className="text-lg font-bold text-yellow-600">
                      {formatCurrency(summary.unpaidAmount)}
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* Tagihan belum dibayar */}
            <Card className="p-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Tagihan Belum Dibayar
              </h2>
              {unpaidBills.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Semua tagihan sudah lunas. Terima kasih!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unpaidBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {bill.billType?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Periode {bill.period} · {formatCurrency(bill.amount)}
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={payingOnline === bill.id}
                        onClick={() => handlePayOnline(bill)}
                      >
                        <CreditCardIcon className="w-4 h-4 mr-1" /> Bayar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Pengumuman terbaru */}
            <RecentAnnouncements limit={3} />

            {/* Akses cepat */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <QuickLink
                to="/announcements"
                icon={<MegaphoneIcon className="w-5 h-5" />}
                label="Pengumuman"
              />
              <QuickLink to="/letters" icon={<EnvelopeIcon className="w-5 h-5" />} label="Surat" />
              <QuickLink
                to="/profile"
                icon={<UserCircleIcon className="w-5 h-5" />}
                label="Profil Saya"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:shadow-sm transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-[#E8F0FF] dark:bg-[#0054A6]/15 flex items-center justify-center text-[#0054A6] dark:text-blue-400">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
    </Link>
  );
}
