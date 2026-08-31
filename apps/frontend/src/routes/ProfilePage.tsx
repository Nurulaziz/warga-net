import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { Card } from '@/components/ui/Card';
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
    window.location.href = '/login';
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-gray-100">Profil Saya</h1>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors min-h-[40px]"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — Profile Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-[#E8F0FF] dark:bg-[#0054A6]/20 flex items-center justify-center">
                  <UserCircleIcon className="w-12 h-12 text-[#0054A6] dark:text-blue-400" />
                </div>
                <button
                  className="absolute bottom-0 right-0 w-7 h-7 bg-white dark:bg-gray-700 border border-[#E2E8F0] dark:border-gray-600 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  title="Ubah foto"
                  aria-label="Ubah foto profil"
                >
                  <CameraIcon className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
              </div>

              {/* Name */}
              <h2 className="text-lg font-semibold text-[#0F172A] dark:text-gray-100">
                {displayName}
              </h2>

              {/* Role badge */}
              <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#E8F0FF] dark:bg-[#0054A6]/15 text-[#0054A6] dark:text-blue-400 rounded-full">
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                {roleLabel}
              </span>
            </div>

            {/* Navigation tabs */}
            <div className="mt-6 pt-5 border-t border-[#E2E8F0] dark:border-gray-700 space-y-1">
              <NavTab icon={<PencilSquareIcon className="w-4 h-4" />} label="Edit Profil" active />
              <NavTab icon={<ShieldCheckIcon className="w-4 h-4" />} label="Keamanan Akun" />
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN — Detail Info Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Pribadi */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-[#0F172A] dark:text-gray-100">
                Informasi Pribadi
              </h3>
              <button className="inline-flex items-center gap-1.5 text-sm text-[#0054A6] dark:text-blue-400 hover:underline font-medium min-h-[40px]">
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
                <p className="text-xs text-[#94A3B8] dark:text-gray-500 mb-1 flex items-center gap-1">
                  <PhoneIcon className="w-3.5 h-3.5 text-[#94A3B8]" />
                  Nomor HP
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#0F172A] dark:text-gray-200">
                    {user?.phoneNumber || '-'}
                  </span>
                  {user?.phoneNumberVerified && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40 rounded">
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
          <Card className="p-6">
            <h3 className="text-base font-semibold text-[#0F172A] dark:text-gray-100 mb-5">
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
                <p className="text-xs text-[#94A3B8] dark:text-gray-500 mb-1">ID Sistem</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-[#64748B] dark:text-gray-400">
                    {user?.id ? truncateId(user.id) : '-'}
                  </span>
                  {user?.id && (
                    <button
                      onClick={handleCopyId}
                      className="flex-shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Salin ID"
                      aria-label="Salin ID pengguna"
                    >
                      <ClipboardDocumentIcon className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#64748B]" />
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
      <p className="text-xs text-[#94A3B8] dark:text-gray-500 mb-1 flex items-center gap-1">
        {icon && <span className="text-[#94A3B8]">{icon}</span>}
        {label}
      </p>
      {value ? (
        <p className="text-sm font-medium text-[#0F172A] dark:text-gray-200">{value}</p>
      ) : (
        <p className="text-sm text-[#CBD5E1] dark:text-gray-600 italic">
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[40px] ${
        active
          ? 'bg-[#F8FAFC] dark:bg-gray-700/50 text-[#0054A6] dark:text-blue-400'
          : 'text-[#64748B] dark:text-gray-400 hover:bg-[#F8FAFC] dark:hover:bg-gray-700/50 hover:text-[#0F172A] dark:hover:text-gray-200'
      }`}
    >
      <span className={active ? 'text-[#0054A6] dark:text-blue-400' : 'text-[#94A3B8]'}>
        {icon}
      </span>
      {label}
    </button>
  );
}
