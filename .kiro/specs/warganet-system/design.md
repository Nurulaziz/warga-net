# Dokumen Desain: Sistem WargaNet

## Ringkasan

WargaNet adalah sistem manajemen RT berbasis web yang dibangun dengan arsitektur monorepo modern untuk RT.04/010 Perumahan Satriamekar Raya Residence 2, Kelurahan Satriamekar, Kecamatan Tambun Utara, Kabupaten Bekasi, Jawa Barat. Sistem ini menggunakan autentikasi OTP WhatsApp tanpa password, RBAC dinamis berbasis database, dan desain mobile-first untuk melayani komunitas RT di Indonesia. Backend dibangun dengan NestJS + Prisma + PostgreSQL, frontend menggunakan React + Vite + Tailwind CSS, dengan Redis untuk caching dan manajemen sesi.

## Arsitektur

### Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React SPA (Vite + TypeScript + Tailwind CSS)        │   │
│  │  - Mobile-first responsive UI                        │   │
│  │  - Permission-based UI guards                        │   │
│  │  - JWT token management                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                         HTTPS/REST API
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Nginx Reverse Proxy                     │
│  - SSL/TLS termination                                       │
│  - Static file serving                                       │
│  - Request routing                                           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Backend Layer (NestJS)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Layer (Controllers + DTOs)                      │   │
│  │  ├─ Auth Module (OTP, JWT)                           │   │
│  │  ├─ Users Module                                     │   │
│  │  ├─ Roles & Permissions Module                       │   │
│  │  ├─ Families & Residents Module                      │   │
│  │  └─ Audit Log Module                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Business Logic Layer (Services)                     │   │
│  │  - OTP generation & validation                       │   │
│  │  - Permission checking                               │   │
│  │  - Data validation & transformation                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Security Layer (Guards + Interceptors)              │   │
│  │  - JWT authentication guard                          │   │
│  │  - Permission guard (RBAC)                           │   │
│  │  - Rate limiting                                     │   │
│  │  - Audit logging interceptor                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
┌───────────────────▼─────┐   ┌─────────▼──────────────┐
│   PostgreSQL Database    │   │   Redis Cache          │
│   - User data            │   │   - OTP tokens         │
│   - Roles & permissions  │   │   - Refresh tokens     │
│   - Families & residents │   │   - Rate limit data    │
│   - Audit logs           │   │   - Session data       │
└──────────────────────────┘   └────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  WhatsApp Business API / Gateway                     │   │
│  │  - OTP delivery                                      │   │
│  │  - Notifications                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Prinsip Arsitektur

1. **Separation of Concerns**: Backend dan frontend terpisah dengan komunikasi via REST API
2. **Security by Default**: Semua endpoint dilindungi, validasi di backend
3. **Stateless Authentication**: JWT untuk autentikasi, Redis untuk refresh tokens
4. **Database-Driven RBAC**: Permissions disimpan di database, bukan hardcoded
5. **Audit Everything**: Semua aksi penting dicatat untuk keamanan dan compliance

## Komponen dan Interface

### Backend Modules

#### 1. Auth Module

**Tanggung Jawab:**

- Mengelola alur autentikasi OTP
- Menghasilkan dan memvalidasi OTP
- Mengelola JWT tokens (access + refresh)
- Rate limiting untuk OTP requests

**Services:**

```typescript
// auth.service.ts
class AuthService {
  // Meminta OTP untuk nomor telepon
  async requestOtp(phoneNumber: string, ipAddress: string): Promise<OtpRequestResult>;

  // Memverifikasi OTP dan menghasilkan tokens
  async verifyOtp(phoneNumber: string, otp: string): Promise<AuthTokens>;

  // Refresh access token menggunakan refresh token
  async refreshToken(refreshToken: string): Promise<AuthTokens>;

  // Logout dan invalidate tokens
  async logout(userId: string, refreshToken: string): Promise<void>;

  // Logout dari semua perangkat
  async logoutAllDevices(userId: string): Promise<void>;
}

// otp.service.ts
class OtpService {
  // Generate 6-digit OTP
  generateOtp(): string;

  // Hash OTP untuk penyimpanan
  async hashOtp(otp: string): Promise<string>;

  // Verify OTP hash
  async verifyOtp(otp: string, hashedOtp: string): Promise<boolean>;

  // Store OTP di Redis dengan TTL
  async storeOtp(phoneNumber: string, hashedOtp: string, ttl: number): Promise<void>;

  // Get OTP dari Redis
  async getOtp(phoneNumber: string): Promise<string | null>;

  // Invalidate OTP
  async invalidateOtp(phoneNumber: string): Promise<void>;
}

// whatsapp.service.ts
class WhatsAppService {
  // Kirim OTP via WhatsApp
  async sendOtp(phoneNumber: string, otp: string): Promise<SendResult>;

  // Kirim notifikasi
  async sendNotification(phoneNumber: string, message: string): Promise<SendResult>;

  // Check WhatsApp Gateway health
  async checkHealth(): Promise<boolean>;
}

// jwt.service.ts
class JwtService {
  // Generate access token (15 menit)
  generateAccessToken(payload: JwtPayload): string;

  // Generate refresh token (30 hari)
  generateRefreshToken(userId: string): string;

  // Verify dan decode token
  verifyToken(token: string): JwtPayload;

  // Store refresh token di Redis
  async storeRefreshToken(userId: string, token: string): Promise<void>;

  // Invalidate refresh token
  async invalidateRefreshToken(token: string): Promise<void>;
}
```

