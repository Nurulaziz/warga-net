import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpLength: number;
  private readonly otpTtl: number;
  private readonly saltRounds: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.otpLength = parseInt(this.configService.get<string>('OTP_LENGTH', '6'), 10);
    this.otpTtl = parseInt(this.configService.get<string>('OTP_TTL_SECONDS', '300'), 10);
    this.saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'), 10);
  }

  // Generate 6-digit numeric OTP
  generateOtp(): string {
    const min = Math.pow(10, this.otpLength - 1);
    const max = Math.pow(10, this.otpLength) - 1;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    return otp.toString();
  }

  // Hash OTP menggunakan bcrypt
  async hashOtp(otp: string): Promise<string> {
    try {
      return await bcrypt.hash(otp, this.saltRounds);
    } catch (error) {
      this.logger.error('Failed to hash OTP:', error);
      throw error;
    }
  }

  // Verify OTP hash
  async verifyOtp(otp: string, hashedOtp: string): Promise<boolean> {
    try {
      return await bcrypt.compare(otp, hashedOtp);
    } catch (error) {
      this.logger.error('Failed to verify OTP:', error);
      throw error;
    }
  }

  // Store OTP di Redis dengan TTL dan attempt counter
  async storeOtp(phoneNumber: string, hashedOtp: string): Promise<void> {
    try {
      const key = this.getOtpKey(phoneNumber);
      const attemptsKey = this.getOtpAttemptsKey(phoneNumber);

      // Store hashed OTP dengan TTL
      await this.redisService.setex(key, this.otpTtl, hashedOtp);

      // Initialize attempts counter dengan TTL yang sama
      await this.redisService.setex(attemptsKey, this.otpTtl, '0');

      this.logger.log(`OTP stored for ${phoneNumber} with TTL ${this.otpTtl}s`);
    } catch (error) {
      this.logger.error(`Failed to store OTP for ${phoneNumber}:`, error);
      throw error;
    }
  }

  // Get OTP dari Redis
  async getOtp(phoneNumber: string): Promise<string | null> {
    try {
      const key = this.getOtpKey(phoneNumber);
      return await this.redisService.get(key);
    } catch (error) {
      this.logger.error(`Failed to get OTP for ${phoneNumber}:`, error);
      throw error;
    }
  }

  // Get OTP attempts dari Redis
  async getOtpAttempts(phoneNumber: string): Promise<number> {
    try {
      const key = this.getOtpAttemptsKey(phoneNumber);
      const attempts = await this.redisService.get(key);
      return attempts ? parseInt(attempts, 10) : 0;
    } catch (error) {
      this.logger.error(`Failed to get OTP attempts for ${phoneNumber}:`, error);
      throw error;
    }
  }

  // Invalidate OTP (mark as used)
  async invalidateOtp(phoneNumber: string): Promise<void> {
    try {
      const key = this.getOtpKey(phoneNumber);
      const attemptsKey = this.getOtpAttemptsKey(phoneNumber);

      await this.redisService.del(key);
      await this.redisService.del(attemptsKey);

      this.logger.log(`OTP invalidated for ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate OTP for ${phoneNumber}:`, error);
      throw error;
    }
  }

  // Increment OTP attempts untuk tracking failed verifications
  async incrementOtpAttempts(phoneNumber: string): Promise<number> {
    try {
      const key = this.getOtpAttemptsKey(phoneNumber);
      const newCount = await this.redisService.incr(key);

      this.logger.log(`OTP attempts for ${phoneNumber}: ${newCount}`);
      return newCount;
    } catch (error) {
      this.logger.error(`Failed to increment OTP attempts for ${phoneNumber}:`, error);
      throw error;
    }
  }

  // Check if OTP exists
  async otpExists(phoneNumber: string): Promise<boolean> {
    try {
      const key = this.getOtpKey(phoneNumber);
      return await this.redisService.exists(key);
    } catch (error) {
      this.logger.error(`Failed to check OTP existence for ${phoneNumber}:`, error);
      throw error;
    }
  }

  // Get remaining TTL untuk OTP
  async getOtpTtl(phoneNumber: string): Promise<number> {
    try {
      const key = this.getOtpKey(phoneNumber);
      return await this.redisService.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get OTP TTL for ${phoneNumber}:`, error);
      throw error;
    }
  }

  // Helper: Generate Redis key untuk OTP
  private getOtpKey(phoneNumber: string): string {
    return `otp:${phoneNumber}`;
  }

  // Helper: Generate Redis key untuk OTP attempts
  private getOtpAttemptsKey(phoneNumber: string): string {
    return `otp:attempts:${phoneNumber}`;
  }
}
