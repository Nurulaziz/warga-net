import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface NavItem {
  path: string;
  label: string;
  icon?: string;
  badge?: string;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'MENU UTAMA',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    title: 'MANAJEMEN DATA',
    items: [
      { path: '/users', label: 'Pengguna', icon: '👤' },
      { path: '/families', label: 'Keluarga', icon: '👨‍👩‍👧‍👦' },
      { path: '/residents', label: 'Warga', icon: '👥' },
    ],
  },
  {
    title: 'ADMINISTRASI',
    items: [
      { path: '/roles', label: 'Role & Permission', icon: '🔐' },
      { path: '/audit-logs', label: 'Audit Log', icon: '📋' },
      { path: '/reports', label: 'Laporan', icon: '📄' },
    ],
  },
  {
    title: 'PENGATURAN',
    items: [
      { path: '/profile', label: 'Profil Saya', icon: '⚙️' },
      { path: '/settings', label: 'Pengaturan', icon: '🔧' },
    ],
  },
];

export function DesktopNavigation() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['MENU UTAMA', 'MANAJEMEN DATA']);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 flex flex-col">
      {/* Logo/Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            WargaNet
          </h1>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            {/* Section Title */}
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <span>{section.title}</span>
              <span className="text-gray-400">
                {expandedSections.includes(section.title) ? '−' : '+'}
              </span>
            </button>

            {/* Section Items */}
            {expandedSections.includes(section.title) && (
              <div className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      {item.icon && (
                        <span className="text-lg flex-shrink-0">{item.icon}</span>
                      )}
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          item.badge === 'Online'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : item.badge === 'Offline'
                            ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Promo Card */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-4 -mb-4" />
          
          <div className="relative z-10">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
              <span className="text-2xl">🏘️</span>
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">
              Sistem Manajemen RT
            </h3>
            <p className="text-white/90 text-xs mb-3">
              WargaNet membantu mengelola data warga dengan mudah dan efisien
            </p>
            <button className="w-full bg-white text-blue-600 text-xs font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors">
              Pelajari Lebih Lanjut
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
