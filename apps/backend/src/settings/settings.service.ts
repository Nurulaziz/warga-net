import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { decryptIntegrationValue, encryptIntegrationValue, maskSecret } from './integration-crypto';
import { assertProvider, providersFor } from './integration-providers';

const INTEGRATION_GROUP = 'integrations';
const SECRET_KEYS = new Set(['midtrans_server_key', 'midtrans_client_key', 'fonnte_token']);

export interface IntegrationInput {
  paymentProvider?: string;
  whatsappProvider?: string;
  midtransServerKey?: string;
  midtransClientKey?: string;
  midtransMerchantId?: string;
  midtransIsProduction?: boolean;
  fonnteToken?: string;
  whatsappMaxRetries?: number;
  whatsappRetryDelayMs?: number;
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findAll(group?: string) {
    const where: Record<string, unknown> = {};
    if (group) where.group = group;
    where.NOT = { group: INTEGRATION_GROUP };
    return this.prisma.systemSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
  }

  async get(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value || null;
  }

  async updateBatch(settings: { key: string; value: string; label?: string; group?: string }[]) {
    if (settings.some((setting) => setting.group === INTEGRATION_GROUP || SECRET_KEYS.has(setting.key))) {
      throw new BadRequestException('Konfigurasi integrasi harus diubah melalui menu Integrasi');
    }
    const results = [];
    for (const setting of settings) {
      const result = await this.prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value, label: setting.label },
        create: {
          key: setting.key,
          value: setting.value,
          label: setting.label,
          group: setting.group || 'general',
        },
      });
      results.push(result);
    }
    return results;
  }

  private async integrationValues(): Promise<Record<string, string>> {
    const rows = await this.prisma.systemSetting.findMany({ where: { group: INTEGRATION_GROUP } });
    return Object.fromEntries(rows.map((row) => [row.key, SECRET_KEYS.has(row.key) ? decryptIntegrationValue(row.value) : row.value]));
  }

  async getRuntimeIntegrations() {
    const stored = await this.integrationValues();
    return {
      paymentProvider: stored.payment_provider || 'midtrans',
      whatsappProvider: stored.whatsapp_provider || 'fonnte',
      midtransServerKey: stored.midtrans_server_key || this.config.get<string>('MIDTRANS_SERVER_KEY', ''),
      midtransClientKey: stored.midtrans_client_key || this.config.get<string>('MIDTRANS_CLIENT_KEY', ''),
      midtransMerchantId: stored.midtrans_merchant_id || this.config.get<string>('MIDTRANS_MERCHANT_ID', ''),
      midtransIsProduction: (stored.midtrans_is_production || this.config.get<string>('MIDTRANS_IS_PRODUCTION', 'false')) === 'true',
      fonnteToken: stored.fonnte_token || this.config.get<string>('FONNTE_TOKEN', ''),
      whatsappMaxRetries: Number(stored.whatsapp_max_retries || this.config.get<number>('WHATSAPP_MAX_RETRIES', 3)),
      whatsappRetryDelayMs: Number(stored.whatsapp_retry_delay_ms || this.config.get<number>('WHATSAPP_RETRY_DELAY_MS', 1000)),
    };
  }

  async getIntegrationSummary() {
    const value = await this.getRuntimeIntegrations();
    return {
      providers: {
        payment: providersFor('payment'),
        whatsapp: providersFor('whatsapp'),
      },
      active: {
        payment: value.paymentProvider,
        whatsapp: value.whatsappProvider,
      },
      midtrans: {
        serverKey: { configured: !!value.midtransServerKey, masked: maskSecret(value.midtransServerKey) },
        clientKey: { configured: !!value.midtransClientKey, masked: maskSecret(value.midtransClientKey) },
        merchantId: value.midtransMerchantId,
        isProduction: value.midtransIsProduction,
      },
      whatsapp: {
        fonnteToken: { configured: !!value.fonnteToken, masked: maskSecret(value.fonnteToken) },
        maxRetries: value.whatsappMaxRetries,
        retryDelayMs: value.whatsappRetryDelayMs,
      },
    };
  }

  async updateIntegrations(input: IntegrationInput) {
    const rows: { key: string; value: string; label: string; group: string }[] = [];
    const add = (key: string, value: string, label: string, secret = false) => {
      rows.push({ key, value: secret ? encryptIntegrationValue(value) : value, label, group: INTEGRATION_GROUP });
    };
    if (input.paymentProvider !== undefined) {
      try { assertProvider('payment', input.paymentProvider); } catch { throw new BadRequestException('Provider pembayaran tidak didukung'); }
      add('payment_provider', input.paymentProvider, 'Provider Pembayaran Aktif');
    }
    if (input.whatsappProvider !== undefined) {
      try { assertProvider('whatsapp', input.whatsappProvider); } catch { throw new BadRequestException('Provider WhatsApp tidak didukung'); }
      add('whatsapp_provider', input.whatsappProvider, 'Provider WhatsApp Aktif');
    }
    if (input.midtransServerKey?.trim()) add('midtrans_server_key', input.midtransServerKey.trim(), 'Midtrans Server Key', true);
    if (input.midtransClientKey?.trim()) add('midtrans_client_key', input.midtransClientKey.trim(), 'Midtrans Client Key', true);
    if (input.fonnteToken?.trim()) add('fonnte_token', input.fonnteToken.trim(), 'Fonnte Token', true);
    if (input.midtransMerchantId !== undefined) add('midtrans_merchant_id', input.midtransMerchantId.trim(), 'Midtrans Merchant ID');
    if (input.midtransIsProduction !== undefined) add('midtrans_is_production', String(input.midtransIsProduction), 'Midtrans Production Mode');
    if (input.whatsappMaxRetries !== undefined) {
      if (!Number.isInteger(input.whatsappMaxRetries) || input.whatsappMaxRetries < 1 || input.whatsappMaxRetries > 5) throw new BadRequestException('Jumlah percobaan WhatsApp harus 1–5');
      add('whatsapp_max_retries', String(input.whatsappMaxRetries), 'WhatsApp Max Retries');
    }
    if (input.whatsappRetryDelayMs !== undefined) {
      if (!Number.isInteger(input.whatsappRetryDelayMs) || input.whatsappRetryDelayMs < 100 || input.whatsappRetryDelayMs > 10000) throw new BadRequestException('Jeda WhatsApp harus 100–10000 ms');
      add('whatsapp_retry_delay_ms', String(input.whatsappRetryDelayMs), 'WhatsApp Retry Delay');
    }
    for (const row of rows) {
      await this.prisma.systemSetting.upsert({ where: { key: row.key }, update: { value: row.value, label: row.label, group: row.group }, create: row });
    }
    return this.getIntegrationSummary();
  }
}
