import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProfilePostsSection } from '@/components/posts/ProfilePostsSection';
import {
  UserCircleIcon,
  CheckBadgeIcon,
  ClipboardDocumentIcon,
  ArrowRightOnRectangleIcon,
  PencilSquareIcon,
  CameraIcon,
  ShieldCheckIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

// Ubah role name mentah jadi label yang enak dibaca
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_RT: 'Ketua RT',
  ADMIN_SEKRETARIS: 'Sekretaris',
  ADMIN_BENDAHARA: 'Bendahara',
  WARGA: 'Warga',
};

function getRoleLabel(roleName?: string | null): string {
  if (!roleName) return 'Warga';
  return ROLE_LABELS[roleName.toUpperCase()] || roleName;
}

export function ProfilePage() {
  const { user, logout, currentUser } = useAuth();
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);

  const roleLabel = getRoleLabel(currentUser?.role.name);

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  function handleCopyId() {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Truncate ID untuk display
  function truncateId(id: string) {
    if (id.length <= 12) return id;
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  }

  // Nama display — fallback jika hanya nomor HP
  const displayName =
    user?.name && !user.name.startsWith('+') ? user.name : `Warga ${settings.app_name}`;

  // Cek apakah email real atau dummy
  const isRealEmail = user?.email && !user.email.endsWith('@warganet.local');

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between border-b-2 border-ink pb-4 dark:border-gray-500">
        <div>
          <p className="mb-1 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-blue-400">
            Akun Warga
          </p>
          <h1 className="text-2xl font-black text-ink dark:text-gray-100">Profil Saya</h1>
        </div>
        <Button
          onClick={handleLogout}
          variant="danger"
          size="sm"
          className="gap-2"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span>Keluar</span>
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — Profile Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-white dark:bg-gray-800">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-sm border-2 border-ink bg-brand-100 shadow-[3px_3px_0_#171717] dark:border-gray-300 dark:bg-blue-950">
                  <UserCircleIcon className="h-12 w-12 text-brand-700 dark:text-blue-300" />
                </div>
                <button
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-sm border-2 border-ink bg-white shadow-[2px_2px_0_#171717] transition-transform hover:-translate-y-0.5 dark:border-gray-300 dark:bg-gray-700"
                  title="Ubah foto"
                  aria-label="Ubah foto profil"
                >
                  <CameraIcon className="h-4 w-4 text-ink dark:text-gray-100" />
                </button>
              </div>

              {/* Name */}
              <h2 className="text-lg font-black text-ink dark:text-gray-100">
                {displayName}
              </h2>

              {/* Role badge */}
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-ink bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800 dark:border-gray-400 dark:bg-blue-950 dark:text-blue-200">
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                {roleLabel}
              </span>
            </div>

            {/* Navigation tabs */}
            <div className="mt-6 space-y-2 border-t-2 border-ink pt-5 dark:border-gray-500">
              <NavTab icon={<PencilSquareIcon className="w-4 h-4" />} label="Edit Profil" active />
              <NavTab icon={<ShieldCheckIcon className="w-4 h-4" />} label="Keamanan Akun" />
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN — Detail Info Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Pribadi */}
          <Card className="bg-white p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black text-ink dark:text-gray-100">
                Informasi Pribadi
              </h3>
              <button className="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border-2 border-ink bg-white px-3 text-sm font-bold text-ink transition-colors hover:bg-warm-100 dark:border-gray-400 dark:bg-gray-700 dark:text-gray-100">
                <PencilSquareIcon className="w-3.5 h-3.5" />
                Edit Informasi
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoField
                icon={<UserCircleIcon className="w-4 h-4" />}
                label="Nama Lengkap"
                value={displayName === `Warga ${settings.app_name}` ? null : displayName}
                placeholder="Belum diatur"
              />
              <div>
                <p className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-ink-secondary dark:text-gray-300">
                  <PhoneIcon className="h-3.5 w-3.5 text-ink" />
                  Nomor HP
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink dark:text-gray-100">
                    {user?.phoneNumber || '-'}
                  </span>
                  {user?.phoneNumberVerified && (
                    <span className="inline-flex items-center gap-1 rounded-sm border border-ink bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-900 dark:border-gray-400 dark:bg-green-900 dark:text-green-100">
                      <CheckBadgeIcon className="w-3 h-3" />
                      Terverifikasi
                    </span>
                  )}
                </div>
              </div>
              <InfoField
                icon={<EnvelopeIcon className="w-4 h-4" />}
                label="Email"
                value={isRealEmail ? user?.email : null}
                placeholder="Belum diatur"
              />
              <InfoField
                icon={<IdentificationIcon className="w-4 h-4" />}
                label="Alamat"
                value={null}
                placeholder="Belum diatur"
              />
            </div>
          </Card>

          {/* Informasi Akun */}
          <Card className="bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-5 text-base font-black text-ink dark:text-gray-100">
              Informasi Akun
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Role */}
              <InfoField
                icon={<ShieldCheckIcon className="w-4 h-4" />}
                label="Role / Akses"
                value={roleLabel}
              />

              {/* Bergabung sejak */}
              <InfoField
                icon={<CalendarDaysIcon className="w-4 h-4" />}
                label="Bergabung Sejak"
                value={null}
                placeholder="–"
              />

              {/* ID Sistem — truncated */}
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-secondary dark:text-gray-300">ID Sistem</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-ink-secondary dark:text-gray-200">
                    {user?.id ? truncateId(user.id) : '-'}
                  </span>
                  {user?.id && (
                    <button
                      onClick={handleCopyId}
                      className="flex-shrink-0 rounded-sm border border-transparent p-1 transition-colors hover:border-ink hover:bg-warm-100 dark:hover:border-gray-400 dark:hover:bg-gray-700"
                      title="Salin ID"
                      aria-label="Salin ID pengguna"
                    >
                      <ClipboardDocumentIcon className="h-3.5 w-3.5 text-ink-secondary" />
                    </button>
                  )}
                  {copied && (
                    <span className="text-[10px] text-green-600 font-medium">Tersalin!</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      {currentUser?.id && <ProfilePostsSection userId={currentUser.id} />}
    </div>
  );
}

// --- Sub-components ---

function InfoField({
  icon,
  label,
  value,
  placeholder,
}: {
  icon: React.ReactNode | null;
  label: string;
  value: string | null | undefined;
  placeholder?: string;
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-ink-secondary dark:text-gray-300">
        {icon && <span className="text-ink dark:text-gray-100">{icon}</span>}
        {label}
      </p>
      {value ? (
        <p className="text-sm font-bold text-ink dark:text-gray-100">{value}</p>
      ) : (
        <p className="text-sm font-medium text-ink-secondary dark:text-gray-300">
          {placeholder || 'Belum diatur'}
        </p>
      )}
    </div>
  );
}

function NavTab({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex min-h-[44px] w-full items-center gap-3 rounded-sm border-2 px-3 py-2.5 text-sm font-bold transition-colors ${
        active
          ? 'border-ink bg-brand-500 text-white shadow-[2px_2px_0_#171717] dark:border-gray-300 dark:bg-blue-600'
          : 'border-transparent text-ink-secondary hover:border-ink hover:bg-warm-100 dark:text-gray-200 dark:hover:border-gray-400 dark:hover:bg-gray-700'
      }`}
    >
      <span className={active ? 'text-white' : 'text-ink-secondary dark:text-gray-200'}>
        {icon}
      </span>
      {label}
    </button>
  );
}
