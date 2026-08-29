import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

export interface UserRole {
  id: string;
  name: string;
}

export interface UserPermissions {
  [feature: string]: Record<string, boolean>;
}

export interface CurrentUser {
  id: string;
  phoneNumber: string;
  fullName: string;
  isActive: boolean;
  familyId: string | null;
  role: UserRole;
  permissions: UserPermissions;
}

// Role admin dikenali dari prefix ADMIN_ atau SUPER_ADMIN (nama role di DB UPPERCASE)
function isAdminRole(roleName?: string | null): boolean {
  const name = (roleName || '').toUpperCase();
  return name === 'SUPER_ADMIN' || name.startsWith('ADMIN');
}

/**
 * Hook untuk fetch data user saat ini (role & permissions) dari /users/me.
 * Data di-cache selama session aktif.
 */
export function useCurrentUser(isAuthenticated: boolean) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCurrentUser = useCallback(async () => {
    if (!isAuthenticated) {
      setCurrentUser(null);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get<CurrentUser>('/users/me');
      setCurrentUser(data);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Helper: cek apakah user punya role tertentu
  const hasRole = useCallback(
    (roleName: string) => {
      return currentUser?.role.name === roleName;
    },
    [currentUser],
  );

  // Helper: cek apakah user punya permission tertentu
  const hasPermission = useCallback(
    (feature: string, action: string) => {
      return !!currentUser?.permissions[feature]?.[action];
    },
    [currentUser],
  );

  // Helper: cek apakah user adalah admin (SUPER_ADMIN atau ADMIN_*)
  const isAdmin = useCallback(() => {
    return isAdminRole(currentUser?.role.name);
  }, [currentUser]);

  // Helper: cek apakah user adalah warga biasa (bukan admin)
  const isWarga = useCallback(() => {
    return !!currentUser && !isAdminRole(currentUser.role.name);
  }, [currentUser]);

  return {
    currentUser,
    loading,
    hasRole,
    hasPermission,
    isAdmin,
    isWarga,
    refetch: fetchCurrentUser,
  };
}
