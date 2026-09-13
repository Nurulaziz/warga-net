import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { getClientIp } from '../common/client-ip.util';
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
    const ipAddress = getClientIp(request);

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

}
