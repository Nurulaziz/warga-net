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
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r-[3px] border-ink bg-[#FFF9EF] transition-all duration-300 dark:border-gray-400 dark:bg-gray-800 ${
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
          <span className="flex min-w-0 items-center gap-2 font-display text-[1.4rem] font-extrabold tracking-[-0.035em] text-ink dark:text-white whitespace-nowrap">
            {settings.app_logo_url && <img src={settings.app_logo_url} alt="" className="h-8 w-8 shrink-0 object-contain" />}
            <span className="truncate">{settings.app_name}</span>
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-2 border-transparent text-ink transition-colors hover:border-ink hover:bg-white focus:outline-none focus:ring-2 focus:ring-ink/30 dark:text-white dark:hover:border-gray-400 dark:hover:bg-gray-700"
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
                <span className="text-[10px] font-bold text-[#6b5f50] dark:text-gray-300 uppercase tracking-[0.07em]">
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

      {/* Bottom section: Pengaturan dan theme toggle sejajar */}
      <div className="flex-shrink-0 border-t-2 border-ink dark:border-gray-500 px-2 py-2">
        <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
          <div className="min-w-0 flex-1">
            {visibleBottomItems.map((item) => (
              <SidebarLink key={item.path} item={item} collapsed={collapsed} />
            ))}
          </div>
          <div className="flex-shrink-0 pr-1"><ThemeToggle /></div>
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
        `group relative flex min-h-[40px] items-center gap-2.5 rounded-sm border-2 transition-[background-color,color,border-color,box-shadow,transform] duration-150 ${
          collapsed ? 'justify-center px-2' : 'px-3'
        } ${
          isActive
            ? 'border-ink bg-brand-500 text-white shadow-[2px_2px_0_#171717] dark:border-gray-300 dark:text-white'
            : 'border-transparent text-[#292524] dark:text-gray-200 hover:-translate-y-px hover:border-ink hover:bg-white hover:text-ink hover:shadow-[2px_2px_0_#171717] dark:hover:border-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white dark:hover:shadow-[2px_2px_0_#d4d4d4]'
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
          {!collapsed && <span className="text-[13px] font-bold truncate">{item.label}</span>}
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
