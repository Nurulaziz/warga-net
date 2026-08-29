import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// Midtrans Snap API interface
interface SnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerPhone?: string;
  itemName: string;
  itemId?: string;
}

interface SnapResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransNotification {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: string;
  currency: string;
}

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private readonly serverKey: string;
  private readonly clientKey: string;
  private readonly isProduction: boolean;
  private readonly baseUrl: string;

  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY', '');
    this.clientKey = this.configService.get<string>('MIDTRANS_CLIENT_KEY', '');
    this.isProduction =
      this.configService.get<string>('MIDTRANS_IS_PRODUCTION', 'false') === 'true';
    this.baseUrl = this.isProduction
      ? 'https://app.midtrans.com/snap/v1'
      : 'https://app.sandbox.midtrans.com/snap/v1';
    // Core API — untuk cek status transaksi (host berbeda dari Snap)
    this.apiUrl = this.isProduction
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2';
  }

  // Getter untuk client key (dipakai frontend)
  getClientKey(): string {
    return this.clientKey;
  }

  getIsProduction(): boolean {
    return this.isProduction;
  }

  // Buat Snap transaction token
  async createTransaction(params: SnapTransactionParams): Promise<SnapResponse> {
    const payload = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.grossAmount,
      },
      customer_details: {
        first_name: params.customerName,
        phone: params.customerPhone || '',
      },
      item_details: [
        {
          id: params.itemId || params.orderId,
          price: params.grossAmount,
          quantity: 1,
          name: params.itemName,
        },
      ],
      callbacks: {
        finish: '/bills?payment=success',
      },
    };

    const authString = Buffer.from(`${this.serverKey}:`).toString('base64');

    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Midtrans API error: ${response.status} - ${errorBody}`);
        throw new Error(`Midtrans API error: ${response.status}`);
      }

      const data = (await response.json()) as SnapResponse;
      this.logger.log(`Snap token created for order ${params.orderId}`);
      return data;
    } catch (error) {
      this.logger.error('Failed to create Midtrans transaction', error);
      throw error;
    }
  }

  // Cek status transaksi langsung ke Midtrans (fallback tanpa webhook).
  // Berguna di dev lokal di mana webhook Midtrans tidak bisa menjangkau localhost.
  async getTransactionStatus(orderId: string): Promise<MidtransNotification | null> {
    const authString = Buffer.from(`${this.serverKey}:`).toString('base64');
    try {
      const response = await fetch(`${this.apiUrl}/${orderId}/status`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${authString}`,
        },
      });

      // 404 = transaksi belum ada di Midtrans (belum dibayar sama sekali)
      if (response.status === 404) return null;

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Midtrans status API error: ${response.status} - ${errorBody}`);
        throw new Error(`Midtrans status API error: ${response.status}`);
      }

      return (await response.json()) as MidtransNotification;
    } catch (error) {
      this.logger.error(`Gagal cek status transaksi ${orderId}`, error);
      throw error;
    }
  }

  // Verifikasi signature notification dari Midtrans
  verifyNotificationSignature(notification: MidtransNotification): boolean {
    const { order_id, status_code, gross_amount, signature_key } = notification;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${this.serverKey}`)
      .digest('hex');

    return expectedSignature === signature_key;
  }

  // Cek apakah transaksi berhasil berdasarkan status
  isTransactionSuccess(notification: MidtransNotification): boolean {
    const { transaction_status, fraud_status } = notification;

    if (transaction_status === 'capture') {
      return fraud_status === 'accept';
    }

    return ['settlement', 'capture'].includes(transaction_status);
  }

  // Cek apakah transaksi pending
  isTransactionPending(notification: MidtransNotification): boolean {
    return notification.transaction_status === 'pending';
  }

  // Cek apakah transaksi gagal/expired/cancelled
  isTransactionFailed(notification: MidtransNotification): boolean {
    return ['deny', 'cancel', 'expire', 'failure'].includes(notification.transaction_status);
  }
}
