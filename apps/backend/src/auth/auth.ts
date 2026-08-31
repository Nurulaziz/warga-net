import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { phoneNumber, admin } from 'better-auth/plugins';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { sendWhatsAppViaFonnte } from '../whatsapp/fonnte.sender';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: any = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  basePath: '/api/v1/auth',
  trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:5173'],
  user: {
    modelName: 'BetterAuthUser',
  },
  session: {
    modelName: 'Session',
  },
  account: {
    modelName: 'Account',
  },
  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: 300, // 5 menit
      sendOTP: async ({ phoneNumber: phone, code }, _ctx) => {
        // Log OTP hanya di development untuk memudahkan testing
        if (process.env.NODE_ENV !== 'production') {
          console.log(`========================================`);
          console.log(`  [DEV] OTP untuk ${phone}: ${code}`);
          console.log(`========================================`);
        }

        // Kirim OTP via WhatsApp (Fonnte)
        const message = `*WargaNet* - Kode Verifikasi\n\nKode OTP Anda: *${code}*\n\nBerlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.`;
        const result = await sendWhatsAppViaFonnte(phone, message);

        if (!result.success) {
          // Di development, jangan gagalkan request: OTP sudah tercetak di console
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              `[DEV] WhatsApp gagal dikirim ke ${phone}: ${result.error} — gunakan OTP dari console.`,
            );
            return;
          }
          // Di production, lempar error agar better-auth tahu pengiriman gagal
          throw new Error(`Gagal mengirim OTP: ${result.error}`);
        }
      },
      signUpOnVerification: {
        getTempEmail: (phone) => {
          // Generate email placeholder dari nomor telepon
          const sanitized = phone.replace(/\+/g, '');
          return `${sanitized}@warganet.local`;
        },
        getTempName: (phone) => {
          // Gunakan nomor telepon sebagai nama sementara
          return phone;
        },
      },
    }),
    admin({
      impersonationSessionDuration: 60 * 60, // 1 jam
    }),
  ],
});

export type Auth = typeof auth;
