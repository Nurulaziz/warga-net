import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BillsService } from './bills.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class BillsSchedulerService {
  private readonly logger = new Logger(BillsSchedulerService.name);
  private static readonly LOCK_TTL_SECONDS = 300; // 5 menit

  constructor(
    private readonly billsService: BillsService,
    private readonly redisService: RedisService,
  ) {}

  // Jalan tiap hari pukul 00:05 WIB; generate jenis iuran yang generateDay-nya == hari ini
  @Cron('5 0 * * *', { name: 'auto-generate-monthly-bills', timeZone: 'Asia/Jakarta' })
  async handleDailyGeneration() {
    const now = new Date();
    // Tanggal berjalan menurut WIB
    const dayOfMonth = parseInt(
      new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'Asia/Jakarta' }).format(now),
      10,
    );
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Lock per periode+hari agar tidak jalan ganda saat multi-instance
    const lockKey = `${period}:${dayOfMonth}`;
    const acquired = await this.acquireLock(lockKey);
    if (!acquired) {
      this.logger.log(`Lewati auto-generate ${lockKey}: instance lain sedang/sudah memproses`);
      return;
    }

    try {
      const result = await this.billsService.generateDueBillsForToday(dayOfMonth);
      if (result.billTypes > 0) {
        this.logger.log(
          `Auto-generate tagihan ${period} (tgl ${dayOfMonth}): ${result.totalCreated} dibuat, ${result.totalSkipped} dilewati (${result.billTypes} jenis iuran)`,
        );
      }
    } catch (error) {
      this.logger.error(`Gagal auto-generate tagihan ${lockKey}`, error);
      await this.releaseLock(lockKey);
    }
  }

  // Best-effort lock via Redis; idempotensi generateBills tetap jadi pengaman utama.
  private async acquireLock(key: string): Promise<boolean> {
    const redisKey = `lock:monthly-bills:${key}`;
    try {
      const exists = await this.redisService.exists(redisKey);
      if (exists) return false;
      await this.redisService.set(redisKey, '1', BillsSchedulerService.LOCK_TTL_SECONDS);
      return true;
    } catch (error) {
      // Jika Redis bermasalah, tetap lanjut (single-instance aman karena idempoten)
      this.logger.warn(`Lock Redis gagal untuk ${key}, lanjut tanpa lock: ${error}`);
      return true;
    }
  }

  private async releaseLock(key: string): Promise<void> {
    try {
      await this.redisService.del(`lock:monthly-bills:${key}`);
    } catch {
      // abaikan
    }
  }
}
