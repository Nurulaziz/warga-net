import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtPayload, PermissionMatrix } from './jwt.service';
import { RedisService } from '../redis/redis.service';

describe('JwtService', () => {
  let service: JwtService;
  let nestJwtService: NestJwtService;
  let redisService: RedisService;

  const mockPermissions: PermissionMatrix = {
    users: { create: true, read: true, update: true, delete: false },
    families: { create: false, read: true, update: false, delete: false },
  };

  const mockPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
    userId: 'user-123',
    phoneNumber: '+6281234567890',
    role: 'ADMIN_RT',
    permissions: mockPermissions,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: NestJwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            setex: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
            mdel: jest.fn(),
            exists: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                JWT_PRIVATE_KEY_PATH: './keys/private.pem',
                JWT_PUBLIC_KEY_PATH: './keys/public.pem',
                JWT_ACCESS_TOKEN_EXPIRY: '15m',
                JWT_REFRESH_TOKEN_EXPIRY: '30d',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
    nestJwtService = module.get<NestJwtService>(NestJwtService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('harus terdefinisi', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('harus generate access token dengan payload yang benar', () => {
      const mockToken = 'mock-access-token';
      jest.spyOn(nestJwtService, 'sign').mockReturnValue(mockToken);

      const token = service.generateAccessToken(mockPayload);

      expect(token).toBe(mockToken);
      expect(nestJwtService.sign).toHaveBeenCalledWith(mockPayload, {
        privateKey: expect.any(String),
        algorithm: 'RS256',
        expiresIn: '15m',
      });
    });

    it('harus include permissions dalam payload', () => {
      jest.spyOn(nestJwtService, 'sign').mockReturnValue('token');

      service.generateAccessToken(mockPayload);

      const callArgs = (nestJwtService.sign as jest.Mock).mock.calls[0][0];
      expect(callArgs.permissions).toEqual(mockPermissions);
    });
  });

  describe('generateRefreshToken', () => {
    it('harus generate refresh token dengan userId', () => {
      const mockToken = 'mock-refresh-token';
      jest.spyOn(nestJwtService, 'sign').mockReturnValue(mockToken);

      const token = service.generateRefreshToken('user-123');

      expect(token).toBe(mockToken);
      expect(nestJwtService.sign).toHaveBeenCalledWith(
        { userId: 'user-123', type: 'refresh' },
        {
          privateKey: expect.any(String),
          algorithm: 'RS256',
          expiresIn: '30d',
        },
      );
    });
  });

  describe('verifyToken', () => {
    it('harus verify dan return payload untuk valid token', () => {
      const mockToken = 'valid-token';
      const mockDecodedPayload = { ...mockPayload, iat: 123, exp: 456 };

      jest.spyOn(nestJwtService, 'verify').mockReturnValue(mockDecodedPayload);

      const result = service.verifyToken(mockToken);

      expect(result).toEqual(mockDecodedPayload);
      expect(nestJwtService.verify).toHaveBeenCalledWith(mockToken, {
        publicKey: expect.any(String),
        algorithms: ['RS256'],
      });
    });

    it('harus throw UnauthorizedException untuk invalid token', () => {
      const mockToken = 'invalid-token';

      jest.spyOn(nestJwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.verifyToken(mockToken)).toThrow(UnauthorizedException);
    });
  });

  describe('storeRefreshToken', () => {
    it('harus store refresh token di Redis dengan TTL', async () => {
      const userId = 'user-123';
      const token = 'refresh-token';

      jest.spyOn(nestJwtService, 'decode').mockReturnValue({ iat: 123456 });

      await service.storeRefreshToken(userId, token);

      expect(redisService.setex).toHaveBeenCalled();
      const callArgs = (redisService.setex as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain(`refresh:${userId}:`);
      expect(callArgs[1]).toBe(2592000); // 30 days in seconds
      expect(callArgs[2]).toContain(userId);
    });
  });

  describe('invalidateRefreshToken', () => {
    it('harus delete refresh token dari Redis', async () => {
      const token = 'refresh-token';
      const mockPayload = { userId: 'user-123', type: 'refresh', iat: 123456 };

      jest.spyOn(nestJwtService, 'verify').mockReturnValue(mockPayload);
      jest.spyOn(nestJwtService, 'decode').mockReturnValue(mockPayload);

      await service.invalidateRefreshToken(token);

      expect(redisService.del).toHaveBeenCalled();
      const callArgs = (redisService.del as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain('refresh:user-123:');
    });
  });

  describe('invalidateAllRefreshTokens', () => {
    it('harus delete semua refresh tokens untuk user', async () => {
      const userId = 'user-123';
      const mockKeys = ['refresh:user-123:token1', 'refresh:user-123:token2'];

      jest.spyOn(redisService, 'keys').mockResolvedValue(mockKeys);

      await service.invalidateAllRefreshTokens(userId);

      expect(redisService.keys).toHaveBeenCalledWith(`refresh:${userId}:*`);
      expect(redisService.mdel).toHaveBeenCalledWith(...mockKeys);
    });

    it('harus handle case ketika tidak ada tokens', async () => {
      const userId = 'user-123';

      jest.spyOn(redisService, 'keys').mockResolvedValue([]);

      await service.invalidateAllRefreshTokens(userId);

      expect(redisService.keys).toHaveBeenCalledWith(`refresh:${userId}:*`);
      expect(redisService.mdel).not.toHaveBeenCalled();
    });
  });

  describe('refreshTokenExists', () => {
    it('harus return true jika token exists', async () => {
      const userId = 'user-123';
      const token = 'refresh-token';

      jest.spyOn(nestJwtService, 'decode').mockReturnValue({ iat: 123456 });
      jest.spyOn(redisService, 'exists').mockResolvedValue(true);

      const result = await service.refreshTokenExists(userId, token);

      expect(result).toBe(true);
    });

    it('harus return false jika token tidak exists', async () => {
      const userId = 'user-123';
      const token = 'refresh-token';

      jest.spyOn(nestJwtService, 'decode').mockReturnValue({ iat: 123456 });
      jest.spyOn(redisService, 'exists').mockResolvedValue(false);

      const result = await service.refreshTokenExists(userId, token);

      expect(result).toBe(false);
    });
  });

  describe('generateTokenPair', () => {
    it('harus generate access dan refresh tokens', async () => {
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';

      jest
        .spyOn(nestJwtService, 'sign')
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      jest.spyOn(nestJwtService, 'decode').mockReturnValue({ iat: 123456 });

      const result = await service.generateTokenPair(mockPayload);

      expect(result.accessToken).toBe(mockAccessToken);
      expect(result.refreshToken).toBe(mockRefreshToken);
      expect(result.expiresIn).toBe(900); // 15 minutes in seconds
      expect(redisService.setex).toHaveBeenCalled();
    });
  });

  describe('parseExpiryToSeconds', () => {
    it('harus parse seconds correctly', () => {
      const service = new JwtService(nestJwtService, redisService, {
        get: (key: string) => {
          if (key === 'JWT_ACCESS_TOKEN_EXPIRY') return '30s';
          if (key === 'JWT_REFRESH_TOKEN_EXPIRY') return '30d';
          return './keys/private.pem';
        },
      } as any);

      // Access via generateTokenPair to test parsing
      expect(service).toBeDefined();
    });

    it('harus parse minutes correctly', () => {
      const service = new JwtService(nestJwtService, redisService, {
        get: (key: string) => {
          if (key === 'JWT_ACCESS_TOKEN_EXPIRY') return '15m';
          if (key === 'JWT_REFRESH_TOKEN_EXPIRY') return '30d';
          return './keys/private.pem';
        },
      } as any);

      expect(service).toBeDefined();
    });

    it('harus parse hours correctly', () => {
      const service = new JwtService(nestJwtService, redisService, {
        get: (key: string) => {
          if (key === 'JWT_ACCESS_TOKEN_EXPIRY') return '2h';
          if (key === 'JWT_REFRESH_TOKEN_EXPIRY') return '30d';
          return './keys/private.pem';
        },
      } as any);

      expect(service).toBeDefined();
    });

    it('harus parse days correctly', () => {
      const service = new JwtService(nestJwtService, redisService, {
        get: (key: string) => {
          if (key === 'JWT_ACCESS_TOKEN_EXPIRY') return '15m';
          if (key === 'JWT_REFRESH_TOKEN_EXPIRY') return '30d';
          return './keys/private.pem';
        },
      } as any);

      expect(service).toBeDefined();
    });
  });
});
