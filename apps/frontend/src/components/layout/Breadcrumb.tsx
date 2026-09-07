import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { getPageMeta } from '@/lib/page-meta';

// Navigasi pendukung dibuat ringan agar tidak bersaing dengan judul halaman.
export function Breadcrumb() {
  const location = useLocation();
  const { title, group } = getPageMeta(location.pathname);
  const isDashboard = location.pathname === '/dashboard';

  return (
    <nav aria-label="Breadcrumb" className="mb-5 hidden overflow-hidden md:block">
      <ol className="flex min-h-8 min-w-0 flex-wrap items-center gap-1 text-sm">
        <li className="flex items-center">
          {isDashboard ? (
            <span aria-current="page" className="inline-flex min-h-8 items-center gap-1.5 rounded-sm px-2 font-bold text-ink dark:text-white">
              <HomeIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Beranda
            </span>
          ) : (
            <Link to="/dashboard" className="inline-flex min-h-8 items-center gap-1.5 rounded-sm px-2 font-semibold text-ink-secondary transition-colors hover:bg-[#f1dfc4] hover:text-ink focus:outline-none focus:ring-2 focus:ring-ink/25 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white">
              <HomeIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Beranda
            </Link>
          )}
        </li>

        {!isDashboard && group && (
          <li className="flex min-w-0 items-center gap-1">
            <ChevronRightIcon className="h-3.5 w-3.5 flex-none stroke-2 text-ink-muted dark:text-gray-500" aria-hidden="true" />
            <span className="truncate px-2 font-medium text-ink-secondary dark:text-gray-300">{group}</span>
          </li>
        )}

        {!isDashboard && (
          <li className="flex min-w-0 items-center gap-1" aria-current="page">
            <ChevronRightIcon className="h-3.5 w-3.5 flex-none stroke-2 text-ink-muted dark:text-gray-500" aria-hidden="true" />
            <span className="truncate px-2 font-bold text-ink dark:text-white">{title}</span>
          </li>
        )}
      </ol>
    </nav>
  );
}
