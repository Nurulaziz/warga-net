# Coding Guidelines - WargaNet

Panduan coding untuk memastikan konsistensi dan kualitas kode di seluruh project WargaNet.

## 1. Komentar Kode

### ✅ Prinsip Utama

- **Simple & Jelas**: Komentar harus singkat dan mudah dipahami
- **Bahasa Indonesia**: Gunakan bahasa Indonesia untuk komentar (sesuai konteks project)
- **Tidak Bertele-tele**: Langsung ke inti, hindari penjelasan panjang
- **Self-Documenting Code**: Biarkan nama variable/function menjelaskan dirinya sendiri

### ✅ Contoh BAIK

```typescript
// Generate OTP 6 digit
generateOtp(): string {
  return Math.random().toString().slice(2, 8);
}

// Hash password dengan bcrypt
async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Validasi format nomor telepon
validatePhoneNumber(phone: string): boolean {
  return /^\+62\d{9,13}$/.test(phone);
}
```

### ❌ Contoh BURUK (Terlalu Panjang)

```typescript
// This function is responsible for generating a one-time password
// that consists of exactly 6 numeric digits which will be used
// for authentication purposes in the OTP verification flow
generateOtp(): string {
  return Math.random().toString().slice(2, 8);
}
```

### 📝 Kapan Perlu Komentar?

- **Perlu**: Logic kompleks yang tidak obvious
- **Perlu**: Business rules penting
- **Perlu**: Workaround atau hack temporary
- **Tidak Perlu**: Kode yang sudah jelas dari nama function/variable

## 2. Naming Conventions

### Variables & Functions

```typescript
// ✅ BAIK - Descriptive & clear
const userPhoneNumber = '+628123456789';
const isActive = true;
const maxRetryAttempts = 3;

async function sendOtpToUser(phoneNumber: string): Promise<void> {}
function calculateTotalAmount(items: Item[]): number {}

// ❌ BURUK - Tidak jelas
const pn = '+628123456789';
const flag = true;
const max = 3;

async function send(phone: string): Promise<void> {}
function calc(arr: Item[]): number {}
```

### Classes & Interfaces

```typescript
// ✅ BAIK - PascalCase, descriptive
class OtpService {}
class UserRepository {}
interface AuthTokens {}
interface PermissionMatrix {}

// ❌ BURUK
class otpservice {}
class user_repo {}
interface authTokens {}
```

### Constants

```typescript
// ✅ BAIK - UPPER_SNAKE_CASE untuk constants
const MAX_OTP_ATTEMPTS = 5;
const OTP_TTL_SECONDS = 300;
const DEFAULT_PAGE_SIZE = 20;

// ❌ BURUK
const maxOtpAttempts = 5;
const otpTtl = 300;
```

### Files & Folders

```typescript
// ✅ BAIK - kebab-case untuk files
otp.service.ts;
user.repository.ts;
auth.controller.ts;
phone - validation.util.ts;

// ❌ BURUK
OtpService.ts;
user_repository.ts;
AuthController.ts;
```

## 3. Function Structure

### Keep Functions Small

```typescript
// ✅ BAIK - Single responsibility
async function validateOtp(otp: string, hashedOtp: string): Promise<boolean> {
  return bcrypt.compare(otp, hashedOtp);
}

async function sendOtpMessage(phoneNumber: string, otp: string): Promise<void> {
  await whatsappService.send(phoneNumber, `Kode OTP: ${otp}`);
}

// ❌ BURUK - Terlalu banyak tanggung jawab
async function handleOtp(phoneNumber: string): Promise<boolean> {
  const otp = generateOtp();
  const hashed = await bcrypt.hash(otp, 10);
  await redis.set(`otp:${phoneNumber}`, hashed);
  await whatsappService.send(phoneNumber, `Kode OTP: ${otp}`);
  return true;
}
```

### Early Returns

```typescript
// ✅ BAIK - Early return untuk validasi
async function processPayment(amount: number): Promise<void> {
  if (amount <= 0) {
    throw new BadRequestException('Amount harus positif');
  }

  if (amount > MAX_AMOUNT) {
    throw new BadRequestException('Amount melebihi limit');
  }

  // Process payment
  await paymentService.process(amount);
}

// ❌ BURUK - Nested if
async function processPayment(amount: number): Promise<void> {
  if (amount > 0) {
    if (amount <= MAX_AMOUNT) {
      await paymentService.process(amount);
    } else {
      throw new BadRequestException('Amount melebihi limit');
    }
  } else {
    throw new BadRequestException('Amount harus positif');
  }
}
```

## 4. Error Handling

### Descriptive Error Messages

```typescript
// ✅ BAIK - Error message jelas
if (!user) {
  throw new NotFoundException('User tidak ditemukan');
}

if (attempts >= MAX_ATTEMPTS) {
  throw new TooManyRequestsException('Terlalu banyak percobaan, coba lagi nanti');
}

// ❌ BURUK - Error message tidak jelas
if (!user) {
  throw new Error('Error');
}

if (attempts >= MAX_ATTEMPTS) {
  throw new Error('Failed');
}
```

### Try-Catch Usage

```typescript
// ✅ BAIK - Catch specific errors
try {
  await whatsappService.sendOtp(phoneNumber, otp);
} catch (error) {
  this.logger.error('Gagal kirim OTP via WhatsApp', error);
  throw new ServiceUnavailableException('Layanan WhatsApp tidak tersedia');
}

// ❌ BURUK - Silent catch
try {
  await whatsappService.sendOtp(phoneNumber, otp);
} catch (error) {
  // Do nothing
}
```

## 5. TypeScript Best Practices

