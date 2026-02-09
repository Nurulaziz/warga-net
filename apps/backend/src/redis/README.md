# Redis Module

Module untuk integrasi Redis dengan NestJS, menyediakan caching layer dan session management untuk aplikasi WargaNet.

## Features

- ✅ Connection pooling dengan automatic reconnection
- ✅ Exponential backoff untuk reconnection strategy
- ✅ Error handling yang comprehensive
- ✅ Health check untuk monitoring
- ✅ Support untuk semua operasi Redis dasar
- ✅ Type-safe dengan TypeScript
- ✅ Global module (tersedia di seluruh aplikasi)

## Installation

Module sudah ter-install dan ter-konfigurasi. Redis dependency: `redis@^4.6.12`

## Configuration

Konfigurasi via environment variables di `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Usage

### Import Module

RedisModule adalah global module, jadi otomatis tersedia di semua module lain:

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [RedisModule],
})
export class AppModule {}
```

### Inject Service

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Injectable()
export class OtpService {
  constructor(private readonly redisService: RedisService) {}

  async storeOtp(phoneNumber: string, hashedOtp: string): Promise<void> {
    const key = `otp:${phoneNumber}`;
    const ttl = 300; // 5 minutes
    await this.redisService.setex(key, ttl, hashedOtp);
  }

  async getOtp(phoneNumber: string): Promise<string | null> {
    const key = `otp:${phoneNumber}`;
    return await this.redisService.get(key);
  }
}
```

## API Methods

### Basic Operations

#### `set(key: string, value: string, ttl?: number): Promise<void>`

Set key-value dengan optional TTL.

```typescript
// Tanpa TTL
await redisService.set('user:123', 'John Doe');

// Dengan TTL (5 menit)
await redisService.set('session:abc', 'token-data', 300);
```

#### `get(key: string): Promise<string | null>`

Get value by key.

```typescript
const value = await redisService.get('user:123');
```

#### `del(key: string): Promise<void>`

Delete key.

```typescript
await redisService.del('user:123');
```

#### `setex(key: string, ttl: number, value: string): Promise<void>`

Set key-value dengan TTL (alias untuk `set` dengan ttl).

```typescript
await redisService.setex('otp:+6281234567890', 300, 'hashed-otp');
```

#### `exists(key: string): Promise<boolean>`

Check if key exists.

```typescript
const exists = await redisService.exists('user:123');
```

### TTL Operations

#### `ttl(key: string): Promise<number>`

Get remaining TTL untuk key (dalam detik).

```typescript
const remainingSeconds = await redisService.ttl('otp:+6281234567890');
```

#### `expire(key: string, ttl: number): Promise<void>`

Set expiry untuk existing key.

```typescript
await redisService.expire('session:abc', 3600);
```

### Counter Operations

#### `incr(key: string): Promise<number>`

Increment value (untuk rate limiting).

```typescript
const count = await redisService.incr('ratelimit:phone:+6281234567890');
```

### Multiple Keys Operations

#### `mget(...keys: string[]): Promise<(string | null)[]>`

Get multiple keys.

```typescript
const values = await redisService.mget('user:1', 'user:2', 'user:3');
```

#### `mdel(...keys: string[]): Promise<void>`

Delete multiple keys.

```typescript
await redisService.mdel('session:1', 'session:2', 'session:3');
```

#### `keys(pattern: string): Promise<string[]>`

Get keys by pattern.

```typescript
const otpKeys = await redisService.keys('otp:*');
const userSessions = await redisService.keys('session:user:123:*');
```

### Health Check

#### `isHealthy(): Promise<boolean>`

Check Redis connectivity.

```typescript
const healthy = await redisService.isHealthy();
```

## Use Cases

### 1. OTP Storage

```typescript
// Store OTP dengan TTL 5 menit
const phoneNumber = '+6281234567890';
const hashedOtp = await bcrypt.hash(otp, 10);
await redisService.setex(`otp:${phoneNumber}`, 300, hashedOtp);

// Get OTP
const storedOtp = await redisService.get(`otp:${phoneNumber}`);

