import * as crypto from 'crypto';

const PREFIX = 'enc:v1';

function encryptionKey(): Buffer {
  const source = process.env.INTEGRATION_SETTINGS_KEY || process.env.BETTER_AUTH_SECRET;
  if (!source) {
    throw new Error('INTEGRATION_SETTINGS_KEY belum dikonfigurasi');
  }
  // Hashing makes both a generated base64 key and an existing strong auth secret
  // usable as an exact 32-byte AES key without persisting either value.
  return crypto.createHash('sha256').update(source).digest();
}

export function encryptIntegrationValue(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [PREFIX, iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join(':');
}

export function decryptIntegrationValue(value: string): string {
  if (!value.startsWith(`${PREFIX}:`)) return value;
  const [, , iv, tag, payload] = value.split(':');
  if (!iv || !tag || !payload) throw new Error('Format konfigurasi integrasi tidak valid');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(payload, 'base64')), decipher.final()]).toString('utf8');
}

export function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '•'.repeat(value.length);
  return `${value.slice(0, 4)}${'•'.repeat(8)}${value.slice(-4)}`;
}
