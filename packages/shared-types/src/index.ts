// ============= Auth Types =============

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  userId: string;
  phoneNumber: string;
  role: string;
  permissions: PermissionMatrix;
  iat: number;
  exp: number;
}

export interface PermissionMatrix {
  [feature: string]: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

// ============= User Types =============

export interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  roleId: string;
  familyId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============= Role & Permission Types =============

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  feature: string;
  action: 'create' | 'read' | 'update' | 'delete';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============= Family & Resident Types =============

export interface Family {
  id: string;
  headOfFamily: string;
  address: string;
  housingComplex: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resident {
  id: string;
  familyId: string;
  fullName: string;
  idNumber: string;
  birthDate: Date;
  gender: 'L' | 'P';
  relationship: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============= API Response Types =============

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============= Enums =============

export enum DefaultRoles {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_RT = 'ADMIN_RT',
  ADMIN_SEKRETARIS = 'ADMIN_SEKRETARIS',
  ADMIN_BENDAHARA = 'ADMIN_BENDAHARA',
  WARGA = 'WARGA',
}
