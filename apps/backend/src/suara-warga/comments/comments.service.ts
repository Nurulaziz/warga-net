import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizeHtml } from '../../common/sanitize';
import { AuthScope, requirePostOrThrow } from '../common/scope.helper';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const COMMENT_INCLUDE = {
  author: {
    select: { id: true, fullName: true, phoneNumber: true },
  },
  replies: {
    where: { deletedAt: null },
    include: {
      author: { select: { id: true, fullName: true, phoneNumber: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Pastikan post ada, published, dan (utk warga) masih di RT yang sama.
  private async assertCanAccessPost(postId: string, scope: AuthScope) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      include: { author: { select: { family: { select: { rt: true } } } } },
    });
    requirePostOrThrow(post, 'Posting tidak ditemukan');
    if (post!.status !== 'published') {
      throw new ForbiddenException('Posting tidak tersedia');
    }
    if (!scope.isAdmin && scope.rt && post!.author.family?.rt !== scope.rt) {
      throw new ForbiddenException('Anda tidak dapat mengakses posting ini');
    }
    return post!;
  }

  async findByPost(postId: string, scope: AuthScope) {
    await this.assertCanAccessPost(postId, scope);
    const comments = await this.prisma.comment.findMany({
      where: { postId, parentId: null, deletedAt: null, status: 'visible' },
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return { data: comments };
  }

  async create(postId: string, scope: AuthScope, dto: CreateCommentDto) {
    const post = await this.assertCanAccessPost(postId, scope);
    if (post.commentsLocked) {
      throw new ForbiddenException('Komentar untuk posting ini ditutup');
    }

    const content = sanitizeHtml(dto.content);
    if (!content) {
      throw new ForbiddenException('Isi komentar tidak boleh kosong');
    }

    // Validasi parent (maks 1 level: parent harus komentar akar, bukan balasan)
    let parentId: string | undefined;
    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, postId, parentId: null, deletedAt: null },
      });
      if (!parent) {
        throw new ForbiddenException('Komentar yang dibalas tidak ditemukan');
      }
      parentId = parent.id;
    }

    await this.prisma.$transaction([
      this.prisma.comment.create({
        data: { postId, authorId: scope.userId, content, parentId },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    return this.findOne(postId, scope);
  }

  private async findOne(postId: string, scope: AuthScope, commentId?: string) {
    const comments = await this.findByPost(postId, scope);
    if (commentId) {
      return comments.data.find((c) => c.id === commentId) ?? null;
    }
    return comments;
  }

  async update(id: string, scope: AuthScope, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findFirst({ where: { id, deletedAt: null } });
    if (!comment) throw new ForbiddenException('Komentar tidak ditemukan');
    if (comment.authorId !== scope.userId) {
      throw new ForbiddenException('Anda hanya dapat mengubah komentar milik Anda sendiri');
    }
    const content = sanitizeHtml(dto.content);
    if (!content) throw new ForbiddenException('Isi komentar tidak boleh kosong');
    return this.prisma.comment.update({ where: { id }, data: { content } });
  }

  async remove(id: string, scope: AuthScope) {
    const comment = await this.prisma.comment.findFirst({ where: { id, deletedAt: null } });
    if (!comment) throw new ForbiddenException('Komentar tidak ditemukan');
    if (comment.authorId !== scope.userId && !scope.isAdmin) {
      throw new ForbiddenException('Anda hanya dapat menghapus komentar milik Anda sendiri');
    }

    const replyCount = comment.parentId
      ? 0
      : await this.prisma.comment.count({ where: { parentId: id, deletedAt: null } });
    const operations = [
      this.prisma.comment.update({ where: { id }, data: { deletedAt: new Date() } }),
      ...(replyCount > 0
        ? [
            this.prisma.comment.updateMany({
              where: { parentId: id, deletedAt: null },
              data: { deletedAt: new Date() },
            }),
          ]
        : []),
      this.prisma.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: replyCount + 1 } },
      }),
    ];
    await this.prisma.$transaction(operations);
    return { success: true };
  }
}
