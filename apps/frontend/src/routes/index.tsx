import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Dashboard } from './Dashboard';
import { UsersPage } from './UsersPage';
import { FamiliesPage } from './FamiliesPage';
import { FamilyDetailPage } from './FamilyDetailPage';
import { ResidentsPage } from './ResidentsPage';
import { RolesPage } from './RolesPage';
const AuditLogPage = lazy(() =>
  import('./AuditLogPage').then((module) => ({ default: module.AuditLogPage })),
);
const ReportsPage = lazy(() =>
  import('./ReportsPage').then((module) => ({ default: module.ReportsPage })),
);
const BillTypesPage = lazy(() =>
  import('./BillTypesPage').then((module) => ({ default: module.BillTypesPage })),
);
const BillsPage = lazy(() =>
  import('./BillsPage').then((module) => ({ default: module.BillsPage })),
);
const CashPage = lazy(() => import('./CashPage').then((module) => ({ default: module.CashPage })));
const AnnouncementsPage = lazy(() =>
  import('./AnnouncementsPage').then((module) => ({ default: module.AnnouncementsPage })),
);
const SuaraWargaPage = lazy(() =>
  import('./SuaraWargaPage').then((module) => ({ default: module.SuaraWargaPage })),
);
const PostDetailPage = lazy(() =>
  import('./PostDetailPage').then((module) => ({ default: module.PostDetailPage })),
);
const SavedPostsPage = lazy(() =>
  import('./SavedPostsPage').then((module) => ({ default: module.SavedPostsPage })),
);
const HashtagPostsPage = lazy(() =>
  import('./HashtagPostsPage').then((module) => ({ default: module.HashtagPostsPage })),
);
const ModerationQueuePage = lazy(() =>
  import('./ModerationQueuePage').then((module) => ({ default: module.ModerationQueuePage })),
);
const LettersPage = lazy(() =>
  import('./LettersPage').then((module) => ({ default: module.LettersPage })),
);
const SettingsPage = lazy(() =>
  import('./SettingsPage').then((module) => ({ default: module.SettingsPage })),
);
const AppearanceSettingsPage = lazy(() =>
  import('./AppearanceSettingsPage').then((module) => ({
    default: module.AppearanceSettingsPage,
  })),
);
import { ProfilePage } from './ProfilePage';
import { LandingPage } from './LandingPage';

// Landing setelah login: admin ke Dashboard, warga langsung ke Iuran
const RoleLandingRedirect = () => {
  // Suara Warga menjadi beranda utama setelah login untuk seluruh peran.
  return <Navigate to="/suara-warga" replace />;
};

// Root publik-pintar: pengunjung anonim melihat landing page; pengguna yang sudah login
// diarahkan ke dashboard sesuai perannya. Menunggu status auth siap agar tidak salah
// menampilkan landing sekilas sebelum sesi termuat (mencegah flicker).
const RootRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] dark:bg-gray-900">
        <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  return isAuthenticated ? <RoleLandingRedirect /> : <LandingPage />;
};

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">404</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">Halaman tidak ditemukan</p>
    </div>
  </div>
);

const RouteLoading = () => (
  <div
    className="flex min-h-[40vh] items-center justify-center"
    role="status"
    aria-label="Memuat halaman"
  >
    <div className="h-9 w-9 animate-spin rounded-full border-4 border-ink border-t-brand-500" />
  </div>
);

const loadRoute = (page: ReactNode) => <Suspense fallback={<RouteLoading />}>{page}</Suspense>;

const routes: RouteObject[] = [
  {
    // Root publik — landing page WargaNet (anonim) atau redirect by role (sudah login).
    path: '/',
    element: <RootRoute />,
  },
  {
    // Layout aplikasi terproteksi — pathless supaya anak-anaknya tetap absolut (/dashboard,
    // /bills, dst) sementara '/' kini ditangani RootRoute publik di atas.
    element: (
      <ProtectedRoute>
        <ResponsiveLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute adminOnly>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'families',
        element: (
          <ProtectedRoute adminOnly>
            <FamiliesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'families/:id',
        element: (
          <ProtectedRoute adminOnly>
            <FamilyDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'residents',
        element: (
          <ProtectedRoute adminOnly>
            <ResidentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bills',
        element: loadRoute(<BillsPage />),
      },
      {
        path: 'cash',
        element: <ProtectedRoute adminOnly>{loadRoute(<CashPage />)}</ProtectedRoute>,
      },
      {
        path: 'announcements',
        element: loadRoute(<AnnouncementsPage />),
      },
      {
        path: 'suara-warga',
        element: loadRoute(<SuaraWargaPage />),
      },
      {
        path: 'suara-warga/moderasi',
        element: (
          <ProtectedRoute requirePermission={{ feature: 'posts', action: 'moderate' }}>
            {loadRoute(<ModerationQueuePage />)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'suara-warga/:id',
        element: loadRoute(<PostDetailPage />),
      },
      {
        path: 'suara-warga/tersimpan',
        element: loadRoute(<SavedPostsPage />),
      },
      {
        path: 'suara-warga/hashtag/:tag',
        element: loadRoute(<HashtagPostsPage />),
      },
      {
        path: 'letters',
        element: loadRoute(<LettersPage />),
      },
      {
        path: 'roles',
        element: (
          <ProtectedRoute adminOnly>
            <RolesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit-log',
        element: <ProtectedRoute adminOnly>{loadRoute(<AuditLogPage />)}</ProtectedRoute>,
      },
      {
        path: 'reports',
        element: <ProtectedRoute adminOnly>{loadRoute(<ReportsPage />)}</ProtectedRoute>,
      },
      {
        path: 'bill-types',
        element: <ProtectedRoute adminOnly>{loadRoute(<BillTypesPage />)}</ProtectedRoute>,
      },
      {
        path: 'settings',
        element: <ProtectedRoute adminOnly>{loadRoute(<SettingsPage />)}</ProtectedRoute>,
      },
      {
        path: 'settings/appearance',
        element: loadRoute(<AppearanceSettingsPage />),
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter(routes);