// Invalidate OTP setelah digunakan
await redisService.del(`otp:${phoneNumber}`);
```

### 2. Rate Limiting

```typescript
// Check dan increment rate limit
const key = `ratelimit:otp:phone:${phoneNumber}`;
const count = await redisService.incr(key);

if (count === 1) {
  // First request, set TTL
  await redisService.expire(key, 900); // 15 minutes
}

if (count > 3) {
  throw new TooManyRequestsException('Rate limit exceeded');
}
```

### 3. Refresh Token Storage

```typescript
// Store refresh token dengan TTL 30 hari
const userId = 'user-123';
const tokenId = 'token-456';
const key = `refresh:${userId}:${tokenId}`;
const tokenData = JSON.stringify({
  userId,
  token: refreshToken,
  createdAt: Date.now(),
});

await redisService.setex(key, 2592000, tokenData); // 30 days

// Invalidate all tokens untuk user (logout all devices)
const userTokens = await redisService.keys(`refresh:${userId}:*`);
await redisService.mdel(...userTokens);
```

### 4. Session Management

```typescript
// Store session
const sessionId = 'session-abc';
const sessionData = JSON.stringify({ userId: '123', role: 'ADMIN_RT' });
await redisService.setex(`session:${sessionId}`, 3600, sessionData);

// Get session
const session = await redisService.get(`session:${sessionId}`);
const data = session ? JSON.parse(session) : null;

// Extend session (sliding timeout)
if (session) {
  await redisService.expire(`session:${sessionId}`, 3600);
}
```

## Error Handling

Semua methods akan throw error jika Redis client tidak connected:

```typescript
try {
  await redisService.set('key', 'value');
} catch (error) {
  // Handle error: "Redis client not connected"
}
```

## Connection Management

Connection dikelola otomatis oleh NestJS lifecycle:

- `onModuleInit()`: Connect ke Redis saat module initialize
- `onModuleDestroy()`: Disconnect saat module destroy

Reconnection strategy dengan exponential backoff:

- Max 10 retry attempts
- Delay: `Math.min(retries * 100, 3000)` ms
- Max delay: 3000ms (3 detik)

## Monitoring

### Health Check Endpoint

```bash
# Basic health check
GET /health

# Detailed health check dengan dependency status
GET /health/detailed
```

Response jika healthy:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-10T00:00:00.000Z",
  "dependencies": {
    "redis": {
      "status": "healthy",
      "message": "Connected"
    }
  }
}
```

Response jika unhealthy (HTTP 503):

```json
{
  "status": "unhealthy",
  "timestamp": "2026-02-10T00:00:00.000Z",
  "dependencies": {
    "redis": {
      "status": "unhealthy",
      "message": "Connection failed"
    }
  }
}
```

## Testing

### Unit Tests

```bash
pnpm test redis.service.spec.ts
```

### Integration Tests

```bash
# Pastikan Redis running
docker-compose up -d redis

# Run integration tests
pnpm test redis.integration.spec.ts
```

## Logging

RedisService menggunakan NestJS Logger untuk logging:

- Connection events (connect, ready, error, reconnecting, end)
- Operation errors dengan detail
- Health check failures

Log level dapat dikonfigurasi via NestJS configuration.

## Best Practices

1. **Gunakan key prefix yang jelas**: `otp:`, `session:`, `ratelimit:`, dll
2. **Selalu set TTL**: Hindari memory leak dengan set TTL untuk temporary data
3. **Handle errors**: Wrap Redis operations dalam try-catch
4. **Use patterns wisely**: `keys()` operation bisa lambat di production, gunakan dengan hati-hati
5. **Monitor health**: Gunakan health check endpoint untuk monitoring

## Requirements Validation

Module ini memenuhi requirements:

- ✅ **Requirement 5.5**: Refresh token storage di Redis dengan TTL
- ✅ **Requirement 11.3**: Redis health check dalam pemeriksaan kesehatan
- ✅ **Requirement 17.10**: Redis configuration untuk caching dan session management
