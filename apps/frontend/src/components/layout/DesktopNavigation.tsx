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
  HomeModernIcon,
  BanknotesIcon,
  WalletIcon,
  MegaphoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
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
      className={`fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-[#E2E8F0] dark:border-gray-700 z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[230px]'
      }`}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      {/* Header */}
      <div
        className={`h-14 flex items-center border-b border-[#E2E8F0] dark:border-gray-700 flex-shrink-0 ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${settings.app_logo_url ? '' : 'bg-[#0054A6]'}`}
          >
            {settings.app_logo_url ? (
              <img
                src={settings.app_logo_url}
                alt={settings.app_name}
                className="w-8 h-8 object-contain rounded-lg"
              />
            ) : (
              <HomeModernIcon className="w-[18px] h-[18px] text-white" />
            )}
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-[#0F172A] dark:text-white whitespace-nowrap">
              {settings.app_name}
            </span>
          )}
        </div>
      </div>

      {/* Dashboard — always top, standalone */}
      <div className={`px-2 pt-3 pb-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        <SidebarLink
          item={{ path: '/dashboard', label: 'Dashboard', icon: ChartBarIcon }}
          collapsed={collapsed}
        />
      </div>

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
      <div className="flex-shrink-0 border-t border-[#E2E8F0] dark:border-gray-700 px-2 py-2">
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

      {/* Toggle collapse — selalu aksesibel, tidak melayang di atas konten */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2.5 min-h-[40px] text-[13px] font-medium rounded-none border-t border-[#E2E8F0] dark:border-gray-700 px-3 text-[#64748B] dark:text-gray-400 hover:bg-[#F8FAFC] dark:hover:bg-gray-700/50 hover:text-[#0054A6] dark:hover:text-gray-200 transition-colors duration-150 flex-shrink-0 ${
          collapsed ? 'justify-center px-0' : ''
        }`}
        title={collapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
      >
        <ChevronLeftIcon
          className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 ${
            collapsed ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
        {!collapsed && <span className="truncate">Perkecil</span>}
      </button>
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
        `group relative flex items-center gap-2.5 rounded-lg transition-colors duration-150 min-h-[40px] ${
          collapsed ? 'justify-center px-2' : 'px-3'
        } ${
          isActive
            ? 'bg-[#E8F0FF] dark:bg-[#0054A6]/15 text-[#0054A6] dark:text-blue-400'
            : 'text-[#64748B] dark:text-gray-400 hover:bg-[#F8FAFC] dark:hover:bg-gray-700/50 hover:text-[#0054A6] dark:hover:text-gray-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator */}
          {isActive && !collapsed && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#0054A6] dark:bg-blue-400 rounded-r" />
          )}
          <item.icon
            className={`w-[18px] h-[18px] flex-shrink-0 ${
              isActive ? 'text-[#0054A6] dark:text-blue-400' : ''
            }`}
            aria-hidden="true"
          />
          {!collapsed && <span className="text-[13px] font-medium truncate">{item.label}</span>}
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
