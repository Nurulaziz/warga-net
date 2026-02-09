import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService Integration Tests', () => {
  let service: RedisService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
      ],
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
    await service.onModuleInit();
  });

  afterAll(async () => {
    await service.onModuleDestroy();
    await module.close();
  });

  beforeEach(async () => {
    // Cleanup test keys sebelum setiap test
    const testKeys = await service.keys('test:*');
    if (testKeys.length > 0) {
      await service.mdel(...testKeys);
    }
  });

  describe('Health Check', () => {
    it('harus return true jika Redis connected', async () => {
      const isHealthy = await service.isHealthy();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Basic Operations', () => {
    it('harus set dan get value', async () => {
      const key = 'test:basic';
      const value = 'test-value';

      await service.set(key, value);
      const result = await service.get(key);

      expect(result).toBe(value);
    });

    it('harus return null untuk key yang tidak ada', async () => {
      const result = await service.get('test:nonexistent');
      expect(result).toBeNull();
    });

    it('harus delete key', async () => {
      const key = 'test:delete';
      await service.set(key, 'value');

      await service.del(key);
      const result = await service.get(key);

      expect(result).toBeNull();
    });
  });

  describe('TTL Operations', () => {
    it('harus set value dengan TTL', async () => {
      const key = 'test:ttl';
      const value = 'test-value';
      const ttl = 10;

      await service.setex(key, ttl, value);
      const result = await service.get(key);
      const remainingTtl = await service.ttl(key);

      expect(result).toBe(value);
      expect(remainingTtl).toBeGreaterThan(0);
      expect(remainingTtl).toBeLessThanOrEqual(ttl);
    });

    it('harus set value dengan TTL menggunakan set method', async () => {
      const key = 'test:ttl-set';
      const value = 'test-value';
      const ttl = 10;

      await service.set(key, value, ttl);
      const result = await service.get(key);
      const remainingTtl = await service.ttl(key);

      expect(result).toBe(value);
      expect(remainingTtl).toBeGreaterThan(0);
      expect(remainingTtl).toBeLessThanOrEqual(ttl);
    });

    it('harus set expiry untuk existing key', async () => {
      const key = 'test:expire';
      await service.set(key, 'value');

      await service.expire(key, 10);
      const ttl = await service.ttl(key);

      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(10);
    });
  });

  describe('Exists Operation', () => {
    it('harus return true jika key exists', async () => {
      const key = 'test:exists';
      await service.set(key, 'value');

      const exists = await service.exists(key);
      expect(exists).toBe(true);
    });

    it('harus return false jika key tidak exists', async () => {
      const exists = await service.exists('test:nonexistent');
      expect(exists).toBe(false);
    });
  });

  describe('Increment Operation', () => {
    it('harus increment value', async () => {
      const key = 'test:counter';

      const result1 = await service.incr(key);
      const result2 = await service.incr(key);
      const result3 = await service.incr(key);

      expect(result1).toBe(1);
      expect(result2).toBe(2);
      expect(result3).toBe(3);
    });
  });

  describe('Multiple Keys Operations', () => {
    it('harus get multiple keys', async () => {
      await service.set('test:multi1', 'value1');
      await service.set('test:multi2', 'value2');
      await service.set('test:multi3', 'value3');

      const results = await service.mget('test:multi1', 'test:multi2', 'test:multi3');

      expect(results).toEqual(['value1', 'value2', 'value3']);
    });

    it('harus delete multiple keys', async () => {
      await service.set('test:mdel1', 'value1');
      await service.set('test:mdel2', 'value2');

      await service.mdel('test:mdel1', 'test:mdel2');

      const result1 = await service.get('test:mdel1');
      const result2 = await service.get('test:mdel2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('Pattern Matching', () => {
    it('harus get keys by pattern', async () => {
      await service.set('test:pattern:1', 'value1');
      await service.set('test:pattern:2', 'value2');
      await service.set('test:other', 'value3');

      const keys = await service.keys('test:pattern:*');

      expect(keys).toHaveLength(2);
      expect(keys).toContain('test:pattern:1');
      expect(keys).toContain('test:pattern:2');
      expect(keys).not.toContain('test:other');
    });
  });

  describe('Rate Limiting Use Case', () => {
    it('harus support rate limiting pattern', async () => {
      const key = 'test:ratelimit:phone:+6281234567890';
      const ttl = 900; // 15 minutes

      // First request
      const count1 = await service.incr(key);
      await service.expire(key, ttl);
      expect(count1).toBe(1);

      // Second request
      const count2 = await service.incr(key);
      expect(count2).toBe(2);

      // Third request
      const count3 = await service.incr(key);
      expect(count3).toBe(3);

      // Check TTL masih ada
      const remainingTtl = await service.ttl(key);
      expect(remainingTtl).toBeGreaterThan(0);
    });
  });

  describe('OTP Storage Use Case', () => {
    it('harus support OTP storage pattern', async () => {
      const phoneNumber = '+6281234567890';
      const key = `otp:${phoneNumber}`;
      const hashedOtp = 'hashed-otp-value';
      const ttl = 300; // 5 minutes

      // Store OTP
      await service.setex(key, ttl, hashedOtp);

      // Verify OTP exists
      const exists = await service.exists(key);
      expect(exists).toBe(true);

      // Get OTP
      const storedOtp = await service.get(key);
      expect(storedOtp).toBe(hashedOtp);

      // Check TTL
      const remainingTtl = await service.ttl(key);
      expect(remainingTtl).toBeGreaterThan(0);
      expect(remainingTtl).toBeLessThanOrEqual(ttl);

      // Invalidate OTP
      await service.del(key);
      const afterDelete = await service.exists(key);
      expect(afterDelete).toBe(false);
    });
  });

  describe('Refresh Token Storage Use Case', () => {
    it('harus support refresh token storage pattern', async () => {
      const userId = 'user-123';
      const tokenId = 'token-456';
      const key = `refresh:${userId}:${tokenId}`;
      const tokenData = JSON.stringify({
        userId,
        token: 'refresh-token-value',
        createdAt: Date.now(),
      });
      const ttl = 604800; // 7 days

      // Store refresh token
      await service.setex(key, ttl, tokenData);

      // Get refresh token
      const stored = await service.get(key);
      expect(stored).toBe(tokenData);

      // Invalidate all tokens for user
      const userTokens = await service.keys(`refresh:${userId}:*`);
      expect(userTokens).toContain(key);

      await service.mdel(...userTokens);
      const afterDelete = await service.exists(key);
      expect(afterDelete).toBe(false);
    });
  });
});
