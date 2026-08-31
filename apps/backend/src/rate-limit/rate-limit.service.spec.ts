import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';
import { RedisService } from '../redis';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkOtpRateLimitByPhone', () => {
    it('harus allow request jika belum ada limit', async () => {
      redisService.get.mockResolvedValue(null);

      const result = await service.checkOtpRateLimitByPhone('+628123456789');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 3 - 0 - 1
      expect(redisService.get).toHaveBeenCalledWith('rate_limit:otp:phone:+628123456789');
    });

    it('harus allow request jika masih dalam limit', async () => {
      redisService.get.mockResolvedValue('1');

      const result = await service.checkOtpRateLimitByPhone('+628123456789');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1); // 3 - 1 - 1
    });

    it('harus block request jika sudah mencapai limit', async () => {
      redisService.get.mockResolvedValue('3');
      redisService.ttl.mockResolvedValue(600); // 10 minutes remaining

      const result = await service.checkOtpRateLimitByPhone('+628123456789');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(redisService.ttl).toHaveBeenCalledWith('rate_limit:otp:phone:+628123456789');
    });
  });

  describe('checkOtpRateLimitByIp', () => {
    it('harus allow request jika IP tidak blocked dan dalam limit', async () => {
      redisService.get.mockResolvedValueOnce(null); // isIpBlocked check
      redisService.get.mockResolvedValueOnce('5'); // rate limit check

      const result = await service.checkOtpRateLimitByIp('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 10 - 5 - 1
    });

    it('harus block request jika IP sudah blocked', async () => {
      redisService.get.mockResolvedValueOnce('1'); // isIpBlocked check
      redisService.ttl.mockResolvedValue(1800); // 30 minutes remaining

      const result = await service.checkOtpRateLimitByIp('192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('harus block request jika sudah mencapai limit', async () => {
      redisService.get.mockResolvedValueOnce(null); // isIpBlocked check
      redisService.get.mockResolvedValueOnce('10'); // rate limit check
      redisService.ttl.mockResolvedValue(300);

      const result = await service.checkOtpRateLimitByIp('192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('checkOtpVerificationLimit', () => {
    it('harus allow verification jika belum ada attempts', async () => {
      redisService.get.mockResolvedValue(null);

      const result = await service.checkOtpVerificationLimit('+628123456789');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 5 - 0 - 1
    });

    it('harus allow verification jika masih dalam limit', async () => {
      redisService.get.mockResolvedValue('2');

      const result = await service.checkOtpVerificationLimit('+628123456789');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 5 - 2 - 1
    });

    it('harus block verification jika sudah mencapai limit', async () => {
      redisService.get.mockResolvedValue('5');
      redisService.ttl.mockResolvedValue(180); // 3 minutes remaining

      const result = await service.checkOtpVerificationLimit('+628123456789');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('incrementRateLimit', () => {
    it('harus increment phone rate limit dan set TTL', async () => {
      redisService.incr.mockResolvedValue(1);

      const count = await service.incrementRateLimit('phone', '+628123456789');

      expect(count).toBe(1);
      expect(redisService.incr).toHaveBeenCalledWith('rate_limit:otp:phone:+628123456789');
      expect(redisService.expire).toHaveBeenCalledWith(
        'rate_limit:otp:phone:+628123456789',
        900, // 15 minutes
      );
    });

    it('harus increment IP rate limit dan set TTL', async () => {
      redisService.incr.mockResolvedValue(1);

      const count = await service.incrementRateLimit('ip', '192.168.1.1');

      expect(count).toBe(1);
      expect(redisService.incr).toHaveBeenCalledWith('rate_limit:otp:ip:192.168.1.1');
      expect(redisService.expire).toHaveBeenCalledWith('rate_limit:otp:ip:192.168.1.1', 900);
    });

    it('harus increment verify rate limit dan set TTL', async () => {
      redisService.incr.mockResolvedValue(1);

      const count = await service.incrementRateLimit('verify', '+628123456789');

      expect(count).toBe(1);
      expect(redisService.incr).toHaveBeenCalledWith('rate_limit:otp:verify:+628123456789');
      expect(redisService.expire).toHaveBeenCalledWith(
        'rate_limit:otp:verify:+628123456789',
        300, // 5 minutes
      );
    });

    it('tidak harus set TTL jika bukan first increment', async () => {
      redisService.incr.mockResolvedValue(2);

      await service.incrementRateLimit('phone', '+628123456789');

      expect(redisService.expire).not.toHaveBeenCalled();
    });
  });

  describe('blockIp', () => {
    it('harus block IP dengan TTL 1 hour', async () => {
      await service.blockIp('192.168.1.1');

      expect(redisService.setex).toHaveBeenCalledWith(
        'rate_limit:ip:blocked:192.168.1.1',
        3600, // 1 hour
        '1',
      );
    });
  });

  describe('isIpBlocked', () => {
    it('harus return true jika IP blocked', async () => {
      redisService.get.mockResolvedValue('1');

      const result = await service.isIpBlocked('192.168.1.1');

      expect(result).toBe(true);
      expect(redisService.get).toHaveBeenCalledWith('rate_limit:ip:blocked:192.168.1.1');
    });

    it('harus return false jika IP tidak blocked', async () => {
      redisService.get.mockResolvedValue(null);

      const result = await service.isIpBlocked('192.168.1.1');

      expect(result).toBe(false);
    });
  });

  describe('calculateBackoff', () => {
    it('harus calculate exponential backoff', () => {
      expect(service.calculateBackoff(0)).toBe(1); // 2^0
      expect(service.calculateBackoff(1)).toBe(2); // 2^1
      expect(service.calculateBackoff(2)).toBe(4); // 2^2
      expect(service.calculateBackoff(3)).toBe(8); // 2^3
      expect(service.calculateBackoff(10)).toBe(1024); // 2^10
    });

    it('harus cap backoff di 1 hour (3600 seconds)', () => {
      expect(service.calculateBackoff(20)).toBe(3600); // Max 1 hour
      expect(service.calculateBackoff(100)).toBe(3600); // Max 1 hour
    });
  });
});
