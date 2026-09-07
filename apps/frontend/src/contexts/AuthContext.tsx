import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import { authClient } from '@/lib/auth-client';
import { useCurrentUser, type CurrentUser, type UserPermissions } from '@/hooks/useCurrentUser';
import { api } from '@/services/api';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: string | null;
  permissions: UserPermissions;
  hasRole: (roleName: string) => boolean;
  hasPermission: (feature: string, action: string) => boolean;
  isAdmin: () => boolean;
  isWarga: () => boolean;
  refreshCurrentUser: () => Promise<void>;
  requestOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  const isAuthenticated = !!session?.user;

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phoneNumber: (session.user as AuthUser).phoneNumber,
        phoneNumberVerified: (session.user as AuthUser).phoneNumberVerified,
      }
    : null;

  // Fetch role & permissions dari backend
  const {
    currentUser,
    hasRole,
    hasPermission,
    isAdmin,
    isWarga,
    refetch: refreshCurrentUser,
    loading: roleLoading,
  } = useCurrentUser(isAuthenticated, session?.user.id);

  // Request OTP ke nomor telepon via Better Auth
  const requestOtp = useCallback(async (phoneNumber: string) => {
    const { data: phoneStatus } = await api.get<{ registered: boolean }>('/users/phone-status', {
      params: { phoneNumber },
    });
    if (!phoneStatus.registered) {
      throw new Error('Nomor telepon belum terdaftar. Hubungi pengurus untuk membuat akun.');
    }
    const result = await authClient.phoneNumber.sendOtp({ phoneNumber });
    if (result.error) {
      throw new Error(result.error.message || 'Gagal mengirim OTP');
    }
  }, []);

  // Verify OTP dan buat session via Better Auth
  const verifyOtp = useCallback(async (phoneNumber: string, code: string) => {
    const result = await authClient.phoneNumber.verify({ phoneNumber, code });
    if (result.error) {
      throw new Error(result.error.message || 'Kode OTP salah atau sudah kedaluwarsa');
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await authClient.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      currentUser,
      isAuthenticated,
      isLoading: isPending || roleLoading,
      role: currentUser?.role.name || null,
      permissions: currentUser?.permissions || {},
      hasRole,
      hasPermission,
      isAdmin,
      isWarga,
      refreshCurrentUser,
      requestOtp,
      verifyOtp,
      logout,
    }),
    [
      session,
      isPending,
      currentUser,
      roleLoading,
      hasRole,
      hasPermission,
      isAdmin,
      isWarga,
      refreshCurrentUser,
      requestOtp,
      verifyOtp,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook untuk akses auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}
