import { NavLink } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChartBarIcon,
  UserGroupIcon,
  IdentificationIcon,
  UserIcon,
  LockClosedIcon,
  ClipboardDocumentListIcon,
  // UsersIcon dihapus: Warga kini pakai IdentificationIcon
  DocumentTextIcon,
  Cog6ToothIcon,
  BanknotesIcon,
  WalletIcon,
  MegaphoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

// --- Menu configuration ---

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
}

interface NavSection {
  group: string;
  items: NavItem[];
  adminOnly?: boolean;
}

// Urutan grup: operasional harian di atas, konfigurasi di bawah.
// KEUANGAN & KOMUNIKASI dipakai warga juga; sisanya khusus admin.
const mainNavSections: NavSection[] = [
  {
    group: 'KEUANGAN',
    items: [
      { path: '/bills', label: 'Iuran', icon: BanknotesIcon },
      { path: '/cash', label: 'Kas RT', icon: WalletIcon, adminOnly: true },
      { path: '/reports', label: 'Laporan', icon: DocumentTextIcon, adminOnly: true },
    ],
  },
  {
    group: 'DATA WARGA',
    adminOnly: true,
    items: [
      { path: '/families', label: 'Keluarga', icon: UserGroupIcon, adminOnly: true },
      { path: '/residents', label: 'Warga', icon: IdentificationIcon, adminOnly: true },
    ],
  },
  {
    group: 'KOMUNIKASI',
    items: [
      { path: '/announcements', label: 'Pengumuman', icon: MegaphoneIcon },
      { path: '/suara-warga', label: 'Suara Warga', icon: ChatBubbleLeftRightIcon },
      { path: '/letters', label: 'Surat', icon: EnvelopeIcon },
    ],
  },
  {
    group: 'PENGGUNA & AKSES',
    adminOnly: true,
    items: [
      { path: '/users', label: 'Pengguna Sistem', icon: UserIcon, adminOnly: true },
      { path: '/roles', label: 'Role & Permission', icon: LockClosedIcon, adminOnly: true },
    ],
  },
  {
    group: 'SISTEM',
    adminOnly: true,
    items: [
      { path: '/audit-log', label: 'Audit Log', icon: ClipboardDocumentListIcon, adminOnly: true },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  { path: '/settings', label: 'Pengaturan', icon: Cog6ToothIcon, adminOnly: true },
];

const profileNavItem: NavItem = { path: '/profile', label: 'Profil Saya', icon: UserCircleIcon };

// --- Component ---

interface DesktopNavigationProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DesktopNavigation({ collapsed, onToggle }: DesktopNavigationProps) {
  const { settings } = useSettings();
  const { isAdmin } = useAuth();

  const admin = isAdmin();

  // Filter sections dan items berdasarkan role
  const visibleSections = mainNavSections
    .filter((section) => !section.adminOnly || admin)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.adminOnly || admin),
    }))
    .filter((section) => section.items.length > 0);

  const visibleBottomItems = bottomNavItems.filter((item) => !item.adminOnly || admin);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#FFF9EF] dark:bg-gray-800 border-r-2 border-ink dark:border-gray-500 z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[230px]'
      }`}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      {/* Header */}
      <div
        className={`h-14 flex items-center border-b-2 border-ink dark:border-gray-500 flex-shrink-0 ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        {!collapsed && (
          <span className="font-display text-[1.4rem] font-extrabold tracking-[-0.035em] text-ink dark:text-white whitespace-nowrap">
            {settings.app_name}
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-2 border-transparent text-ink transition-colors hover:border-ink hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:text-white dark:hover:border-gray-400 dark:hover:bg-gray-700"
          title={collapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
          aria-label={collapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
            <path d={collapsed ? 'm6 10 2 2-2 2' : 'm7 10-2 2 2 2'} />
          </svg>
        </button>
      </div>

      {/* Dashboard — hanya untuk admin; warga tidak punya dashboard */}
      {admin && (
        <div className={`px-2 pt-3 pb-1 ${collapsed ? 'px-2' : 'px-3'}`}>
          <SidebarLink
            item={{ path: '/dashboard', label: 'Dashboard', icon: ChartBarIcon }}
            collapsed={collapsed}
          />
        </div>
      )}

      {/* Main navigation sections */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1 scrollbar-none"
        aria-label="Menu utama"
        style={{ scrollbarWidth: 'none' }}
      >
        {visibleSections.map((section) => (
          <div key={section.group} className="mt-4 first:mt-2">
            {/* Group label — disembunyikan untuk warga agar daftar menu lebih ringkas */}
            {!collapsed && admin && (
              <div className="px-2 pb-1.5">
                <span className="text-[10px] font-semibold text-[#94A3B8] dark:text-gray-500 uppercase tracking-[0.06em]">
                  {section.group}
                </span>
              </div>
            )}
            {/* Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarLink key={item.path} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section: Pengaturan, lalu Profil + Theme Toggle dalam 1 row */}
      <div className="flex-shrink-0 border-t-2 border-ink dark:border-gray-500 px-2 py-2">
        <div className="space-y-0.5">
          {visibleBottomItems.map((item) => (
            <SidebarLink key={item.path} item={item} collapsed={collapsed} />
          ))}
        </div>
        {/* Profil + theme toggle sejajar dalam satu baris */}
        <div className={`mt-0.5 flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
          <div className="flex-1 min-w-0">
            <SidebarLink item={profileNavItem} collapsed={collapsed} />
          </div>
          <div className="flex-shrink-0 pr-1">
            <ThemeToggle />
          </div>
        </div>
      </div>

    </aside>
  );
}

// --- Reusable sidebar link ---

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-2.5 rounded-sm border transition-colors duration-150 min-h-[40px] ${
          collapsed ? 'justify-center px-2' : 'px-3'
        } ${
          isActive
            ? 'border-ink bg-brand-500 text-white shadow-[2px_2px_0_#171717] dark:border-gray-300 dark:text-white'
            : 'border-transparent text-[#525252] dark:text-gray-400 hover:border-ink hover:bg-white dark:hover:border-gray-500 dark:hover:bg-gray-700/50 hover:text-ink dark:hover:text-gray-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator */}
          <item.icon
            className={`w-[18px] h-[18px] flex-shrink-0 ${
              isActive ? 'text-white' : ''
            }`}
            aria-hidden="true"
          />
          {!collapsed && <span className="text-[13px] font-semibold truncate">{item.label}</span>}
          {/* Tooltip for collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#0F172A] text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50 shadow-lg">
              {item.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}
