import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';

describe('OtpService', () => {
  let service: OtpService;
  let redisService: RedisService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: RedisService,
          useValue: {
            setex: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            incr: jest.fn(),
            exists: jest.fn(),
            ttl: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                OTP_LENGTH: 6,
                OTP_TTL_SECONDS: 300,
                BCRYPT_SALT_ROUNDS: 10,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('harus terdefinisi', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('harus generate OTP 6 digit', () => {
      const otp = service.generateOtp();
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('harus generate OTP numeric', () => {
      const otp = service.generateOtp();
      expect(Number.isInteger(parseInt(otp, 10))).toBe(true);
    });

    it('harus generate OTP berbeda setiap kali', () => {
      const otp1 = service.generateOtp();
      const otp2 = service.generateOtp();
      const otp3 = service.generateOtp();

      // Sangat kecil kemungkinan 3 OTP sama
      const allSame = otp1 === otp2 && otp2 === otp3;
      expect(allSame).toBe(false);
    });
  });

  describe('hashOtp', () => {
    it('harus hash OTP menggunakan bcrypt', async () => {
      const otp = '123456';
      const hashed = await service.hashOtp(otp);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(otp);
      expect(hashed.startsWith('$2b$')).toBe(true); // bcrypt hash format
    });

    it('harus generate hash berbeda untuk OTP yang sama', async () => {
      const otp = '123456';
      const hash1 = await service.hashOtp(otp);
      const hash2 = await service.hashOtp(otp);

      expect(hash1).not.toBe(hash2); // bcrypt uses random salt
    });
  });

  describe('verifyOtp', () => {
    it('harus return true untuk OTP yang valid', async () => {
      const otp = '123456';
      const hashed = await bcrypt.hash(otp, 10);

      const result = await service.verifyOtp(otp, hashed);
      expect(result).toBe(true);
    });

    it('harus return false untuk OTP yang invalid', async () => {
      const otp = '123456';
      const wrongOtp = '654321';
      const hashed = await bcrypt.hash(otp, 10);

      const result = await service.verifyOtp(wrongOtp, hashed);
      expect(result).toBe(false);
    });
  });

  describe('storeOtp', () => {
    it('harus store OTP di Redis dengan TTL', async () => {
      const phoneNumber = '+6281234567890';
      const hashedOtp = 'hashed-otp';

      await service.storeOtp(phoneNumber, hashedOtp);

      expect(redisService.setex).toHaveBeenCalledWith(`otp:${phoneNumber}`, 300, hashedOtp);
      expect(redisService.setex).toHaveBeenCalledWith(`otp:attempts:${phoneNumber}`, 300, '0');
    });
  });

  describe('getOtp', () => {
    it('harus get OTP dari Redis', async () => {
      const phoneNumber = '+6281234567890';
      const hashedOtp = 'hashed-otp';

      jest.spyOn(redisService, 'get').mockResolvedValue(hashedOtp);

      const result = await service.getOtp(phoneNumber);

      expect(result).toBe(hashedOtp);
      expect(redisService.get).toHaveBeenCalledWith(`otp:${phoneNumber}`);
    });

    it('harus return null jika OTP tidak ada', async () => {
      const phoneNumber = '+6281234567890';

      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      const result = await service.getOtp(phoneNumber);

      expect(result).toBeNull();
    });
  });

  describe('getOtpAttempts', () => {
    it('harus return jumlah attempts', async () => {
      const phoneNumber = '+6281234567890';

      jest.spyOn(redisService, 'get').mockResolvedValue('3');

      const result = await service.getOtpAttempts(phoneNumber);

      expect(result).toBe(3);
      expect(redisService.get).toHaveBeenCalledWith(`otp:attempts:${phoneNumber}`);
    });

    it('harus return 0 jika attempts tidak ada', async () => {
      const phoneNumber = '+6281234567890';

      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      const result = await service.getOtpAttempts(phoneNumber);

      expect(result).toBe(0);
    });
  });

  describe('invalidateOtp', () => {
    it('harus delete OTP dan attempts dari Redis', async () => {
      const phoneNumber = '+6281234567890';

      await service.invalidateOtp(phoneNumber);

      expect(redisService.del).toHaveBeenCalledWith(`otp:${phoneNumber}`);
      expect(redisService.del).toHaveBeenCalledWith(`otp:attempts:${phoneNumber}`);
    });
  });

  describe('incrementOtpAttempts', () => {
    it('harus increment attempts counter', async () => {
      const phoneNumber = '+6281234567890';

      jest.spyOn(redisService, 'incr').mockResolvedValue(1);

      const result = await service.incrementOtpAttempts(phoneNumber);

      expect(result).toBe(1);
      expect(redisService.incr).toHaveBeenCalledWith(`otp:attempts:${phoneNumber}`);
    });
  });

  describe('otpExists', () => {
    it('harus return true jika OTP exists', async () => {
      const phoneNumber = '+6281234567890';

      jest.spyOn(redisService, 'exists').mockResolvedValue(true);

      const result = await service.otpExists(phoneNumber);

      expect(result).toBe(true);
      expect(redisService.exists).toHaveBeenCalledWith(`otp:${phoneNumber}`);
    });

    it('harus return false jika OTP tidak exists', async () => {
      const phoneNumber = '+6281234567890';

      jest.spyOn(redisService, 'exists').mockResolvedValue(false);

      const result = await service.otpExists(phoneNumber);

      expect(result).toBe(false);
    });
  });

  describe('getOtpTtl', () => {
    it('harus return remaining TTL', async () => {
      const phoneNumber = '+6281234567890';

      jest.spyOn(redisService, 'ttl').mockResolvedValue(250);

      const result = await service.getOtpTtl(phoneNumber);

      expect(result).toBe(250);
      expect(redisService.ttl).toHaveBeenCalledWith(`otp:${phoneNumber}`);
    });
  });
});
