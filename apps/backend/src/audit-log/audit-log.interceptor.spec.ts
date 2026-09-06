import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditLogInterceptor', () => {
  it('memetakan akun Better Auth ke user WargaNet sebelum menyimpan log', async () => {
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue({ id: 'internal-user-id' }) },
      auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    };
    const interceptor = new AuditLogInterceptor(prisma as unknown as PrismaService);
    const request = {
      method: 'PATCH',
      originalUrl: '/api/v1/users/me?source=profile',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' },
      user: { id: 'better-auth-id', phoneNumber: '+628123456789' },
      body: { fullName: 'Warga Baru', secret: 'jangan-disimpan' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const next = { handle: () => of({ success: true }) } as CallHandler;

    await lastValueFrom(interceptor.intercept(context, next));
    await new Promise((resolve) => setImmediate(resolve));

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { phoneNumber: '+628123456789', deletedAt: null },
      select: { id: true },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'internal-user-id',
        action: 'users.update',
        resource: 'users',
        details: expect.objectContaining({
          method: 'PATCH',
          path: '/api/v1/users/me',
          body: { fullName: 'Warga Baru', secret: '[REDACTED]' },
        }),
      }),
    });
  });

  it('tidak mencatat operasi baca', async () => {
    const prisma = {
      user: { findFirst: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    const interceptor = new AuditLogInterceptor(prisma as unknown as PrismaService);
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ method: 'GET', url: '/api/v1/users' }) }),
    } as unknown as ExecutionContext;

    await lastValueFrom(interceptor.intercept(context, { handle: () => of([]) } as CallHandler));
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});
