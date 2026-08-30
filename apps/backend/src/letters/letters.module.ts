import { Module } from '@nestjs/common';
import { LettersController } from './letters.controller';
import { LettersService } from './letters.service';
import { SettingsModule } from '../settings/settings.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [SettingsModule, UsersModule],
  controllers: [LettersController],
  providers: [LettersService],
  exports: [LettersService],
})
export class LettersModule {}
