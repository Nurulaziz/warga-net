import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Loading spinner saat cek auth state
function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <svg
          className="animate-spin h-8 w-8 text-primary-600 dark:text-primary-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-sm text-gray-600 dark:text-gray-400">Memuat...</p>
      </div>
    </div>
  );
}

// Halaman akses ditolak
function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">403</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Anda tidak memiliki akses ke halaman ini
        </p>
        <a href="/dashboard" className="mt-4 inline-block text-primary-600 hover:underline">
          Kembali ke Dashboard
        </a>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  // Batasi berdasarkan permission tertentu (feature + action)
  requirePermission?: { feature: string; action: string };
}

export function ProtectedRoute({
  children,
  adminOnly = false,
  requirePermission,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    // Simpan intended URL untuk redirect setelah login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Cek role jika route membutuhkan admin
  if (adminOnly && !isAdmin()) {
    return <AccessDenied />;
  }

  // Cek permission granular; admin selalu lolos
  if (
    requirePermission &&
    !isAdmin() &&
    !hasPermission(requirePermission.feature, requirePermission.action)
  ) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