**DTOs:**

```typescript
interface OtpRequestDto {
  phoneNumber: string; // Format E.164
}

interface OtpVerifyDto {
  phoneNumber: string;
  otp: string; // 6 digit
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface JwtPayload {
  userId: string;
  phoneNumber: string;
  role: string;
  permissions: PermissionMatrix;
  iat: number;
  exp: number;
}

interface PermissionMatrix {
  [feature: string]: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}
```

#### 2. Users Module

**Tanggung Jawab:**

- CRUD operasi untuk users
- Manajemen status akun (active/inactive)
- Perubahan nomor telepon
- Pre-registration oleh admin

**Services:**

```typescript
class UsersService {
  // Create user (pre-registration)
  async createUser(dto: CreateUserDto, createdBy: string): Promise<User>;

  // Get user by ID
  async getUserById(id: string): Promise<User>;

  // Get user by phone number
  async getUserByPhone(phoneNumber: string): Promise<User | null>;

  // Update user info (kecuali phone)
  async updateUser(id: string, dto: UpdateUserDto): Promise<User>;

  // Activate user account (first login)
  async activateUser(id: string): Promise<User>;

  // Deactivate user account
  async deactivateUser(id: string, deactivatedBy: string): Promise<User>;

  // Soft delete user
  async deleteUser(id: string, deletedBy: string): Promise<void>;

  // Request phone number change
  async requestPhoneChange(
    userId: string,
    newPhone: string,
    currentOtp: string,
    newOtp: string,
  ): Promise<PhoneChangeRequest>;

  // Approve phone change (for WARGA)
  async approvePhoneChange(requestId: string, approvedBy: string): Promise<void>;

  // Get user's permission matrix
  async getUserPermissions(userId: string): Promise<PermissionMatrix>;
}
```

**DTOs:**

```typescript
interface CreateUserDto {
  phoneNumber: string;
  fullName: string;
  roleId: string;
  familyId?: string;
}

interface UpdateUserDto {
  fullName?: string;
  roleId?: string;
  familyId?: string;
}

interface PhoneChangeRequestDto {
  newPhoneNumber: string;
  currentPhoneOtp: string;
  newPhoneOtp: string;
}
```

#### 3. Roles & Permissions Module

**Tanggung Jawab:**

- Manajemen roles dan permissions
- Assignment permissions ke roles
- Query permission matrix untuk user

**Services:**

```typescript
class RolesService {
  // Get all roles
  async getRoles(): Promise<Role[]>;

  // Get role by ID
  async getRoleById(id: string): Promise<Role>;

  // Create custom role
  async createRole(dto: CreateRoleDto): Promise<Role>;

  // Update role
  async updateRole(id: string, dto: UpdateRoleDto): Promise<Role>;

  // Assign permissions to role
  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void>;

  // Get role permissions
  async getRolePermissions(roleId: string): Promise<Permission[]>;
}

class PermissionsService {
  // Get all permissions
  async getPermissions(): Promise<Permission[]>;

  // Create permission
  async createPermission(dto: CreatePermissionDto): Promise<Permission>;

  // Check if user has permission
  async checkPermission(
    userId: string,
    feature: string,
    action: 'create' | 'read' | 'update' | 'delete',
  ): Promise<boolean>;

  // Build permission matrix for user
  async buildPermissionMatrix(userId: string): Promise<PermissionMatrix>;
}
```

#### 4. Families & Residents Module

**Tanggung Jawab:**

- CRUD operasi untuk families dan residents
- Pencarian dan filtering
- Export data ke CSV

**Services:**

```typescript
class FamiliesService {
  // Create family
  async createFamily(dto: CreateFamilyDto): Promise<Family>;

  // Get family by ID
  async getFamilyById(id: string): Promise<Family>;

  // Get all families (with pagination)
  async getFamilies(query: QueryDto): Promise<PaginatedResult<Family>>;

  // Update family
  async updateFamily(id: string, dto: UpdateFamilyDto): Promise<Family>;

  // Soft delete family (cascade to residents)
  async deleteFamily(id: string): Promise<void>;

  // Get family members
  async getFamilyMembers(familyId: string): Promise<Resident[]>;
}

class ResidentsService {
  // Create resident
  async createResident(dto: CreateResidentDto): Promise<Resident>;

  // Get resident by ID
  async getResidentById(id: string): Promise<Resident>;

  // Search residents
  async searchResidents(query: SearchDto): Promise<Resident[]>;

  // Update resident
  async updateResident(id: string, dto: UpdateResidentDto): Promise<Resident>;

  // Soft delete resident
  async deleteResident(id: string): Promise<void>;

  // Export residents to CSV
  async exportToCSV(userId: string): Promise<string>;
}
```

