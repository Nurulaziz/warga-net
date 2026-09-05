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
import { AuditLogPage } from './AuditLogPage';
import { ReportsPage } from './ReportsPage';
import { BillsPage } from './BillsPage';
import { CashPage } from './CashPage';
import { AnnouncementsPage } from './AnnouncementsPage';
import { SuaraWargaPage } from './SuaraWargaPage';
import { PostDetailPage } from './PostDetailPage';
import { SavedPostsPage } from './SavedPostsPage';
import { HashtagPostsPage } from './HashtagPostsPage';
import { ModerationQueuePage } from './ModerationQueuePage';
import { LettersPage } from './LettersPage';
import { SettingsPage } from './SettingsPage';
import { ProfilePage } from './ProfilePage';
import { LandingPage } from './LandingPage';

// Landing setelah login: admin ke Dashboard, warga langsung ke Iuran
const RoleLandingRedirect = () => {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin() ? '/dashboard' : '/bills'} replace />;
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
        element: <BillsPage />,
      },
      {
        path: 'cash',
        element: (
          <ProtectedRoute adminOnly>
            <CashPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'announcements',
        element: <AnnouncementsPage />,
      },
      {
        path: 'suara-warga',
        element: <SuaraWargaPage />,
      },
      {
        path: 'suara-warga/moderasi',
        element: (
          <ProtectedRoute requirePermission={{ feature: 'posts', action: 'moderate' }}>
            <ModerationQueuePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'suara-warga/:id',
        element: <PostDetailPage />,
      },
      {
        path: 'suara-warga/tersimpan',
        element: <SavedPostsPage />,
      },
      {
        path: 'suara-warga/hashtag/:tag',
        element: <HashtagPostsPage />,
      },
      {
        path: 'letters',
        element: <LettersPage />,
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
        element: (
          <ProtectedRoute adminOnly>
            <AuditLogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute adminOnly>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute adminOnly>
            <SettingsPage />
          </ProtectedRoute>
        ),
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
