import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { OtpModule } from './otp/otp.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { JwtModule } from './jwt/jwt.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RedisModule,
    HealthModule,
    OtpModule,
    WhatsAppModule,
    JwtModule,
    RateLimitModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