#### 5. Audit Log Module

**Tanggung Jawab:**

- Mencatat semua kejadian penting
- Query audit logs
- Retention management

**Services:**

```typescript
class AuditLogService {
  // Log authentication attempt
  async logAuthAttempt(dto: AuthAttemptLogDto): Promise<void>;

  // Log permission check failure
  async logPermissionFailure(dto: PermissionFailureLogDto): Promise<void>;

  // Log phone change
  async logPhoneChange(dto: PhoneChangeLogDto): Promise<void>;

  // Log rate limit violation
  async logRateLimitViolation(dto: RateLimitLogDto): Promise<void>;

  // Log OTP event
  async logOtpEvent(dto: OtpEventLogDto): Promise<void>;

  // Query audit logs
  async queryLogs(query: AuditQueryDto): Promise<PaginatedResult<AuditLog>>;

  // Clean old logs (retention policy)
  async cleanOldLogs(retentionDays: number): Promise<number>;
}
```

### Backend Guards & Interceptors

#### Guards

```typescript
// jwt-auth.guard.ts
@Injectable()
class JwtAuthGuard implements CanActivate {
  // Verify JWT token dari Authorization header
  // Attach user info ke request object
  canActivate(context: ExecutionContext): boolean;
}

// permissions.guard.ts
@Injectable()
class PermissionsGuard implements CanActivate {
  // Check if user has required permission
  // Use @RequirePermission decorator untuk specify permission
  canActivate(context: ExecutionContext): boolean;
}

// rate-limit.guard.ts
@Injectable()
class RateLimitGuard implements CanActivate {
  // Check rate limits dari Redis
  // Block jika limit exceeded
  canActivate(context: ExecutionContext): boolean;
}
```

#### Interceptors

```typescript
// audit-log.interceptor.ts
@Injectable()
class AuditLogInterceptor implements NestInterceptor {
  // Log semua requests dan responses
  // Capture errors untuk audit
  intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}

// transform.interceptor.ts
@Injectable()
class TransformInterceptor implements NestInterceptor {
  // Transform response ke format standar
  // Wrap data dalam { success, data, message }
  intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
```

### Frontend Architecture

#### Struktur Folder

```
src/
├── app/
│   ├── routes/           # Route definitions
│   ├── guards/           # Route guards (permission-based)
│   └── layout/           # Layout components (sidebar, navbar)
├── features/
│   ├── auth/
│   │   ├── components/   # Login, OTP verification
│   │   ├── hooks/        # useAuth, useOtp
│   │   └── services/     # auth API calls
│   ├── dashboard/
│   │   ├── components/   # Dashboard widgets
│   │   └── hooks/        # useDashboard
│   ├── residents/
│   │   ├── components/   # Resident list, forms
│   │   ├── hooks/        # useResidents
│   │   └── services/     # residents API calls
│   └── families/
│       ├── components/   # Family list, forms
│       ├── hooks/        # useFamilies
│       └── services/     # families API calls
├── components/
│   ├── ui/               # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Table.tsx
│   │   └── Modal.tsx
│   └── forms/            # Form components
│       ├── FormInput.tsx
│       └── FormSelect.tsx
├── services/
│   ├── api.ts            # Axios instance with interceptors
│   ├── auth.service.ts   # Auth API calls
│   └── storage.service.ts # LocalStorage wrapper
├── hooks/
│   ├── usePermissions.ts # Permission checking
│   ├── useAuth.ts        # Auth state management
│   └── useApi.ts         # API call wrapper
├── utils/
│   ├── validators.ts     # Input validation
│   ├── formatters.ts     # Data formatting
│   └── constants.ts      # App constants
└── types/
    ├── auth.types.ts     # Auth-related types
    ├── user.types.ts     # User-related types
    └── api.types.ts      # API response types
```

#### Key Frontend Components

**Auth Components:**

```typescript
// LoginForm.tsx
interface LoginFormProps {
  onSuccess: () => void;
}

function LoginForm({ onSuccess }: LoginFormProps) {
  // Input nomor telepon
  // Request OTP
  // Handle errors
}

// OtpVerificationForm.tsx
interface OtpVerificationFormProps {
  phoneNumber: string;
  onSuccess: (tokens: AuthTokens) => void;
}

function OtpVerificationForm({ phoneNumber, onSuccess }: OtpVerificationFormProps) {
  // Input 6-digit OTP
  // Verify OTP
  // Store tokens
  // Redirect to dashboard
}
```

**Permission-Based Components:**

```typescript
// PermissionGuard.tsx
interface PermissionGuardProps {
  feature: string;
  action: 'create' | 'read' | 'update' | 'delete';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function PermissionGuard({ feature, action, children, fallback }: PermissionGuardProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(feature, action)) {
    return fallback || null;
  }

  return <>{children}</>;
}

// Usage:
<PermissionGuard feature="residents" action="create">
  <Button onClick={handleCreate}>Tambah Warga</Button>
</PermissionGuard>
```

**Responsive Navigation:**

