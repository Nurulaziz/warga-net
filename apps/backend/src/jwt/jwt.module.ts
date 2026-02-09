import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { JwtService } from './jwt.service';

@Module({
  imports: [
    ConfigModule,
    NestJwtModule.register({
      // Default config, actual signing happens in service with RSA keys
      signOptions: {
        algorithm: 'RS256',
      },
    }),
  ],
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
