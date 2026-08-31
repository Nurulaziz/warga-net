import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { OtpModule } from './otp/otp.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { JwtModule } from './jwt/jwt.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { UsersModule } from './users/users.module';
import { FamiliesModule } from './families/families.module';
import { ResidentsModule } from './residents/residents.module';
import { RolesModule } from './roles/roles.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuditLogInterceptor } from './audit-log/audit-log.interceptor';
import { BillsModule } from './bills/bills.module';
import { CashModule } from './cash/cash.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { SuaraWargaModule } from './suara-warga/suara-warga.module';
import { LettersModule } from './letters/letters.module';
import { SettingsModule } from './settings/settings.module';
import { ExportModule } from './export/export.module';
import { auth } from './auth/auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 detik
        // Max 30 request/detik. Dinaikkan dari 10 karena dashboard admin
        // mengirimkan ledakan ~10-15 request paralel saat mount (Metrik +
        // chart + antrean approval + log + pengumuman). OTP/verifikasi punya
        // rate-limit terpisah di RateLimitGuard (per-phone & per-IP).
        limit: 30,
      },
      {
        name: 'medium',
        ttl: 60000, // 1 menit
        limit: 100, // max 100 request per menit
      },
    ]),
    AuthModule.forRoot({ auth }),
    PrismaModule,
    RedisModule,
    HealthModule,
    OtpModule,
    WhatsAppModule,
    JwtModule,
    RateLimitModule,
    UsersModule,
    FamiliesModule,
    ResidentsModule,
    RolesModule,
    AuditLogModule,
    BillsModule,
    CashModule,
    AnnouncementsModule,
    SuaraWargaModule,
    LettersModule,
    SettingsModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