```typescript
// MobileNavigation.tsx
function MobileNavigation() {
  // Bottom navigation untuk mobile
  // Show only permitted menu items
}

// DesktopNavigation.tsx
function DesktopNavigation() {
  // Sidebar navigation untuk desktop
  // Show only permitted menu items
}

// ResponsiveLayout.tsx
function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="min-h-screen">
      {isMobile ? <MobileNavigation /> : <DesktopNavigation />}
      <main className="p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
```

## Model Data

### Database Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============= Auth & Access =============

model User {
  id            String    @id @default(uuid())
  phoneNumber   String    @unique @map("phone_number")
  fullName      String    @map("full_name")
  roleId        String    @map("role_id")
  familyId      String?   @map("family_id")
  isActive      Boolean   @default(false) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  role          Role      @relation(fields: [roleId], references: [id])
  family        Family?   @relation(fields: [familyId], references: [id])
  loginLogs     LoginLog[]
  phoneChanges  PhoneChangeLog[]
  auditLogs     AuditLog[]

  @@map("users")
  @@index([phoneNumber])
  @@index([roleId])
  @@index([familyId])
}

model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  users       User[]
  permissions RolePermission[]

  @@map("roles")
}

model Permission {
  id          String   @id @default(uuid())
  feature     String
  action      String   // create, read, update, delete
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  roles       RolePermission[]

  @@unique([feature, action])
  @@map("permissions")
}

model RolePermission {
  id           String   @id @default(uuid())
  roleId       String   @map("role_id")
  permissionId String   @map("permission_id")
  createdAt    DateTime @default(now()) @map("created_at")

  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
  @@index([roleId])
  @@index([permissionId])
}

// ============= Kependudukan =============

model Family {
  id              String    @id @default(uuid())
  headOfFamily    String    @map("head_of_family")
  address         String    // Alamat lengkap rumah
  housingComplex  String    @default("Satriamekar Raya Residence 2") @map("housing_complex")
  rt              String    @default("04")
  rw              String    @default("010")
  kelurahan       String    @default("Satriamekar")
  kecamatan       String    @default("Tambun Utara")
  kabupaten       String    @default("Bekasi")
  provinsi        String    @default("Jawa Barat")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  residents       Resident[]
  users           User[]

  @@map("families")
}

model Resident {
  id              String    @id @default(uuid())
  familyId        String    @map("family_id")
  fullName        String    @map("full_name")
  idNumber        String    @unique @map("id_number") // NIK/KTP
  birthDate       DateTime  @map("birth_date")
  gender          String    // L/P
  relationship    String    // Kepala Keluarga, Istri, Anak, dll
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  family          Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)

  @@map("residents")
  @@index([familyId])
  @@index([idNumber])
}

// ============= Security & Audit =============

model LoginLog {
  id          String   @id @default(uuid())
  userId      String?  @map("user_id")
  phoneNumber String   @map("phone_number")
  ipAddress   String   @map("ip_address")
  userAgent   String   @map("user_agent")
  success     Boolean
  failReason  String?  @map("fail_reason")
  createdAt   DateTime @default(now()) @map("created_at")

  user        User?    @relation(fields: [userId], references: [id])

  @@map("login_logs")
  @@index([userId])
  @@index([phoneNumber])
  @@index([createdAt])
}

model PhoneChangeLog {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  oldPhone    String   @map("old_phone")
  newPhone    String   @map("new_phone")
  status      String   // pending, approved, rejected
  requestedAt DateTime @default(now()) @map("requested_at")
  approvedBy  String?  @map("approved_by")
  approvedAt  DateTime? @map("approved_at")

  user        User     @relation(fields: [userId], references: [id])

  @@map("phone_change_logs")
  @@index([userId])
  @@index([status])
}

