import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly gatewayUrl: string;
  private readonly apiKey: string;
  private readonly phoneNumberId: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(private readonly configService: ConfigService) {
    this.gatewayUrl = this.configService.get<string>('WHATSAPP_GATEWAY_URL', '');
    this.apiKey = this.configService.get<string>('WHATSAPP_API_KEY', '');
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.maxRetries = this.configService.get<number>('WHATSAPP_MAX_RETRIES', 3);
    this.retryDelay = this.configService.get<number>('WHATSAPP_RETRY_DELAY_MS', 1000);
  }

  // Kirim OTP via WhatsApp dengan template standar
  async sendOtp(phoneNumber: string, otp: string): Promise<SendResult> {
    const message = `Kode OTP WargaNet Anda: ${otp}. Berlaku 5 menit. Jangan bagikan kode ini.`;

    return this.sendMessageWithRetry(phoneNumber, message);
  }

  // Kirim notifikasi umum
  async sendNotification(phoneNumber: string, message: string): Promise<SendResult> {
    return this.sendMessageWithRetry(phoneNumber, message);
  }

  // Check WhatsApp Gateway health
  async checkHealth(): Promise<boolean> {
    try {
      if (!this.gatewayUrl || !this.apiKey) {
        this.logger.warn('WhatsApp Gateway not configured');
        return false;
      }

      // Simulate health check - in production, this would ping the gateway
      // For now, just check if configuration exists
      return true;
    } catch (error) {
      this.logger.error('WhatsApp Gateway health check failed:', error);
      return false;
    }
  }

  // Send message dengan retry logic dan exponential backoff
  private async sendMessageWithRetry(
    phoneNumber: string,
    message: string,
  ): Promise<SendResult> {
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
        this.logger.warn(
          `WhatsApp send attempt ${attempt} failed for ${phoneNumber}:`,
          error,
        );
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

  // Actual message sending logic (to be implemented with real WhatsApp API)
  private async sendMessage(phoneNumber: string, message: string): Promise<SendResult> {
    try {
      // Check if gateway is configured
      if (!this.gatewayUrl || !this.apiKey) {
        throw new ServiceUnavailableException('WhatsApp Gateway not configured');
      }

      // TODO: Implement actual WhatsApp Business API call
      // For now, this is a mock implementation
      // In production, this would make HTTP request to WhatsApp Gateway

      // Simulate API call
      this.logger.debug(`Mock: Sending to ${phoneNumber}: ${message}`);

      // Mock success response
      return {
        success: true,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      /* Production implementation example:
      const response = await fetch(`${this.gatewayUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: message },
        }),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messages[0].id,
      };
      */
    } catch (error) {
      this.logger.error(`WhatsApp send error for ${phoneNumber}:`, error);

      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
