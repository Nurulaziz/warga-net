import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(private readonly rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract phone number dari request body
    const phoneNumber = request.body?.phoneNumber || request.body?.phone;
    if (!phoneNumber) {
      throw new HttpException('Phone number is required', HttpStatus.BAD_REQUEST);
    }

    // Extract IP address dari request
    const ipAddress = this.getClientIp(request);

    // Check phone rate limit
    const phoneLimit = await this.rateLimitService.checkOtpRateLimitByPhone(phoneNumber);
    if (!phoneLimit.allowed) {
      this.logger.warn(
        `Rate limit exceeded for phone ${phoneNumber}. Reset at ${phoneLimit.resetAt}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Terlalu banyak permintaan OTP. Coba lagi nanti.',
          resetAt: phoneLimit.resetAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check IP rate limit
    const ipLimit = await this.rateLimitService.checkOtpRateLimitByIp(ipAddress);
    if (!ipLimit.allowed) {
      this.logger.warn(`Rate limit exceeded for IP ${ipAddress}. Reset at ${ipLimit.resetAt}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Terlalu banyak permintaan dari IP ini. Coba lagi nanti.',
          resetAt: ipLimit.resetAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment rate limit counters
    await this.rateLimitService.incrementRateLimit('phone', phoneNumber);
    await this.rateLimitService.incrementRateLimit('ip', ipAddress);

    return true;
  }

  // Extract client IP dari request
  private getClientIp(request: Request): string {
    // Check X-Forwarded-For header (untuk proxy/load balancer)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
      return ips.trim();
    }

    // Check X-Real-IP header
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fallback ke request.ip
    return request.ip || 'unknown';
  }
}
