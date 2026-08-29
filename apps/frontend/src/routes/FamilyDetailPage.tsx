import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  HomeIcon,
  MapPinIcon,
  UserGroupIcon,
  IdentificationIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

interface Resident {
  id: string;
  fullName: string;
  idNumber: string;
  birthDate: string;
  gender: string;
  relationship: string;
}

interface Bill {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  period: string;
  billType?: { id: string; name: string };
}

interface BillsResponse {
  data: Bill[];
  meta: { total: number };
}

interface FamilyDetail {
  id: string;
  headOfFamily: string;
  address: string;
  housingComplex: string;
  rt: string;
  rw: string;
  kelurahan?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  createdAt: string;
  residents?: Resident[];
}

// Format tanggal ke format Indonesia
function formatDate(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Label jenis kelamin dari kode
function genderLabel(gender: string): string {
  const g = gender?.toUpperCase();
  if (g === 'L' || g === 'LAKI-LAKI' || g === 'MALE') return 'Laki-laki';
  if (g === 'P' || g === 'PEREMPUAN' || g === 'FEMALE') return 'Perempuan';
  return gender || '-';
}

// Inisial untuk avatar anggota
function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

// Format angka ke Rupiah
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Badge status tagihan
const BILL_STATUS: Record<string, { label: string; className: string }> = {
  paid: { label: 'Lunas', className: 'bg-green-600 text-white' },
  unpaid: { label: 'Belum Bayar', className: 'bg-amber-500 text-white' },
  overdue: { label: 'Tertunggak', className: 'bg-red-600 text-white' },
};

function billStatusBadge(status: string) {
  const s = BILL_STATUS[status] || { label: status, className: 'bg-gray-500 text-white' };
  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${s.className}`}>
      {s.label}
    </span>
  );
}

export function FamilyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bills, setBills] = useState<Bill[]>([]);
  const [billsLoading, setBillsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get<FamilyDetail>(`/families/${id}`);
        if (active) setFamily(data);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal memuat detail keluarga';
        if (active) setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  // Ambil tagihan keluarga (semua status, urut terbaru dari backend)
  useEffect(() => {
    let active = true;
    async function loadBills() {
      setBillsLoading(true);
      try {
        const { data } = await api.get<BillsResponse>('/bills', {
          params: { familyId: id, limit: 100 },
        });
        if (active) setBills(data.data ?? []);
      } catch {
        if (active) setBills([]);
      } finally {
        if (active) setBillsLoading(false);
      }
    }
    loadBills();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex justify-center py-24">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/families')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Kembali ke Daftar Keluarga
        </button>
        <Card className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Keluarga tidak ditemukan'}</p>
        </Card>
      </div>
    );
  }

  const residents = family.residents ?? [];

  // Tagihan yang belum lunas (belum bayar + tertunggak)
  const outstandingBills = bills.filter((b) => b.status !== 'paid');
  const totalOutstanding = outstandingBills.reduce((sum, b) => sum + b.amount, 0);
  const overdueCount = bills.filter((b) => b.status === 'overdue').length;
  // Urutkan: tertunggak dulu, lalu belum bayar, lalu lunas
  const statusOrder: Record<string, number> = { overdue: 0, unpaid: 1, paid: 2 };
  const sortedBills = [...bills].sort(
    (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3),
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => navigate('/families')}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Kembali ke Daftar Keluarga
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
            <HomeIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {family.headOfFamily}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Keluarga · {residents.length} anggota
            </p>
          </div>
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/families')}>
          <PencilSquareIcon className="w-4 h-4 mr-2" />
          Kelola di Daftar Keluarga
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Family info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <IdentificationIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Informasi Keluarga
              </h2>
            </div>
            <div className="space-y-4">
              <InfoField
                icon={<UserGroupIcon className="w-4 h-4" />}
                label="Kepala Keluarga"
                value={family.headOfFamily}
              />
              <InfoField
                icon={<MapPinIcon className="w-4 h-4" />}
                label="Alamat"
                value={family.address}
              />
              <InfoField
                icon={<BuildingOffice2Icon className="w-4 h-4" />}
                label="Perumahan"
                value={family.housingComplex}
              />
              <InfoField label="RT / RW" value={`RT ${family.rt} / RW ${family.rw}`} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <MapPinIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Wilayah</h2>
            </div>
            <div className="space-y-4">
              <InfoField label="Kelurahan" value={family.kelurahan} />
              <InfoField label="Kecamatan" value={family.kecamatan} />
              <InfoField label="Kabupaten" value={family.kabupaten} />
              <InfoField label="Provinsi" value={family.provinsi} />
            </div>
          </Card>
        </div>

        {/* RIGHT — Members */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Anggota Keluarga
                </h2>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full">
                {residents.length} orang
              </span>
            </div>

            {residents.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Belum ada anggota keluarga terdaftar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {residents.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary-700 dark:text-primary-300">
                        {initials(r.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {r.fullName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          NIK: {r.idNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                        {r.relationship}
                      </span>
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                        {genderLabel(r.gender)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:inline">
                        {formatDate(r.birthDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tagihan keluarga */}
          <Card className="p-6 mt-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BanknotesIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Tagihan Keluarga
                </h2>
              </div>
              <button
                onClick={() => navigate('/bills')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Lihat di Iuran
              </button>
            </div>

            {billsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-primary-600 border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                {/* Ringkasan tunggakan */}
                {outstandingBills.length > 0 ? (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40 mb-4">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                        {outstandingBills.length} tagihan belum lunas
                        {overdueCount > 0 ? ` · ${overdueCount} tertunggak` : ''}
                      </p>
                      <p className="text-lg font-bold text-red-700 dark:text-red-300">
                        {formatCurrency(totalOutstanding)}
                      </p>
                    </div>
                  </div>
                ) : bills.length > 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/40 mb-4">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Semua tagihan sudah lunas
                    </p>
                  </div>
                ) : null}

                {/* Daftar tagihan */}
                {bills.length === 0 ? (
                  <div className="text-center py-8">
                    <BanknotesIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Belum ada tagihan untuk keluarga ini
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedBills.map((bill) => (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {bill.billType?.name || 'Iuran'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {bill.period} · Jatuh tempo {formatDate(bill.dueDate)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(bill.amount)}
                          </span>
                          {billStatusBadge(bill.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </p>
      {value ? (
        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{value}</p>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-600 italic">Belum diatur</p>
      )}
    </div>
  );
}