model AuditLog {
  id          String   @id @default(uuid())
  userId      String?  @map("user_id")
  action      String   // auth_attempt, permission_failure, phone_change, etc
  resource    String?  // Resource yang diakses
  details     Json?    // Additional details
  ipAddress   String   @map("ip_address")
  userAgent   String   @map("user_agent")
  createdAt   DateTime @default(now()) @map("created_at")

  user        User?    @relation(fields: [userId], references: [id])

  @@map("audit_logs")
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

### Redis Data Structures

```typescript
// OTP Storage
// Key: `otp:${phoneNumber}`
// Value: hashed OTP
// TTL: 300 seconds (5 minutes)
interface OtpData {
  hashedOtp: string;
  attempts: number;
  createdAt: number;
}

// Refresh Token Storage
// Key: `refresh:${userId}:${tokenId}`
// Value: token metadata
// TTL: 2592000 seconds (30 days)
interface RefreshTokenData {
  userId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
}

// Rate Limit Storage
// Key: `ratelimit:otp:phone:${phoneNumber}`
// Value: request count
// TTL: 900 seconds (15 minutes)

// Key: `ratelimit:otp:ip:${ipAddress}`
// Value: request count
// TTL: 900 seconds (15 minutes)

// IP Block Storage
// Key: `blocked:ip:${ipAddress}`
// Value: block reason
// TTL: 3600 seconds (1 hour)
```

## Properti Ketepatan (Correctness Properties)

Properti adalah karakteristik atau perilaku yang harus berlaku benar di semua eksekusi sistem yang valid - pada dasarnya, pernyataan formal tentang apa yang harus dilakukan sistem. Properti berfungsi sebagai jembatan antara spesifikasi yang dapat dibaca manusia dan jaminan ketepatan yang dapat diverifikasi mesin.

### Properti 1: Validasi Format Nomor Telepon

_Untuk setiap_ string input yang diklaim sebagai nomor telepon, sistem harus memvalidasi format terhadap standar E.164, dan hanya menerima nomor yang valid serta menolak yang invalid dengan pesan kesalahan yang jelas.

**Validates: Requirements 1.1**

### Properti 2: Pemeriksaan Registrasi Nomor Telepon

_Untuk setiap_ nomor telepon yang valid, hasil pemeriksaan apakah nomor tersebut terdaftar harus konsisten dengan data di database - nomor yang ada di tabel users harus return true, yang tidak ada harus return false.

**Validates: Requirements 1.2**

### Properti 3: OTP Generation dan Hashing

_Untuk setiap_ OTP yang dihasilkan, OTP harus berupa string numerik 6 digit, dan ketika di-hash menggunakan bcrypt dengan salt rounds 10, hash tersebut harus dapat diverifikasi kembali dengan OTP asli (round-trip property).

**Validates: Requirements 1.4, 1.5, 18.1**

### Properti 4: OTP Time-To-Live

_Untuk setiap_ OTP yang disimpan, OTP harus memiliki TTL 5 menit, dan setelah 5 menit berlalu, verifikasi OTP harus gagal dengan error "OTP expired".

**Validates: Requirements 1.6**

### Properti 5: OTP Single-Use (Idempotence)

_Untuk setiap_ OTP yang valid, setelah berhasil diverifikasi sekali, percobaan verifikasi kedua dengan OTP yang sama harus ditolak dengan error "OTP already used".

**Validates: Requirements 1.9**

### Properti 6: JWT Token Generation Completeness

_Untuk setiap_ autentikasi yang berhasil, sistem harus menghasilkan tepat dua token: access token dan refresh token, dan keduanya harus valid JWT yang dapat di-decode.

**Validates: Requirements 1.12**

### Properti 7: Permission Matrix dalam JWT

_Untuk setiap_ JWT access token yang dihasilkan, payload token harus mengandung permission matrix lengkap yang mencakup semua fitur dan aksi (create, read, update, delete) sesuai dengan role pengguna.

**Validates: Requirements 1.13, 4.9**

### Properti 8: Rate Limiting OTP per Nomor Telepon

_Untuk setiap_ nomor telepon, dalam jendela waktu 15 menit, sistem harus menerima maksimal 3 permintaan OTP, dan permintaan ke-4 harus ditolak dengan error "Rate limit exceeded".

**Validates: Requirements 2.1**

### Properti 9: Rate Limiting OTP per IP Address

_Untuk setiap_ alamat IP, dalam jendela waktu 15 menit, sistem harus menerima maksimal 10 permintaan OTP, dan permintaan ke-11 harus ditolak dengan error "Rate limit exceeded".

**Validates: Requirements 2.2**

### Properti 10: Rate Limiting Verifikasi OTP

_Untuk setiap_ token OTP, sistem harus menerima maksimal 5 percobaan verifikasi, dan percobaan ke-6 harus membatalkan OTP dan mengembalikan error "OTP invalidated due to too many attempts".

**Validates: Requirements 2.5**

### Properti 11: Retry Logic dengan Exponential Backoff

_Untuk setiap_ kegagalan pengiriman OTP via WhatsApp Gateway, sistem harus melakukan retry maksimal 3 kali dengan exponential backoff, dan jika semua retry gagal, harus mencatat error dan mengembalikan pesan yang ramah pengguna.

**Validates: Requirements 3.1**

### Properti 12: RBAC Permission Check Consistency

_Untuk setiap_ kombinasi user dan permission (feature + action), hasil pemeriksaan izin harus konsisten dengan role assignment user - jika role user memiliki permission tersebut, check harus return true, jika tidak harus return false.

**Validates: Requirements 4.7**

### Properti 13: Access Token Expiration

_Untuk setiap_ access token yang dihasilkan, token harus memiliki expiration time tepat 15 menit dari waktu pembuatan, dan setelah 15 menit, token harus ditolak dengan error "Token expired".

**Validates: Requirements 5.1**

### Properti 14: Refresh Token Expiration

_Untuk setiap_ refresh token yang dihasilkan, token harus memiliki expiration time tepat 30 hari dari waktu pembuatan, dan setelah 30 hari, token harus ditolak dengan error "Refresh token expired".

**Validates: Requirements 5.2**

### Properti 15: Refresh Token Rotation

_Untuk setiap_ penggunaan refresh token yang valid, sistem harus menghasilkan refresh token baru dan membatalkan token lama, sehingga percobaan menggunakan token lama kedua kali harus ditolak dengan error "Invalid refresh token".

**Validates: Requirements 5.4**

### Properti 16: Token Invalidation pada Logout

_Untuk setiap_ operasi logout, sistem harus membatalkan access token dan refresh token user, sehingga percobaan menggunakan token tersebut setelah logout harus ditolak dengan error "Token invalidated".

**Validates: Requirements 5.6**

### Properti 17: Uniqueness Constraint untuk Nomor Telepon dan KTP

_Untuk setiap_ operasi create atau update user/resident, sistem harus memvalidasi uniqueness nomor telepon (untuk user) dan nomor KTP (untuk resident), dan menolak operasi jika nomor sudah terdaftar dengan error "Phone number/ID number already exists".

**Validates: Requirements 6.9, 7.5, 8.4, 15.3**

### Properti 18: Cascade Soft Delete untuk Family

_Untuk setiap_ family yang di-soft-delete (deleted_at di-set), semua residents yang terkait dengan family tersebut harus otomatis ter-soft-delete juga (deleted_at mereka juga di-set).

**Validates: Requirements 8.9**

### Properti 19: Audit Log Immutability

_Untuk setiap_ entri audit log yang sudah dibuat, sistem tidak boleh menyediakan operasi update atau delete untuk entri tersebut - semua audit log harus immutable.

**Validates: Requirements 9.11**

### Properti 20: Permission-Based Export Access

_Untuk setiap_ permintaan export data, sistem harus memeriksa permission user, dan menolak permintaan dari user tanpa permission "export" dengan error HTTP 403 Forbidden.

**Validates: Requirements 10.3**

### Properti 21: Health Check Dependency Status

_Untuk setiap_ health check request, jika ada dependency (database, Redis, WhatsApp Gateway) yang tidak sehat, sistem harus mengembalikan HTTP 503 Service Unavailable dengan detail dependency yang bermasalah.

**Validates: Requirements 11.5**

### Properti 22: Permission-Based UI Component Rendering

_Untuk setiap_ komponen UI yang memerlukan permission tertentu, komponen tersebut tidak boleh di-render jika user tidak memiliki permission yang diperlukan - DOM tidak boleh mengandung komponen tersebut.

**Validates: Requirements 13.3**

### Properti 23: Soft Delete Implementation

_Untuk setiap_ operasi delete pada entities yang mendukung soft delete (users, families, residents), record tidak boleh dihapus dari database, tetapi harus di-mark dengan timestamp deleted_at, dan query default tidak boleh mengembalikan record yang ter-soft-delete.

**Validates: Requirements 15.6**

### Properti 24: Input Sanitization untuk SQL Injection

_Untuk setiap_ input pengguna yang digunakan dalam query database, input harus di-sanitize atau di-parameterize sehingga SQL injection patterns (seperti `'; DROP TABLE--`) tidak dapat dieksekusi sebagai SQL command.

**Validates: Requirements 18.5**

## Penanganan Error

### Strategi Error Handling

**Backend Error Handling:**

```typescript
// Global exception filter
@Catch()
class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Determine error type and status code
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message;
      code = (exceptionResponse as any).code || 'HTTP_ERROR';
    } else if (exception instanceof PrismaClientKnownRequestError) {
      // Handle Prisma errors
      status = HttpStatus.BAD_REQUEST;
      message = this.handlePrismaError(exception);
      code = 'DATABASE_ERROR';
    }

    // Log error (but don't expose details to client in production)
    this.logger.error({
      message,
      code,
      stack: exception instanceof Error ? exception.stack : undefined,
      path: request.url,
      method: request.method,
    });

    // Return sanitized error response
    response.status(status).json({
      success: false,
      error: {
        code,
        message:
          process.env.NODE_ENV === 'production' ? this.sanitizeErrorMessage(message) : message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

**Error Codes:**

```typescript
enum ErrorCode {
  // Auth errors
  INVALID_PHONE_NUMBER = 'INVALID_PHONE_NUMBER',
  PHONE_NOT_REGISTERED = 'PHONE_NOT_REGISTERED',
  INVALID_OTP = 'INVALID_OTP',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_ALREADY_USED = 'OTP_ALREADY_USED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',

  // Permission errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Data errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INVALID_INPUT = 'INVALID_INPUT',

  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

**Frontend Error Handling:**

```typescript
// API error interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle specific error codes
      switch (data.error?.code) {
        case 'TOKEN_EXPIRED':
          // Try to refresh token
          return refreshTokenAndRetry(error.config);

        case 'PERMISSION_DENIED':
          // Redirect to dashboard
          router.push('/dashboard');
          toast.error('Anda tidak memiliki izin untuk aksi ini');
          break;

        case 'RATE_LIMIT_EXCEEDED':
          toast.error('Terlalu banyak percobaan. Silakan coba lagi nanti.');
          break;

        default:
          // Show generic error message
          toast.error(data.error?.message || 'Terjadi kesalahan');
      }
    } else if (error.request) {
      // Network error
      toast.error('Tidak dapat terhubung ke server');
    }

    return Promise.reject(error);
  },
);
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
    path: string;
    details?: any; // Only in development
  };
}
```

## Strategi Testing

### Pendekatan Testing Dual

Sistem WargaNet menggunakan pendekatan testing dual yang menggabungkan unit testing dan property-based testing untuk coverage yang komprehensif:

**Unit Tests:**

- Memverifikasi contoh spesifik dan edge cases
- Menguji kondisi error
- Menguji integrasi antar komponen
- Fokus pada skenario konkret yang mendemonstrasikan perilaku yang benar

**Property-Based Tests:**

- Memverifikasi properti universal di semua input
- Coverage input yang komprehensif melalui randomisasi
- Minimum 100 iterasi per property test
- Setiap test harus reference properti dari dokumen desain

### Backend Testing

**Unit Testing dengan Jest:**

```typescript
// Example: OTP Service Unit Tests
describe('OtpService', () => {
  let service: OtpService;

  beforeEach(() => {
    service = new OtpService();
  });

  describe('generateOtp', () => {
    it('should generate 6-digit numeric OTP', () => {
      const otp = service.generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate different OTPs on multiple calls', () => {
      const otp1 = service.generateOtp();
      const otp2 = service.generateOtp();
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('hashOtp', () => {
    it('should hash OTP using bcrypt', async () => {
      const otp = '123456';
      const hashed = await service.hashOtp(otp);
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(otp);
    });
  });

  describe('verifyOtp', () => {
    it('should verify correct OTP', async () => {
      const otp = '123456';
      const hashed = await service.hashOtp(otp);
      const result = await service.verifyOtp(otp, hashed);
      expect(result).toBe(true);
    });

    it('should reject incorrect OTP', async () => {
      const otp = '123456';
      const hashed = await service.hashOtp(otp);
      const result = await service.verifyOtp('654321', hashed);
      expect(result).toBe(false);
    });
  });
});
```

**Property-Based Testing dengan fast-check:**

```typescript
import * as fc from 'fast-check';

// Feature: warganet-system, Property 3: OTP Generation dan Hashing
describe('Property: OTP Generation dan Hashing', () => {
  it('should generate 6-digit numeric OTP and verify round-trip hashing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 999999 }).map((n) => n.toString().padStart(6, '0')),
        async (otp) => {
          const service = new OtpService();
          const hashed = await service.hashOtp(otp);
          const verified = await service.verifyOtp(otp, hashed);
          expect(verified).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: warganet-system, Property 1: Validasi Format Nomor Telepon
describe('Property: Validasi Format Nomor Telepon', () => {
  it('should accept valid E.164 phone numbers and reject invalid ones', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Valid Indonesian phone numbers
          fc.string({ minLength: 10, maxLength: 13 }).map((s) => '+62' + s.replace(/\D/g, '')),
          // Invalid formats
          fc.string({ minLength: 1, maxLength: 20 }),
        ),
        (phoneNumber) => {
          const validator = new PhoneValidator();
          const result = validator.validate(phoneNumber);

          // Valid E.164 format should pass
          if (/^\+62\d{9,12}$/.test(phoneNumber)) {
            expect(result.isValid).toBe(true);
          } else {
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: warganet-system, Property 8: Rate Limiting OTP per Nomor Telepon
describe('Property: Rate Limiting OTP per Nomor Telepon', () => {
  it('should allow max 3 OTP requests per phone in 15 minutes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 13 }).map((s) => '+62' + s.replace(/\D/g, '')),
        async (phoneNumber) => {
          const service = new AuthService();
          const redis = new Redis();

          // Clear any existing rate limit
          await redis.del(`ratelimit:otp:phone:${phoneNumber}`);

          // First 3 requests should succeed
          for (let i = 0; i < 3; i++) {
            const result = await service.requestOtp(phoneNumber, '127.0.0.1');
            expect(result.success).toBe(true);
          }

          // 4th request should fail
          await expect(service.requestOtp(phoneNumber, '127.0.0.1')).rejects.toThrow(
            'Rate limit exceeded',
          );
        },
      ),
      { numRuns: 50 }, // Reduced runs for integration tests
    );
  });
});
```

**Integration Testing:**

```typescript
describe('Auth API Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/request-otp', () => {
    it('should request OTP for registered phone number', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ phoneNumber: '+6281234567890' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('OTP sent');
    });

    it('should reject unregistered phone number', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ phoneNumber: '+6289999999999' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PHONE_NOT_REGISTERED');
    });

    it('should enforce rate limiting', async () => {
      const phoneNumber = '+6281234567890';

      // Make 3 requests (should succeed)
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/request-otp')
          .send({ phoneNumber })
          .expect(200);
      }

      // 4th request should fail
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ phoneNumber })
        .expect(429);

      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});
```

### Frontend Testing

**Component Testing dengan React Testing Library:**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should render phone number input', () => {
    render(<LoginForm onSuccess={jest.fn()} />);
    expect(screen.getByLabelText(/nomor telepon/i)).toBeInTheDocument();
  });

  it('should validate phone number format', async () => {
    render(<LoginForm onSuccess={jest.fn()} />);

    const input = screen.getByLabelText(/nomor telepon/i);
    const button = screen.getByRole('button', { name: /kirim otp/i });

    // Invalid format
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/format nomor telepon tidak valid/i)).toBeInTheDocument();
    });
  });

  it('should request OTP on valid phone number', async () => {
    const mockRequestOtp = jest.fn().mockResolvedValue({ success: true });
    jest.spyOn(authService, 'requestOtp').mockImplementation(mockRequestOtp);

    render(<LoginForm onSuccess={jest.fn()} />);

    const input = screen.getByLabelText(/nomor telepon/i);
    const button = screen.getByRole('button', { name: /kirim otp/i });

    fireEvent.change(input, { target: { value: '+6281234567890' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith('+6281234567890');
    });
  });
});

