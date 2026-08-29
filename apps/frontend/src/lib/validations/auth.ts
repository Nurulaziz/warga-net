import { z } from 'zod';

// Validasi nomor telepon Indonesia (+62xxx)
export const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Nomor telepon wajib diisi')
    .regex(/^\+62\d{9,13}$/, 'Format: +62xxxxxxxxxxx (9-13 digit setelah +62)'),
});

export type PhoneFormData = z.infer<typeof phoneSchema>;

// Validasi OTP 6 digit
export const otpSchema = z.object({
  otp: z
    .string()
    .min(1, 'Kode OTP wajib diisi')
    .length(6, 'Kode OTP harus 6 digit')
    .regex(/^\d{6}$/, 'Kode OTP harus berupa angka'),
});

export type OtpFormData = z.infer<typeof otpSchema>;
