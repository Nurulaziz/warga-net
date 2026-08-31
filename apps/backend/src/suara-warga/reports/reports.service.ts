import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizeHtml } from '../../common/sanitize';
import { AuthScope, assertAdmin } from '../common/scope.helper';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertPostScope(postId: string, scope: AuthScope) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      select: { id: true, author: { select: { family: { select: { rt: true } } } } },
    });
    if (!post) throw new NotFoundException('Posting tidak ditemukan');
    if (!scope.isAdmin && scope.rt && post.author.family?.rt !== scope.rt) {
      throw new ForbiddenException('Anda tidak dapat mengakses posting ini');
    }
    return post;
  }

  async reportPost(postId: string, scope: AuthScope, dto: CreateReportDto) {
    await this.assertPostScope(postId, scope);
    const existing = await this.prisma.report.findFirst({
      where: { reporterId: scope.userId, postId },
    });
    if (existing) throw new ConflictException('Anda sudah melaporkan posting ini');
    return this.prisma.report.create({
      data: {
        reporterId: scope.userId,
        postId,
        targetType: 'POST',
        reason: dto.reason,
        description: dto.description ? sanitizeHtml(dto.description) : null,
      },
    });
  }

  async reportComment(commentId: string, scope: AuthScope, dto: CreateReportDto) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: { postId: true },
    });
    if (!comment) throw new NotFoundException('Komentar tidak ditemukan');
    await this.assertPostScope(comment.postId, scope);
    const existing = await this.prisma.report.findFirst({
      where: { reporterId: scope.userId, commentId },
    });
    if (existing) throw new ConflictException('Anda sudah melaporkan komentar ini');
    return this.prisma.report.create({
      data: {
        reporterId: scope.userId,
        commentId,
        targetType: 'COMMENT',
        reason: dto.reason,
        description: dto.description ? sanitizeHtml(dto.description) : null,
      },
    });
  }

  async findAll(scope: AuthScope, query: { page?: number; limit?: number; status?: string }) {
    assertAdmin(scope);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.status ? { status: query.status } : {};
    const include = {
      reporter: { select: { id: true, fullName: true } },
      post: {
        select: { id: true, content: true, status: true, author: { select: { fullName: true } } },
      },
      comment: {
        select: {
          id: true,
          content: true,
          status: true,
          postId: true,
          author: { select: { fullName: true } },
        },
      },
    };
    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async resolve(id: string, scope: AuthScope, status: string) {
    assertAdmin(scope);
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Laporan tidak ditemukan');
    return this.prisma.report.update({
      where: { id },
      data: {
        status,
        resolvedById: status === 'REVIEWING' ? null : scope.userId,
        resolvedAt: status === 'REVIEWING' ? null : new Date(),
      },
    });
  }
}
