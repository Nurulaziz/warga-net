import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: RedisClientType;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  // Setup connection dengan pooling
  private async connect(): Promise<void> {
    try {
      const host = this.configService.get<string>('REDIS_HOST', 'localhost');
      const port = this.configService.get<number>('REDIS_PORT', 6379);
      const password = this.configService.get<string>('REDIS_PASSWORD');
      const db = this.configService.get<number>('REDIS_DB', 0);

      this.client = createClient({
        socket: {
          host,
          port,
          reconnectStrategy: (retries) => {
            // Exponential backoff untuk reconnection
            if (retries > 10) {
              this.logger.error('Redis reconnection limit exceeded');
              return new Error('Redis reconnection limit exceeded');
            }
            const delay = Math.min(retries * 100, 3000);
            this.logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
          },
        },
        password: password || undefined,
        database: db,
      });

      // Event handlers untuk connection monitoring
      this.client.on('connect', () => {
        this.logger.log('Redis client connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.logger.log('Redis client connected and ready');
      });

      this.client.on('error', (error) => {
        this.logger.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.logger.warn('Redis client reconnecting...');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        this.logger.warn('Redis client connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
      this.logger.log('Redis connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.logger.log('Redis connection closed gracefully');
      }
    } catch (error) {
      this.logger.error('Error closing Redis connection:', error);
    }
  }

  // Health check untuk Redis connectivity
  async isHealthy(): Promise<boolean> {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      await this.client.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Set key-value dengan optional TTL
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error);
      throw error;
    }
  }

  // Get value by key
  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      throw error;
    }
  }

  // Delete key
  async del(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}:`, error);
      throw error;
    }
  }

  // Set key-value dengan TTL (alias untuk set dengan ttl)
  async setex(key: string, ttl: number, value: string): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      await this.client.setEx(key, ttl, value);
    } catch (error) {
      this.logger.error(`Failed to setex key ${key}:`, error);
      throw error;
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key ${key}:`, error);
      throw error;
    }
  }

  // Get TTL untuk key
  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key ${key}:`, error);
      throw error;
    }
  }

  // Increment value (untuk rate limiting)
  async incr(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Failed to increment key ${key}:`, error);
      throw error;
    }
  }

  // Expire key dengan TTL
  async expire(key: string, ttl: number): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      await this.client.expire(key, ttl);
    } catch (error) {
      this.logger.error(`Failed to set expiry for key ${key}:`, error);
      throw error;
    }
  }

  // Get multiple keys
  async mget(...keys: string[]): Promise<(string | null)[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      return await this.client.mGet(keys);
    } catch (error) {
      this.logger.error(`Failed to get multiple keys:`, error);
      throw error;
    }
  }

  // Delete multiple keys
  async mdel(...keys: string[]): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      await this.client.del(keys);
    } catch (error) {
      this.logger.error(`Failed to delete multiple keys:`, error);
      throw error;
    }
  }

  // Get keys by pattern
  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Failed to get keys by pattern ${pattern}:`, error);
      throw error;
    }
  }
}
