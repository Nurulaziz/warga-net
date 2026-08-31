import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sendWhatsAppViaFonnte } from './fonnte.sender';

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly fonnteToken: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(private readonly configService: ConfigService) {
    this.fonnteToken = this.configService.get<string>('FONNTE_TOKEN', '');
    this.maxRetries = this.configService.get<number>('WHATSAPP_MAX_RETRIES', 3);
    this.retryDelay = this.configService.get<number>('WHATSAPP_RETRY_DELAY_MS', 1000);
  }

  // Kirim OTP via WhatsApp dengan template standar
  async sendOtp(phoneNumber: string, otp: string): Promise<SendResult> {
    const message = `*WargaNet* - Kode Verifikasi\n\nKode OTP Anda: *${otp}*\n\nBerlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.`;

    return this.sendMessageWithRetry(phoneNumber, message);
  }

  // Kirim notifikasi umum
  async sendNotification(phoneNumber: string, message: string): Promise<SendResult> {
    return this.sendMessageWithRetry(phoneNumber, message);
  }

  // Cek apakah Fonnte sudah dikonfigurasi
  async checkHealth(): Promise<boolean> {
    if (!this.fonnteToken) {
      this.logger.warn('Fonnte token belum dikonfigurasi');
      return false;
    }
    return true;
  }

  // Send message dengan retry logic dan exponential backoff
  private async sendMessageWithRetry(phoneNumber: string, message: string): Promise<SendResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.log(
          `Sending WhatsApp message to ${phoneNumber} (attempt ${attempt}/${this.maxRetries})`,
        );

        const result = await this.sendMessage(phoneNumber, message);

        if (result.success) {
          this.logger.log(`WhatsApp message sent successfully to ${phoneNumber}`);
          return result;
        }

        // If not successful but no exception, treat as retriable error
        lastError = new Error(result.error || 'Unknown error');
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`WhatsApp send attempt ${attempt} failed for ${phoneNumber}:`, error);
      }

      // Don't wait after last attempt
      if (attempt < this.maxRetries) {
        const delay = this.calculateBackoffDelay(attempt);
        this.logger.log(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // All retries failed
    const errorMessage = `Failed to send WhatsApp message after ${this.maxRetries} attempts: ${lastError?.message}`;
    this.logger.error(errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }

  // Kirim pesan lewat Fonnte
  private async sendMessage(phoneNumber: string, message: string): Promise<SendResult> {
    if (!this.fonnteToken) {
      throw new ServiceUnavailableException('Fonnte token belum dikonfigurasi');
    }

    return sendWhatsAppViaFonnte(phoneNumber, message);
  }

  // Calculate exponential backoff delay
  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^(attempt-1)
    // attempt 1: 1000ms
    // attempt 2: 2000ms
    // attempt 3: 4000ms
    const delay = this.retryDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, 10000); // Max 10 seconds
  }

  // Sleep helper
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