// Permission-based component test
describe('PermissionGuard', () => {
  it('should render children when user has permission', () => {
    const mockPermissions = {
      residents: { create: true, read: true, update: true, delete: false }
    };

    render(
      <PermissionContext.Provider value={{ permissions: mockPermissions }}>
        <PermissionGuard feature="residents" action="create">
          <button>Tambah Warga</button>
        </PermissionGuard>
      </PermissionContext.Provider>
    );

    expect(screen.getByText('Tambah Warga')).toBeInTheDocument();
  });

  it('should not render children when user lacks permission', () => {
    const mockPermissions = {
      residents: { create: false, read: true, update: false, delete: false }
    };

    render(
      <PermissionContext.Provider value={{ permissions: mockPermissions }}>
        <PermissionGuard feature="residents" action="create">
          <button>Tambah Warga</button>
        </PermissionGuard>
      </PermissionContext.Provider>
    );

    expect(screen.queryByText('Tambah Warga')).not.toBeInTheDocument();
  });
});
```

**E2E Testing dengan Playwright:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('OTP Login Flow', () => {
  test('should complete full login flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');

    // Enter phone number
    await page.fill('input[name="phoneNumber"]', '+6281234567890');
    await page.click('button:has-text("Kirim OTP")');

    // Wait for OTP form
    await expect(page.locator('text=Masukkan Kode OTP')).toBeVisible();

    // Enter OTP (in test environment, use test OTP)
    await page.fill('input[name="otp"]', '123456');
    await page.click('button:has-text("Verifikasi")');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error for invalid OTP', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="phoneNumber"]', '+6281234567890');
    await page.click('button:has-text("Kirim OTP")');

    await page.fill('input[name="otp"]', '000000');
    await page.click('button:has-text("Verifikasi")');

    await expect(page.locator('text=Kode OTP tidak valid')).toBeVisible();
  });
});

test.describe('Permission-Based UI', () => {
  test('WARGA should not see admin features', async ({ page }) => {
    // Login as WARGA
    await loginAs(page, 'warga');

    // Should not see user management menu
    await expect(page.locator('text=Kelola Pengguna')).not.toBeVisible();

    // Should not see export button
    await page.goto('http://localhost:3000/residents');
    await expect(page.locator('button:has-text("Export")')).not.toBeVisible();
  });

  test('ADMIN_RT should see all features', async ({ page }) => {
    // Login as ADMIN_RT
    await loginAs(page, 'admin_rt');

    // Should see user management menu
    await expect(page.locator('text=Kelola Pengguna')).toBeVisible();

    // Should see export button
    await page.goto('http://localhost:3000/residents');
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });
});
```

