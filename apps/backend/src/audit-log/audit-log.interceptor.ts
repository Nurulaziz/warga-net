import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

// Map HTTP method ke action yang readable
const METHOD_ACTION_MAP: Record<string, string> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

// Routes yang tidak perlu di-log
const EXCLUDED_PATHS = ['/api/v1/health', '/api/v1/auth', '/api/v1/audit-logs'];

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Hanya log operasi mutasi (POST, PUT, PATCH, DELETE)
    if (!METHOD_ACTION_MAP[method]) {
      return next.handle();
    }

    const path = this.normalizePath(request.originalUrl || request.url || request.path || '');

    // Skip excluded paths
    if (EXCLUDED_PATHS.some((p) => path.startsWith(p))) {
      return next.handle();
    }

    // Ambil resource dari URL path
    const resource = this.extractResource(path);
    const action = METHOD_ACTION_MAP[method];
    const ipAddress = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    // ID Better Auth berbeda dari ID tabel users WargaNet. Nomor telepon menjadi
    // penghubung yang stabil agar foreign key audit_logs.user_id selalu valid.
    const authUser = request.user || request.session?.user;
    const authUserId = authUser?.id || request.session?.userId || null;
    const phoneNumber = authUser?.phoneNumber || request.session?.user?.phoneNumber || null;

    return next.handle().pipe(
      tap({
        next: () => {
          // Log berhasil — fire and forget
          this.writeLog({
            authUserId,
            phoneNumber,
            action: `${resource}.${action}`,
            resource,
            ipAddress,
            userAgent,
            details: this.buildDetails(method, path, request.body),
          });
        },
      }),
    );
  }

  private normalizePath(rawPath: string): string {
    const withoutOrigin = rawPath.replace(/^https?:\/\/[^/]+/i, '');
    return withoutOrigin.split('?')[0] || '/';
  }

  private extractResource(path: string): string {
    // /api/v1/users/123 → users
    // /api/v1/bills/types → bills
    // /api/v1/cash/transactions/123 → cash
    const normalized = path.replace(/^\/api\/v1\/?/, '').replace(/^\/v1\/?/, '').replace(/^\//, '');
    return normalized.split('/')[0] || 'unknown';
  }

  private buildDetails(method: string, path: string, body: unknown): Record<string, unknown> {
    const details: Record<string, unknown> = { method, path };

    // Jangan log body yang sensitif atau terlalu besar
    if (body && typeof body === 'object') {
      details.body = this.sanitize(body);
    }

    return details;
  }

  private sanitize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item));
    if (!value || typeof value !== 'object') return value;
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      result[key] = /(password|otp|token|secret|serverkey|clientkey)/i.test(key)
        ? '[REDACTED]'
        : this.sanitize(nested);
    }
    return result;
  }

  private async writeLog(data: {
    authUserId?: string | null;
    phoneNumber?: string | null;
    action: string;
    resource: string;
    ipAddress: string;
    userAgent: string;
    details?: Record<string, unknown>;
  }) {
    try {
      const user = data.phoneNumber
        ? await this.prisma.user.findFirst({
            where: { phoneNumber: data.phoneNumber, deletedAt: null },
            select: { id: true },
          })
        : data.authUserId
          ? await this.prisma.user.findFirst({
              where: { id: data.authUserId, deletedAt: null },
              select: { id: true },
            })
          : null;
      await this.prisma.auditLog.create({
        data: {
          userId: user?.id,
          action: data.action,
          resource: data.resource,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          details: data.details ? JSON.parse(JSON.stringify(data.details)) : undefined,
        },
      });
    } catch (error) {
      // Audit tidak boleh menggagalkan aksi utama, tetapi kegagalannya harus dapat didiagnosis.
      this.logger.warn(`Gagal mencatat audit log: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }
}
