import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Dashboard } from './Dashboard';
import { LoginPage } from './LoginPage';
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
import { LettersPage } from './LettersPage';
import { SettingsPage } from './SettingsPage';
import { ProfilePage } from './ProfilePage';

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
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <ResponsiveLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
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
