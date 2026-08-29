// Mapping app role (tabel roles) ke Better Auth role (ba_user.role)
// App Role adalah sumber kebenaran; ba_user.role hanya untuk fitur admin plugin (impersonate, ban)

// Better Auth admin plugin hanya mengenal 'admin' dan 'user'
export type BetterAuthRole = 'admin' | 'user';

// Semua role dengan prefix admin dianggap 'admin' di sistem Better Auth
const ADMIN_APP_ROLES = ['SUPER_ADMIN', 'ADMIN_RT', 'ADMIN_SEKRETARIS', 'ADMIN_BENDAHARA'];

// Konversi app role name -> better auth role
export function mapAppRoleToBetterAuth(appRoleName: string): BetterAuthRole {
  return ADMIN_APP_ROLES.includes(appRoleName.toUpperCase()) ? 'admin' : 'user';
}
