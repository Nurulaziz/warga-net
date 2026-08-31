import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let rateLimitService: jest.Mocked<RateLimitService>;

  beforeEach(async () => {
    const mockRateLimitService = {
      checkOtpRateLimitByPhone: jest.fn(),
      checkOtpRateLimitByIp: jest.fn(),
      incrementRateLimit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    rateLimitService = module.get(RateLimitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (
    body: any,
    ip: string = '192.168.1.1',
    headers: any = {},
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          body,
          ip,
          headers,
        }),
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('harus throw error jika phone number tidak ada', async () => {
      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        new HttpException('Phone number is required', HttpStatus.BAD_REQUEST),
      );
    });

    it('harus allow request jika rate limit belum exceeded', async () => {
      const context = createMockExecutionContext({
        phoneNumber: '+628123456789',
      });

      rateLimitService.checkOtpRateLimitByPhone.mockResolvedValue({
        allowed: true,
        remaining: 2,
        resetAt: new Date(),
      });

      rateLimitService.checkOtpRateLimitByIp.mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetAt: new Date(),
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rateLimitService.checkOtpRateLimitByPhone).toHaveBeenCalledWith('+628123456789');
      expect(rateLimitService.checkOtpRateLimitByIp).toHaveBeenCalledWith('192.168.1.1');
      expect(rateLimitService.incrementRateLimit).toHaveBeenCalledWith('phone', '+628123456789');
      expect(rateLimitService.incrementRateLimit).toHaveBeenCalledWith('ip', '192.168.1.1');
    });

    it('harus throw 429 jika phone rate limit exceeded', async () => {
      const resetAt = new Date();
      const context = createMockExecutionContext({
        phoneNumber: '+628123456789',
      });

      rateLimitService.checkOtpRateLimitByPhone.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt,
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Terlalu banyak permintaan OTP. Coba lagi nanti.',
            resetAt,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      expect(rateLimitService.incrementRateLimit).not.toHaveBeenCalled();
    });

    it('harus throw 429 jika IP rate limit exceeded', async () => {
      const resetAt = new Date();
      const context = createMockExecutionContext({
        phoneNumber: '+628123456789',
      });

      rateLimitService.checkOtpRateLimitByPhone.mockResolvedValue({
        allowed: true,
        remaining: 2,
        resetAt: new Date(),
      });

      rateLimitService.checkOtpRateLimitByIp.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt,
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Terlalu banyak permintaan dari IP ini. Coba lagi nanti.',
            resetAt,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      expect(rateLimitService.incrementRateLimit).not.toHaveBeenCalled();
    });

    it('harus extract phone dari body.phone', async () => {
      const context = createMockExecutionContext({
        phone: '+628123456789',
      });

      rateLimitService.checkOtpRateLimitByPhone.mockResolvedValue({
        allowed: true,
        remaining: 2,
        resetAt: new Date(),
      });

      rateLimitService.checkOtpRateLimitByIp.mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetAt: new Date(),
      });

      await guard.canActivate(context);

      expect(rateLimitService.checkOtpRateLimitByPhone).toHaveBeenCalledWith('+628123456789');
    });

    it('harus extract IP dari X-Forwarded-For header', async () => {
      const context = createMockExecutionContext({ phoneNumber: '+628123456789' }, '127.0.0.1', {
        'x-forwarded-for': '203.0.113.1, 198.51.100.1',
      });

      rateLimitService.checkOtpRateLimitByPhone.mockResolvedValue({
        allowed: true,
        remaining: 2,
        resetAt: new Date(),
      });

      rateLimitService.checkOtpRateLimitByIp.mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetAt: new Date(),
      });

      await guard.canActivate(context);

      expect(rateLimitService.checkOtpRateLimitByIp).toHaveBeenCalledWith('203.0.113.1');
    });

    it('harus extract IP dari X-Real-IP header', async () => {
      const context = createMockExecutionContext({ phoneNumber: '+628123456789' }, '127.0.0.1', {
        'x-real-ip': '203.0.113.1',
      });

      rateLimitService.checkOtpRateLimitByPhone.mockResolvedValue({
        allowed: true,
        remaining: 2,
        resetAt: new Date(),
      });

      rateLimitService.checkOtpRateLimitByIp.mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetAt: new Date(),
      });

      await guard.canActivate(context);

      expect(rateLimitService.checkOtpRateLimitByIp).toHaveBeenCalledWith('203.0.113.1');
    });

    it('harus fallback ke request.ip jika tidak ada headers', async () => {
      const context = createMockExecutionContext({ phoneNumber: '+628123456789' }, '192.168.1.100');

      rateLimitService.checkOtpRateLimitByPhone.mockResolvedValue({
        allowed: true,
        remaining: 2,
        resetAt: new Date(),
      });

      rateLimitService.checkOtpRateLimitByIp.mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetAt: new Date(),
      });

      await guard.canActivate(context);

      expect(rateLimitService.checkOtpRateLimitByIp).toHaveBeenCalledWith('192.168.1.100');
    });
  });
});
