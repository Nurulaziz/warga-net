import { Module } from '@nestjs/common';
import { MidtransService } from './midtrans.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [MidtransService],
  exports: [MidtransService],
})
export class MidtransModule {}