### Test Coverage Requirements

- **Backend**: Minimum 80% code coverage
- **Frontend**: Minimum 70% code coverage
- **Property Tests**: Minimum 100 iterations per property
- **CI/CD**: All tests must pass before deployment
- **Critical Paths**: 100% coverage untuk auth flow dan RBAC

### Mocking Strategy

**External Dependencies:**

```typescript
// Mock WhatsApp Gateway
class MockWhatsAppService implements IWhatsAppService {
  async sendOtp(phoneNumber: string, otp: string): Promise<SendResult> {
    // Simulate success in test environment
    return { success: true, messageId: 'test-msg-id' };
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }
}

// Mock Redis for testing
class MockRedisService implements IRedisService {
  private store: Map<string, any> = new Map();

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.store.set(key, { value, expiresAt: ttl ? Date.now() + ttl * 1000 : null });
  }

  async get(key: string): Promise<any> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
}
```

## Kesimpulan

Dokumen desain ini menyediakan blueprint komprehensif untuk implementasi sistem WargaNet. Desain menekankan:

1. **Keamanan**: OTP-based auth, RBAC, audit logging, rate limiting
2. **Skalabilitas**: Stateless architecture, Redis caching, connection pooling
3. **Maintainability**: Clean architecture, separation of concerns, comprehensive testing
4. **Accessibility**: Mobile-first design, WCAG compliance, elderly-friendly UI
5. **Correctness**: 24 properti formal yang dapat diverifikasi melalui property-based testing

Implementasi harus mengikuti desain ini dengan ketat untuk memastikan sistem yang aman, reliable, dan mudah dipelihara.
