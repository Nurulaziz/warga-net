import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { getPageMeta } from '@/lib/page-meta';

// Breadcrumb navigasi: Home > [Grup] > Halaman
export function Breadcrumb() {
  const location = useLocation();
  const { title, group } = getPageMeta(location.pathname);
  const isDashboard = location.pathname === '/dashboard';

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center flex-wrap gap-1.5 text-sm">
        {/* Home */}
        <li className="flex items-center">
          <Link
            to="/dashboard"
            className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Beranda
          </Link>
        </li>

        {/* Grup induk (opsional, tidak berupa link karena grup bukan halaman) */}
        {!isDashboard && group && (
          <li className="flex items-center gap-1.5">
            <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
            <span className="text-gray-500 dark:text-gray-400">{group}</span>
          </li>
        )}

        {/* Halaman aktif */}
        {!isDashboard && (
          <li className="flex items-center gap-1.5" aria-current="page">
            <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
            <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
          </li>
        )}
      </ol>
    </nav>
  );
}
