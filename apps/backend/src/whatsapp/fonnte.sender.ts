import { Logger } from '@nestjs/common';

const logger = new Logger('FonnteSender');

const FONNTE_API_URL = 'https://api.fonnte.com/send';

export interface FonnteResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Normalisasi nomor ke format Fonnte (62xxx tanpa tanda +)
function normalizePhone(phoneNumber: string): string {
  let phone = phoneNumber.replace(/[\s-]/g, '');
  if (phone.startsWith('+')) {
    phone = phone.slice(1);
  }
  if (phone.startsWith('0')) {
    phone = '62' + phone.slice(1);
  }
  return phone;
}

// Kirim pesan WhatsApp via Fonnte
export async function sendWhatsAppViaFonnte(
  phoneNumber: string,
  message: string,
): Promise<FonnteResult> {
  const token = process.env.FONNTE_TOKEN;

  if (!token) {
    logger.error('FONNTE_TOKEN belum diset di environment');
    return { success: false, error: 'Fonnte token tidak dikonfigurasi' };
  }

  const target = normalizePhone(phoneNumber);

  try {
    const body = new URLSearchParams({
      target,
      message,
      countryCode: '62',
    });

    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = (await response.json()) as {
      status?: boolean;
      id?: string[] | string;
      reason?: string;
      detail?: string;
    };

    if (!response.ok || data.status === false) {
      const reason = data.reason || data.detail || `HTTP ${response.status}`;
      logger.error(`Gagal kirim WhatsApp ke ${target}: ${reason}`);
      return { success: false, error: reason };
    }

    const messageId = Array.isArray(data.id) ? data.id[0] : data.id;
    logger.log(`WhatsApp terkirim ke ${target} (id: ${messageId ?? 'n/a'})`);
    return { success: true, messageId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error kirim WhatsApp ke ${target}: ${msg}`);
    return { success: false, error: msg };
  }
}