### Type Safety

```typescript
// ✅ BAIK - Explicit types
interface CreateUserDto {
  phoneNumber: string;
  fullName: string;
  roleId: string;
}

function createUser(dto: CreateUserDto): Promise<User> {
  return this.userRepository.create(dto);
}

// ❌ BURUK - Any types
function createUser(dto: any): Promise<any> {
  return this.userRepository.create(dto);
}
```

### Avoid Magic Numbers/Strings

```typescript
// ✅ BAIK - Named constants
const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 300;
const MAX_RETRY_ATTEMPTS = 3;

function generateOtp(): string {
  return Math.random()
    .toString()
    .slice(2, 2 + OTP_LENGTH);
}

// ❌ BURUK - Magic numbers
function generateOtp(): string {
  return Math.random().toString().slice(2, 8);
}
```

## 6. Async/Await

### Always Use Async/Await

```typescript
// ✅ BAIK - Async/await
async function getUserData(userId: string): Promise<User> {
  const user = await this.userRepository.findById(userId);
  const permissions = await this.permissionService.getUserPermissions(userId);
  return { ...user, permissions };
}

// ❌ BURUK - Promise chains
function getUserData(userId: string): Promise<User> {
  return this.userRepository
    .findById(userId)
    .then((user) =>
      this.permissionService
        .getUserPermissions(userId)
        .then((permissions) => ({ ...user, permissions })),
    );
}
```

## 7. Code Organization

### File Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts      # HTTP endpoints
│   │   ├── auth.service.ts         # Business logic
│   │   ├── auth.module.ts          # Module definition
│   │   ├── dto/                    # Data Transfer Objects
│   │   │   ├── login.dto.ts
│   │   │   └── otp-verify.dto.ts
│   │   ├── guards/                 # Guards
│   │   │   └── jwt-auth.guard.ts
│   │   └── tests/                  # Tests
│   │       └── auth.service.spec.ts
│   └── users/
│       └── ...
├── common/                         # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   └── utils/
└── config/                         # Configuration
```

### Import Order

```typescript
// ✅ BAIK - Organized imports
// 1. External libraries
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

// 2. Internal modules
import { UserRepository } from './user.repository';
import { OtpService } from '../otp/otp.service';

// 3. Types/Interfaces
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

// 4. Constants
import { MAX_OTP_ATTEMPTS } from './constants';
```

## 8. Testing

### Test Naming

```typescript
// ✅ BAIK - Descriptive test names
describe('OtpService', () => {
  describe('generateOtp', () => {
    it('harus generate OTP 6 digit', () => {
      const otp = service.generateOtp();
      expect(otp).toHaveLength(6);
    });

    it('harus generate OTP numeric', () => {
      const otp = service.generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });
  });
});

// ❌ BURUK - Tidak jelas
describe('OtpService', () => {
  it('test 1', () => {
    expect(service.generateOtp()).toBeDefined();
  });
});
```

## 9. Security

### Never Hardcode Secrets

```typescript
// ✅ BAIK - Use environment variables
const jwtSecret = process.env.JWT_SECRET;
const databaseUrl = process.env.DATABASE_URL;

// ❌ BURUK - Hardcoded secrets
const jwtSecret = 'my-secret-key-123';
const databaseUrl = 'postgresql://user:pass@localhost/db';
```

### Validate All Inputs

```typescript
// ✅ BAIK - Input validation
@Post('login')
async login(@Body() dto: LoginDto) {
  // DTO sudah divalidasi dengan class-validator
  return this.authService.login(dto);
}

// ❌ BURUK - No validation
@Post('login')
async login(@Body() body: any) {
  return this.authService.login(body);
}
```

## 10. Performance

### Avoid N+1 Queries

```typescript
// ✅ BAIK - Eager loading
const users = await this.userRepository.find({
  relations: ['role', 'family'],
});

// ❌ BURUK - N+1 problem
const users = await this.userRepository.find();
for (const user of users) {
  user.role = await this.roleRepository.findOne(user.roleId);
}
```

### Use Caching Wisely

```typescript
// ✅ BAIK - Cache data yang jarang berubah
async getRoles(): Promise<Role[]> {
  const cached = await this.redis.get('roles');
  if (cached) return JSON.parse(cached);

  const roles = await this.roleRepository.find();
  await this.redis.setex('roles', 3600, JSON.stringify(roles));
  return roles;
}
```

## 11. Git Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: Fitur baru
- `fix`: Bug fix
- `docs`: Dokumentasi
- `style`: Formatting, missing semicolons, etc
- `refactor`: Code refactoring
- `test`: Menambah tests
- `chore`: Maintenance tasks

### Contoh

```
feat(auth): implementasi OTP authentication

- Generate OTP 6 digit
- Kirim OTP via WhatsApp
- Validasi OTP dengan rate limiting

Closes #123
```

## 12. Code Review Checklist

Sebelum submit PR, pastikan:

- [ ] Kode sudah di-format dengan Prettier
- [ ] Tidak ada ESLint errors/warnings
- [ ] Type checking pass (`pnpm type-check`)
- [ ] Tests pass (`pnpm test`)
- [ ] Komentar simple dan jelas
- [ ] Tidak ada hardcoded secrets
- [ ] Error handling proper
- [ ] Input validation ada
- [ ] Naming conventions diikuti
- [ ] No console.log (gunakan logger)

## Kesimpulan

Ikuti guidelines ini untuk menjaga kualitas dan konsistensi kode. Jika ada pertanyaan atau saran improvement, diskusikan dengan tim.

**Remember**: Clean code is not about following rules blindly, but about making code easy to read, understand, and maintain.
