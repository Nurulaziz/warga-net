import { UnauthorizedException } from '@nestjs/common';
import { UserSession } from '@thallesp/nestjs-better-auth';

// Ambil nomor telepon dari session Better Auth
export function getSessionPhoneNumber(session: UserSession): string {
  const phoneNumber = (session as { user?: { phoneNumber?: string } })?.user?.phoneNumber;
  if (!phoneNumber) {
    throw new UnauthorizedException('Session tidak memiliki nomor telepon');
  }
  return phoneNumber;
}
