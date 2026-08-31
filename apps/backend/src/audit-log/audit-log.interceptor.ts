import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
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
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Hanya log operasi mutasi (POST, PUT, PATCH, DELETE)
    if (!METHOD_ACTION_MAP[method]) {
      return next.handle();
    }

    const path = request.url || request.path;

    // Skip excluded paths
    if (EXCLUDED_PATHS.some((p) => path.startsWith(p))) {
      return next.handle();
    }

    // Ambil resource dari URL path
    const resource = this.extractResource(path);
    const action = METHOD_ACTION_MAP[method];
    const ipAddress = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    // Ambil userId dari Better Auth session (di-inject ke request oleh AuthGuard)
    const userId = request.user?.id || request.session?.userId || null;

    return next.handle().pipe(
      tap({
        next: () => {
          // Log berhasil — fire and forget
          this.writeLog({
            userId,
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

  private extractResource(path: string): string {
    // /api/v1/users/123 → users
    // /api/v1/bills/types → bills
    // /api/v1/cash/transactions/123 → cash
    const segments = path.replace('/api/v1/', '').split('/');
    return segments[0] || 'unknown';
  }

  private buildDetails(method: string, path: string, body: unknown): Record<string, unknown> {
    const details: Record<string, unknown> = { method, path };

    // Jangan log body yang sensitif atau terlalu besar
    if (body && typeof body === 'object') {
      const sanitized = { ...body } as Record<string, unknown>;
      // Hapus field sensitif
      delete sanitized.password;
      delete sanitized.otp;
      delete sanitized.token;
      details.body = sanitized;
    }

    return details;
  }

  private async writeLog(data: {
    userId?: string | null;
    action: string;
    resource: string;
    ipAddress: string;
    userAgent: string;
    details?: Record<string, unknown>;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId || undefined,
          action: data.action,
          resource: data.resource,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          details: data.details ? JSON.parse(JSON.stringify(data.details)) : undefined,
        },
      });
    } catch {
      // Silent fail — jangan ganggu request utama
    }
  }
}
