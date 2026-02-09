import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis';

// Rate limit constants
const OTP_PHONE_LIMIT = 3; // 3 requests per 15 minutes per phone
const OTP_PHONE_WINDOW = 15 * 60; // 15 minutes in seconds
const OTP_IP_LIMIT = 10; // 10 requests per 15 minutes per IP
const OTP_IP_WINDOW = 15 * 60; // 15 minutes in seconds
const OTP_VERIFICATION_LIMIT = 5; // 5 attempts per OTP
const IP_BLOCK_DURATION = 60 * 60; // 1 hour in seconds

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisService) {}

  // Check OTP rate limit by phone number
  async checkOtpRateLimitByPhone(phoneNumber: string): Promise<RateLimitResult> {
    const key = `rate_limit:otp:phone:${phoneNumber}`;
    const count = await this.redis.get(key);
    const current = count ? parseInt(count, 10) : 0;

    if (current >= OTP_PHONE_LIMIT) {
      const ttl = await this.redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + ttl * 1000),
      };
    }

    return {
      allowed: true,
      remaining: OTP_PHONE_LIMIT - current - 1,
      resetAt: new Date(Date.now() + OTP_PHONE_WINDOW * 1000),
    };
  }

  // Check OTP rate limit by IP address
  async checkOtpRateLimitByIp(ipAddress: string): Promise<RateLimitResult> {
    // Check if IP is blocked
    const blocked = await this.isIpBlocked(ipAddress);
    if (blocked) {
      const blockKey = `rate_limit:ip:blocked:${ipAddress}`;
      const ttl = await this.redis.ttl(blockKey);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + ttl * 1000),
      };
    }

    const key = `rate_limit:otp:ip:${ipAddress}`;
    const count = await this.redis.get(key);
    const current = count ? parseInt(count, 10) : 0;

    if (current >= OTP_IP_LIMIT) {
      const ttl = await this.redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + ttl * 1000),
      };
    }

    return {
      allowed: true,
      remaining: OTP_IP_LIMIT - current - 1,
      resetAt: new Date(Date.now() + OTP_IP_WINDOW * 1000),
    };
  }

  // Check OTP verification attempt limit
  async checkOtpVerificationLimit(phoneNumber: string): Promise<RateLimitResult> {
    const key = `rate_limit:otp:verify:${phoneNumber}`;
    const count = await this.redis.get(key);
    const current = count ? parseInt(count, 10) : 0;

    if (current >= OTP_VERIFICATION_LIMIT) {
      const ttl = await this.redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + ttl * 1000),
      };
    }

    return {
      allowed: true,
      remaining: OTP_VERIFICATION_LIMIT - current - 1,
      resetAt: new Date(Date.now() + 300 * 1000), // OTP TTL is 5 minutes
    };
  }

  // Increment rate limit counter
  async incrementRateLimit(
    type: 'phone' | 'ip' | 'verify',
    identifier: string,
  ): Promise<number> {
    let key: string;
    let ttl: number;

    switch (type) {
      case 'phone':
        key = `rate_limit:otp:phone:${identifier}`;
        ttl = OTP_PHONE_WINDOW;
        break;
      case 'ip':
        key = `rate_limit:otp:ip:${identifier}`;
        ttl = OTP_IP_WINDOW;
        break;
      case 'verify':
        key = `rate_limit:otp:verify:${identifier}`;
        ttl = 300; // 5 minutes (OTP TTL)
        break;
    }

    const count = await this.redis.incr(key);

    // Set TTL only on first increment
    if (count === 1) {
      await this.redis.expire(key, ttl);
    }

    return count;
  }

  // Block IP address temporarily
  async blockIp(ipAddress: string): Promise<void> {
    const key = `rate_limit:ip:blocked:${ipAddress}`;
    await this.redis.setex(key, IP_BLOCK_DURATION, '1');
  }

  // Check if IP is blocked
  async isIpBlocked(ipAddress: string): Promise<boolean> {
    const key = `rate_limit:ip:blocked:${ipAddress}`;
    const blocked = await this.redis.get(key);
    return blocked === '1';
  }

  // Calculate exponential backoff for repeated failures
  calculateBackoff(attemptCount: number): number {
    // Exponential backoff: 2^attemptCount seconds, max 1 hour
    const backoffSeconds = Math.min(Math.pow(2, attemptCount), 3600);
    return backoffSeconds;
  }
}
