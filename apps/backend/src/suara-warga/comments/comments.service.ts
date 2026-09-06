import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizeHtml } from '../../common/sanitize';
import { AuthScope, requirePostOrThrow } from '../common/scope.helper';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

type AvatarAccountStore = {
  findMany(args: object): Promise<Array<{ phoneNumber: string | null; image: string | null }>>;
};

const COMMENT_INCLUDE = {
  author: { select: { id: true, fullName: true, phoneNumber: true } },
};

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Pastikan post ada, published, dan (utk warga) masih di RT yang sama.
  private async assertCanAccessPost(postId: string, scope: AuthScope) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      include: {
        author: {
          select: {
            family: { select: { rt: true } },
            role: { select: { name: true } },
          },
        },
      },
    });
    requirePostOrThrow(post, 'Posting tidak ditemukan');
    if (post!.status !== 'published') {
      throw new ForbiddenException('Posting tidak tersedia');
    }
    if (
      !scope.isAdmin &&
      scope.rt &&
      post!.author.family?.rt !== scope.rt &&
      post!.author.role?.name !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException('Anda tidak dapat mengakses posting ini');
    }
    return post!;
  }

  async findByPost(postId: string, scope: AuthScope) {
    await this.assertCanAccessPost(postId, scope);
    const comments = await this.prisma.comment.findMany({
      where: { postId, deletedAt: null, status: 'visible' },
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    const accountStore = (this.prisma as unknown as { betterAuthUser?: AvatarAccountStore }).betterAuthUser;
    const accounts = accountStore
      ? await accountStore.findMany({
          where: { phoneNumber: { in: [...new Set(comments.map((comment) => comment.author.phoneNumber))] } },
          select: { phoneNumber: true, image: true },
        })
      : [];
    const images = new Map(accounts.map((account) => [account.phoneNumber, account.image]));
    const enriched = comments.map((comment) => ({
      ...comment,
      author: { ...comment.author, avatarUrl: images.get(comment.author.phoneNumber) ?? null },
    }));
    type CommentNode = (typeof enriched)[number] & { replies: CommentNode[] };
    const nodes = new Map<string, CommentNode>(
      enriched.map((comment) => [comment.id, { ...comment, replies: [] }]),
    );
    const roots: CommentNode[] = [];
    for (const comment of enriched) {
      const node = nodes.get(comment.id)!;
      const parent = comment.parentId ? nodes.get(comment.parentId) : undefined;
      if (parent) parent.replies.push(node);
      else roots.push(node);
    }
    return { data: roots };
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

    // Parent boleh berupa komentar atau balasan agar percakapan dapat bersarang.
    let parentId: string | undefined;
    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, postId, deletedAt: null, status: 'visible' },
      });
      if (!parent) {
        throw new ForbiddenException('Komentar yang dibalas tidak ditemukan');
      }
      parentId = parent.id;
    }

    const [createdComment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: { postId, authorId: scope.userId, content, parentId },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    const mentionedUserIds = dto.mentionedUserIds ?? [];
    if (createdComment && mentionedUserIds.length) {
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: mentionedUserIds },
          isActive: true,
          deletedAt: null,
          ...(!scope.isAdmin && scope.rt ? { family: { rt: scope.rt } } : {}),
        },
        select: { id: true },
      });
      await Promise.all(
        users
          .filter((user) => user.id !== scope.userId)
          .map((user) =>
            this.prisma.mention.create({
              data: { commentId: createdComment.id, mentionedUserId: user.id },
            }),
          ),
      );
    }

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
    if (!scope.isAdmin) {
      throw new ForbiddenException('Hanya admin yang dapat menghapus komentar');
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
