import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  BanknotesIcon,
  MegaphoneIcon,
  Bars3Icon,
  XMarkIcon,
  IdentificationIcon,
  UserGroupIcon,
  WalletIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface MobileNavItem {
  path: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
}

// Tab bawah untuk admin (punya Dashboard) dan warga (tanpa Dashboard)
const adminPrimaryItems: MobileNavItem[] = [
  { path: '/dashboard', label: 'Home', icon: HomeIcon },
  { path: '/bills', label: 'Iuran', icon: BanknotesIcon },
  { path: '/announcements', label: 'Info', icon: MegaphoneIcon },
];

const wargaPrimaryItems: MobileNavItem[] = [
  { path: '/bills', label: 'Iuran', icon: BanknotesIcon },
  { path: '/announcements', label: 'Info', icon: MegaphoneIcon },
  { path: '/suara-warga', label: 'Suara Warga', icon: ChatBubbleLeftRightIcon },
];

// Urutan disamakan dengan sidebar desktop: Keuangan → Data Warga → Komunikasi
// → Pengguna & Akses → Sistem → Profil.
const moreItems: MobileNavItem[] = [
  // Keuangan (Iuran ada di tab bawah)
  { path: '/cash', label: 'Kas RT', icon: WalletIcon, adminOnly: true },
  { path: '/reports', label: 'Laporan', icon: DocumentTextIcon, adminOnly: true },
  // Data Warga
  { path: '/families', label: 'Keluarga', icon: UserGroupIcon, adminOnly: true },
  { path: '/residents', label: 'Warga', icon: IdentificationIcon, adminOnly: true },
  // Komunikasi (Pengumuman ada di tab bawah)
  { path: '/suara-warga', label: 'Suara Warga', icon: ChatBubbleLeftRightIcon },
  { path: '/letters', label: 'Surat', icon: EnvelopeIcon },
  // Pengguna & Akses
  { path: '/users', label: 'Pengguna', icon: UserIcon, adminOnly: true },
  { path: '/roles', label: 'Role & Permission', icon: LockClosedIcon, adminOnly: true },
  // Sistem
  { path: '/settings', label: 'Pengaturan', icon: Cog6ToothIcon, adminOnly: true },
  // Akun
  { path: '/profile', label: 'Profil', icon: UserIcon },
];

export function MobileNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAdmin } = useAuth();

  const admin = isAdmin();
  const primaryItems = admin ? adminPrimaryItems : wargaPrimaryItems;

  // Sembunyikan item yang sudah tampil di tab bawah agar tidak dobel
  const primaryPaths = new Set(primaryItems.map((item) => item.path));
  const visibleMoreItems = moreItems.filter(
    (item) => (!item.adminOnly || admin) && !primaryPaths.has(item.path),
  );

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#FFF9EF] dark:bg-gray-800 border-t-2 border-ink dark:border-gray-500 z-50">
        <div className="flex justify-around items-center h-16">
          {primaryItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`
              }
            >
              <item.icon className="w-6 h-6 mb-1" aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
          {/* More button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 dark:text-gray-400"
          >
            <Bars3Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* Slide-up more menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setMenuOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Panel */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#FFF9EF] dark:bg-gray-800 rounded-none border-t-2 border-ink p-4 pb-8 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu</h3>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {visibleMoreItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1.5 p-3 rounded-sm border transition-colors ${
                      isActive
                        ? 'border-ink bg-brand-500 text-white shadow-[2px_2px_0_#171717]'
                        : 'border-ink/30 text-gray-600 dark:text-gray-400 hover:border-ink hover:bg-white dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <item.icon className="w-6 h-6" aria-hidden="true" />
                  <span className="text-xs font-medium text-center leading-tight">
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
