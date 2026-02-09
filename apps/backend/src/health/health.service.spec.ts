import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';
import { RedisService } from '../redis/redis.service';

describe('HealthService', () => {
  let service: HealthService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: RedisService,
          useValue: {
            isHealthy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('harus terdefinisi', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('harus return ok jika Redis healthy', async () => {
      jest.spyOn(redisService, 'isHealthy').mockResolvedValue(true);

      const result = await service.check();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });

    it('harus throw ServiceUnavailableException jika Redis unhealthy', async () => {
      jest.spyOn(redisService, 'isHealthy').mockResolvedValue(false);

      await expect(service.check()).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('detailedCheck', () => {
    it('harus return detailed status jika semua healthy', async () => {
      jest.spyOn(redisService, 'isHealthy').mockResolvedValue(true);

      const result = await service.detailedCheck();

      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.dependencies.redis.status).toBe('healthy');
      expect(result.dependencies.redis.message).toBe('Connected');
    });

    it('harus throw ServiceUnavailableException dengan detail jika Redis unhealthy', async () => {
      jest.spyOn(redisService, 'isHealthy').mockResolvedValue(false);

      try {
        await service.detailedCheck();
        fail('Should have thrown ServiceUnavailableException');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
        if (error instanceof ServiceUnavailableException) {
          const response = error.getResponse() as any;
          expect(response.status).toBe('unhealthy');
          expect(response.dependencies.redis.status).toBe('unhealthy');
        }
      }
    });
  });
});
