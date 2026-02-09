import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';
import { RedisService } from '../redis/redis.service';

export interface JwtPayload {
  userId: string;
  phoneNumber: string;
  role: string;
  permissions: PermissionMatrix;
  iat?: number;
  exp?: number;
}

export interface PermissionMatrix {
  [feature: string]: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private readonly refreshTokenTtl: number; // in seconds

  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    // Load RSA keys
    const privateKeyPath = this.configService.get<string>(
      'JWT_PRIVATE_KEY_PATH',
      './keys/private.pem',
    );
    const publicKeyPath = this.configService.get<string>(
      'JWT_PUBLIC_KEY_PATH',
      './keys/public.pem',
    );

    this.privateKey = fs.readFileSync(path.resolve(privateKeyPath), 'utf8');
    this.publicKey = fs.readFileSync(path.resolve(publicKeyPath), 'utf8');

    this.accessTokenExpiry = this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY', '15m');
    this.refreshTokenExpiry = this.configService.get<string>(
      'JWT_REFRESH_TOKEN_EXPIRY',
      '30d',
    );

    // Convert refresh token expiry to seconds for Redis TTL
    this.refreshTokenTtl = this.parseExpiryToSeconds(this.refreshTokenExpiry);

    this.logger.log('JWT Service initialized with RS256 algorithm');
  }

  // Generate access token dengan expiry 15 menit
  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    try {
      return this.nestJwtService.sign(payload, {
        privateKey: this.privateKey,
        algorithm: 'RS256',
        expiresIn: this.accessTokenExpiry,
      });
    } catch (error) {
      this.logger.error('Failed to generate access token:', error);
      throw error;
    }
  }

  // Generate refresh token dengan expiry 30 hari
  generateRefreshToken(userId: string): string {
    try {
      const payload = {
        userId,
        type: 'refresh',
      };

      return this.nestJwtService.sign(payload, {
        privateKey: this.privateKey,
        algorithm: 'RS256',
        expiresIn: this.refreshTokenExpiry,
      });
    } catch (error) {
      this.logger.error('Failed to generate refresh token:', error);
      throw error;
    }
  }

  // Verify dan decode token
  verifyToken(token: string): JwtPayload {
    try {
      return this.nestJwtService.verify(token, {
        publicKey: this.publicKey,
        algorithms: ['RS256'],
      });
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // Store refresh token di Redis dengan user ID mapping
  async storeRefreshToken(userId: string, token: string): Promise<void> {
    try {
      const tokenId = this.extractTokenId(token);
      const key = this.getRefreshTokenKey(userId, tokenId);

      const tokenData = JSON.stringify({
        userId,
        token,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.refreshTokenTtl * 1000,
      });

      await this.redisService.setex(key, this.refreshTokenTtl, tokenData);

      this.logger.log(`Refresh token stored for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to store refresh token for user ${userId}:`, error);
      throw error;
    }
  }

  // Invalidate single refresh token
  async invalidateRefreshToken(token: string): Promise<void> {
    try {
      const payload = this.verifyToken(token);
      const tokenId = this.extractTokenId(token);
      const key = this.getRefreshTokenKey(payload.userId, tokenId);

      await this.redisService.del(key);

      this.logger.log(`Refresh token invalidated for user ${payload.userId}`);
    } catch (error) {
      this.logger.error('Failed to invalidate refresh token:', error);
      throw error;
    }
  }

  // Invalidate all refresh tokens untuk user (logout all devices)
  async invalidateAllRefreshTokens(userId: string): Promise<void> {
    try {
      const pattern = `refresh:${userId}:*`;
      const keys = await this.redisService.keys(pattern);

      if (keys.length > 0) {
        await this.redisService.mdel(...keys);
        this.logger.log(`All refresh tokens invalidated for user ${userId} (${keys.length} tokens)`);
      } else {
        this.logger.log(`No refresh tokens found for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate all refresh tokens for user ${userId}:`, error);
      throw error;
    }
  }

  // Check if refresh token exists in Redis
  async refreshTokenExists(userId: string, token: string): Promise<boolean> {
    try {
      const tokenId = this.extractTokenId(token);
      const key = this.getRefreshTokenKey(userId, tokenId);

      return await this.redisService.exists(key);
    } catch (error) {
      this.logger.error('Failed to check refresh token existence:', error);
      return false;
    }
  }

  // Generate both access and refresh tokens
  async generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload.userId);

    // Store refresh token
    await this.storeRefreshToken(payload.userId, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiryToSeconds(this.accessTokenExpiry),
    };
  }

  // Refresh token rotation: invalidate old, generate new
  async rotateRefreshToken(oldRefreshToken: string): Promise<AuthTokens> {
    try {
      // Verify old token
      const payload = this.verifyToken(oldRefreshToken);

      // Check if it's a refresh token
      if ((payload as any).type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token exists in Redis
      const exists = await this.refreshTokenExists(payload.userId, oldRefreshToken);
      if (!exists) {
        throw new UnauthorizedException('Refresh token not found or already used');
      }

      // Invalidate old token
      await this.invalidateRefreshToken(oldRefreshToken);

      // Generate new token pair
      // Note: We need to fetch full user data including permissions
      // This will be done in AuthService which has access to user data
      throw new Error('Use AuthService.refreshToken() instead - needs full user payload');
    } catch (error) {
      this.logger.error('Failed to rotate refresh token:', error);
      throw error;
    }
  }

  // Helper: Extract token ID from JWT
  private extractTokenId(token: string): string {
    try {
      const payload = this.nestJwtService.decode(token) as any;
      // Use iat (issued at) as token ID for uniqueness
      return payload.iat?.toString() || Date.now().toString();
    } catch (error) {
      return Date.now().toString();
    }
  }

  // Helper: Generate Redis key untuk refresh token
  private getRefreshTokenKey(userId: string, tokenId: string): string {
    return `refresh:${userId}:${tokenId}`;
  }

  // Helper: Parse expiry string to seconds
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        throw new Error(`Invalid expiry unit: ${unit}`);
    }
  }
}
