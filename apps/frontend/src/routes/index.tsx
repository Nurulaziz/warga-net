import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Dashboard } from './Dashboard';

// Placeholder pages - will be implemented later
const LoginPage = () => <div>Login Page</div>;
const UsersPage = () => <div>Users Page</div>;
const FamiliesPage = () => <div>Families Page</div>;
const ResidentsPage = () => <div>Residents Page</div>;
const ProfilePage = () => <div>Profile Page</div>;
const NotFoundPage = () => <div>404 - Page Not Found</div>;

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ResponsiveLayout />,
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
        element: <UsersPage />,
      },
      {
        path: 'families',
        element: <FamiliesPage />,
      },
      {
        path: 'residents',
        element: <ResidentsPage />,
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
