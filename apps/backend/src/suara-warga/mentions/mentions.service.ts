import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthScope } from '../common/scope.helper';

@Injectable()
export class MentionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Autocomplete warga untuk mention (scope RT). Admin bisa mencari semua.
   */
  async autocomplete(q: string, scope: AuthScope, limit = 10) {
    const query = q.trim();
    const where: Record<string, unknown> = {
      isActive: true,
      deletedAt: null,
    };
    if (query) {
      where.fullName = { contains: query, mode: 'insensitive' };
    }
    if (!scope.isAdmin && scope.rt) {
      where.family = { rt: scope.rt };
    }

    const users = await this.prisma.user.findMany({
      where,
      take: limit,
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true },
    });

    return { data: users };
  }
}
