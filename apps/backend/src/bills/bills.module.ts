import { Module } from '@nestjs/common';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { BillsSchedulerService } from './bills.scheduler';
import { MidtransModule } from '../midtrans/midtrans.module';
import { UsersModule } from '../users/users.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [MidtransModule, UsersModule, SettingsModule],
  controllers: [BillsController],
  providers: [BillsService, BillsSchedulerService],
  exports: [BillsService],
})
export class BillsModule {}
