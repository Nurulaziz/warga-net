import type { Request } from 'express';

/**
 * Mengambil IP yang sudah diverifikasi Express berdasarkan konfigurasi trust proxy.
 * Header X-Forwarded-For tidak dibaca langsung agar tidak dapat dipalsukan klien.
 */
export function getClientIp(request: Request): string {
  const value = request.ip || request.socket?.remoteAddress || 'unknown';
  return value.startsWith('::ffff:') ? value.slice(7) : value === '::1' ? '127.0.0.1' : value;
}
