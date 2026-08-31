import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                REDIS_PASSWORD: '',
                REDIS_DB: 0,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('harus terdefinisi', () => {
    expect(service).toBeDefined();
  });

  describe('isHealthy', () => {
    it('harus return false jika client tidak connected', async () => {
      const result = await service.isHealthy();
      expect(result).toBe(false);
    });
  });

  describe('set dan get', () => {
    it('harus throw error jika client tidak connected', async () => {
      await expect(service.set('test-key', 'test-value')).rejects.toThrow(
        'Redis client not connected',
      );
    });

    it('harus throw error saat get jika client tidak connected', async () => {
      await expect(service.get('test-key')).rejects.toThrow('Redis client not connected');
    });
  });

  describe('del', () => {
    it('harus throw error jika client tidak connected', async () => {
      await expect(service.del('test-key')).rejects.toThrow('Redis client not connected');
    });
  });

  describe('setex', () => {
    it('harus throw error jika client tidak connected', async () => {
      await expect(service.setex('test-key', 60, 'test-value')).rejects.toThrow(
        'Redis client not connected',
      );
    });
  });

  describe('exists', () => {
    it('harus throw error jika client tidak connected', async () => {
      await expect(service.exists('test-key')).rejects.toThrow('Redis client not connected');
    });
  });

  describe('ttl', () => {
    it('harus throw error jika client tidak connected', async () => {
      await expect(service.ttl('test-key')).rejects.toThrow('Redis client not connected');
    });
  });

  describe('incr', () => {
    it('harus throw error jika client tidak connected', async () => {
      await expect(service.incr('test-key')).rejects.toThrow('Redis client not connected');
    });
  });

  describe('expire', () => {
    it('harus throw error jika client tidak connected', async () => {
      await expect(service.expire('test-key', 60)).rejects.toThrow('Redis client not connected');
    });
  });

  describe('mget', () => {
    it('harus throw error jika client tidak connected', async () => {
      await expect(service.mget('key1', 'key2')).rejects.toThrow('Redis client not connected');
    });
  });

  describe('mdel', () => {
    it('harus throw error jika client tidak connected', async () => {
      await expect(service.mdel('key1', 'key2')).rejects.toThrow('Redis client not connected');
    });
  });

  describe('keys', () => {
    it('harus throw error jika client tidak connected', async () => {
      await expect(service.keys('test-*')).rejects.toThrow('Redis client not connected');
    });
  });
});
