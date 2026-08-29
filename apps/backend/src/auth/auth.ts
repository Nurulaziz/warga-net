import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { phoneNumber, admin } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        // Kirim OTP via WhatsApp
        // Di production, gunakan WhatsApp Business API

        // HANYA log di development — JANGAN log OTP di production
        if (process.env.NODE_ENV !== 'production') {
          console.log(`========================================`);
          console.log(`  [DEV] OTP untuk ${phone}: ${code}`);
          console.log(`========================================`);
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
