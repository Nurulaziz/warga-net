import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(private readonly redisService: RedisService) {}

  // Basic health check
  async check() {
    const redisHealthy = await this.redisService.isHealthy();

    if (!redisHealthy) {
      throw new ServiceUnavailableException('Service unavailable');
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  // Detailed health check dengan dependency status
  async detailedCheck() {
    const redisHealthy = await this.redisService.isHealthy();

    const dependencies = {
      redis: {
        status: redisHealthy ? 'healthy' : 'unhealthy',
        message: redisHealthy ? 'Connected' : 'Connection failed',
      },
    };

    const allHealthy = redisHealthy;

    if (!allHealthy) {
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        dependencies,
      });
    }

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      dependencies,
    };
  }
}
