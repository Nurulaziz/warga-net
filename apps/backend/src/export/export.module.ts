import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { UsersModule } from '../users/users.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [UsersModule, SettingsModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
