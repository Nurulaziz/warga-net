import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizeHtml } from '../../common/sanitize';
import { AuthScope, assertAdmin, requirePostOrThrow } from '../common/scope.helper';
import { extractHashtags, extractMentions } from '../common/parser.helper';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private postInclude = {
    author: {
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
      },
    },
    media: {
      orderBy: { order: 'asc' as const },
    },
    hashtags: {
      include: { hashtag: { select: { name: true } } },
    },
  };

  private includeForViewer(userId: string) {
    return {
      ...this.postInclude,
      reactions: { where: { userId }, select: { id: true } },
      savedBy: { where: { userId }, select: { id: true } },
      poll: {
        include: {
          options: { orderBy: { order: 'asc' as const } },
          votes: { where: { userId }, select: { optionId: true } },
        },
      },
    };
  }

  private withViewerState<
    T extends {
      reactions?: unknown[];
      savedBy?: unknown[];
      poll?: ({ votes?: Array<{ optionId: string }> } & Record<string, unknown>) | null;
    },
  >(post: T) {
    const { reactions = [], savedBy = [], ...data } = post;
    const poll = data.poll
      ? {
          ...data.poll,
          viewerOptionId: data.poll.votes?.[0]?.optionId ?? null,
          votes: undefined,
        }
      : null;
    return {
      ...data,
      ...(data.poll !== undefined ? { poll } : {}),
      viewerHasReacted: reactions.length > 0,
      viewerHasSaved: savedBy.length > 0,
    };
  }

  async findAll(scope: AuthScope, query: { page?: number; limit?: number; sort?: string }) {
    const { page = 1, limit = 20, sort = 'latest' } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: 'published',
      deletedAt: null,
    };

    // Warga hanya melihat posting dari RT yang sama. Admin melihat semua.
    if (!scope.isAdmin && scope.rt) {
      where.author = { family: { rt: scope.rt } };
    }

    let orderBy: Record<string, unknown> | Array<Record<string, unknown>> | undefined = {
      createdAt: 'desc',
    };
    if (sort === 'trending') {
      orderBy = [{ likeCount: 'desc' }, { commentCount: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'pinned') {
      orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
    }

    const [rawData, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: sort === 'trending' ? 0 : skip,
        take: sort === 'trending' ? 200 : limit,
        orderBy,
        include: this.includeForViewer(scope.userId),
      }),
      this.prisma.post.count({ where }),
    ]);

    const data =
      sort === 'trending'
        ? rawData
            .map((post) => {
              const ageHours = Math.max(0, (Date.now() - post.createdAt.getTime()) / 3_600_000);
              const engagement =
                post.likeCount * 3 +
                post.commentCount * 5 +
                post.shareCount * 4 +
                post.viewCount * 0.1;
              return {
                post,
                score: (engagement + (post.isPinned ? 10 : 0)) / Math.pow(ageHours + 2, 1.25),
              };
            })
            .sort((a, b) => b.score - a.score)
            .slice(skip, skip + limit)
            .map(({ post }) => post)
        : rawData;

    return {
      data: data.map((post) => this.withViewerState(post)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, scope: AuthScope) {
    const [post, authorRt] = await Promise.all([
      this.prisma.post.findFirst({
        where: { id, deletedAt: null },
        include: this.includeForViewer(scope.userId),
      }),
      this.prisma.post.findFirst({
        where: { id, deletedAt: null },
        select: { author: { select: { family: { select: { rt: true } } } } },
      }),
    ]);
    const found = requirePostOrThrow(post, 'Posting tidak ditemukan');

    // Privasi: warga hanya boleh melihat posting dari RT yang sama.
    if (!scope.isAdmin && scope.rt && authorRt?.author?.family?.rt !== scope.rt) {
      throw new ForbiddenException('Anda tidak dapat mengakses posting ini');
    }
    return this.withViewerState(found);
  }

  async create(authorId: string, dto: CreatePostDto, rt?: string | null) {
    const content = dto.content ? sanitizeHtml(dto.content) : '';
    const hasMedia = !!dto.media && dto.media.length > 0;
    const pollOptions = dto.poll?.options.map((option) => option.trim()).filter(Boolean) ?? [];
    if (!content && !hasMedia && !dto.poll) {
      throw new ForbiddenException('Konten posting tidak boleh kosong');
    }
    if (dto.poll && pollOptions.length < 2) {
      throw new ForbiddenException('Polling minimal memiliki 2 pilihan yang valid');
    }

    const post = await this.prisma.post.create({
      data: {
        authorId,
        type: dto.poll ? 'POLL' : dto.type || (hasMedia ? 'IMAGE' : 'TEXT'),
        content: content || null,
        visibility: dto.visibility || 'RT',
        ...(dto.poll
          ? {
              poll: {
                create: {
                  question: sanitizeHtml(dto.poll.question),
                  options: {
                    create: pollOptions.map((text, order) => ({
                      text: sanitizeHtml(text),
                      order,
                    })),
                  },
                },
              },
            }
          : {}),
      },
      include: this.postInclude,
    });

    // Media
    const media = dto.media ?? [];
    for (const [index, m] of media.entries()) {
      if (!m?.url) continue;
      await this.prisma.postMedia
        .create({
          data: {
            postId: post.id,
            url: m.url,
            mediaType: m.mediaType || 'IMAGE',
            size: m.size,
            order: index,
          },
        })
        .catch(() => undefined);
    }

    // Hashtag
    const hashtags = extractHashtags(content);
    for (const tag of hashtags) {
      const h = await this.prisma.hashtag
        .upsert({
          where: { name: tag },
          create: { name: tag, usageCount: 1 },
          update: { usageCount: { increment: 1 } },
        })
        .catch(() => undefined);
      if (h) {
        await this.prisma.postHashtag
          .create({ data: { postId: post.id, hashtagId: h.id } })
          .catch(() => undefined);
      }
    }

    // Mention
    const mentionNames = extractMentions(content);
    if (mentionNames.length) {
      const users = await this.prisma.user
        .findMany({
          where: {
            fullName: { in: mentionNames },
            isActive: true,
            ...(rt ? { family: { rt } } : {}),
          },
          select: { id: true },
        })
        .catch(() => []);
      for (const u of users) {
        await this.prisma.mention
          .create({ data: { postId: post.id, mentionedUserId: u.id } })
          .catch(() => undefined);
      }
    }

    return post;
  }

  async findByHashtag(tag: string, scope: AuthScope, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: 'published',
      deletedAt: null,
      hashtags: { some: { hashtag: { name: tag.toLowerCase() } } },
    };

    if (!scope.isAdmin && scope.rt) {
      where.author = { family: { rt: scope.rt } };
    }

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.includeForViewer(scope.userId),
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: data.map((post) => this.withViewerState(post)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByAuthor(authorId: string, scope: AuthScope, query: { page?: number; limit?: number }) {
    const author = await this.prisma.user.findFirst({
      where: { id: authorId, deletedAt: null },
      select: { family: { select: { rt: true } } },
    });
    if (!author) throw new ForbiddenException('Pengguna tidak ditemukan');
    if (!scope.isAdmin && scope.rt && author.family?.rt !== scope.rt) {
      throw new ForbiddenException('Anda tidak dapat melihat posting pengguna ini');
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = { authorId, status: 'published', deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.includeForViewer(scope.userId),
      }),
      this.prisma.post.count({ where }),
    ]);
    return {
      data: data.map((post) => this.withViewerState(post)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(id: string, scope: AuthScope, dto: UpdatePostDto) {
    const post = await this.findOne(id, scope);
    if (!scope.isAdmin && post.authorId !== scope.userId) {
      throw new ForbiddenException('Anda hanya dapat mengubah posting milik Anda sendiri');
    }

    const data: Record<string, unknown> = {};
    if (dto.content !== undefined) data.content = sanitizeHtml(dto.content);
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.visibility !== undefined) data.visibility = dto.visibility;

    return this.prisma.post.update({ where: { id }, data, include: this.postInclude });
  }

  async remove(id: string, scope: AuthScope) {
    const post = await this.findOne(id, scope);
    if (!scope.isAdmin && post.authorId !== scope.userId) {
      throw new ForbiddenException('Anda hanya dapat menghapus posting milik Anda sendiri');
    }
    return this.prisma.post.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ==== Interaksi sosial ====

  // Verifikasi post dapat diinteraksi (published + dalam RT yang sama utk warga).
  private async assertInteractive(id: string, scope: AuthScope) {
    const post = await this.findOne(id, scope);
    if (post.status !== 'published') {
      throw new ForbiddenException('Posting tidak tersedia');
    }
    return post;
  }

  async react(id: string, scope: AuthScope, type = 'LIKE') {
    await this.assertInteractive(id, scope);
    const existing = await this.prisma.postReaction.findUnique({
      where: { postId_userId: { postId: id, userId: scope.userId } },
    });

    if (existing) {
      return { liked: true, reaction: existing };
    }

    await this.prisma.$transaction([
      this.prisma.postReaction.create({
        data: { postId: id, userId: scope.userId, type },
      }),
      this.prisma.post.update({ where: { id }, data: { likeCount: { increment: 1 } } }),
    ]);
    return { liked: true };
  }

  async unreact(id: string, scope: AuthScope) {
    await this.assertInteractive(id, scope);
    const existing = await this.prisma.postReaction.findUnique({
      where: { postId_userId: { postId: id, userId: scope.userId } },
    });
    if (!existing) return { liked: false };
    await this.prisma.$transaction([
      this.prisma.postReaction.deleteMany({
        where: { postId: id, userId: scope.userId },
      }),
      this.prisma.post.update({ where: { id }, data: { likeCount: { decrement: 1 } } }),
    ]);
    return { liked: false };
  }

  async share(id: string, scope: AuthScope) {
    await this.assertInteractive(id, scope);
    const existing = await this.prisma.postShare.findUnique({
      where: { postId_sharedById: { postId: id, sharedById: scope.userId } },
    });
    if (existing) {
      return { shared: true };
    }
    await this.prisma.$transaction([
      this.prisma.postShare.create({
        data: { postId: id, sharedById: scope.userId },
      }),
      this.prisma.post.update({ where: { id }, data: { shareCount: { increment: 1 } } }),
    ]);
    return { shared: true };
  }

  async save(id: string, scope: AuthScope) {
    await this.assertInteractive(id, scope);
    const existing = await this.prisma.savedPost.findUnique({
      where: { postId_userId: { postId: id, userId: scope.userId } },
    });
    if (existing) {
      return { saved: true };
    }
    await this.prisma.savedPost.create({
      data: { postId: id, userId: scope.userId },
    });
    return { saved: true };
  }

  async unsave(id: string, scope: AuthScope) {
    await this.assertInteractive(id, scope);
    await this.prisma.savedPost.deleteMany({
      where: { postId: id, userId: scope.userId },
    });
    return { saved: false };
  }

  async listSaved(scope: AuthScope, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId: scope.userId,
      post: { deletedAt: null, status: 'published' },
    };

    const [saved, total] = await Promise.all([
      this.prisma.savedPost.findMany({
        where,
        skip,
        take: limit,
        include: { post: { include: this.includeForViewer(scope.userId) } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.savedPost.count({ where }),
    ]);

    return {
      data: saved.map((s) => this.withViewerState(s.post)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async setPinned(id: string, scope: AuthScope, pinned: boolean) {
    assertAdmin(scope);
    await this.findOne(id, scope);
    return this.prisma.post.update({
      where: { id },
      data: { isPinned: pinned, pinnedAt: pinned ? new Date() : null },
      include: this.postInclude,
    });
  }

  async setCommentsLocked(id: string, scope: AuthScope, locked: boolean) {
    assertAdmin(scope);
    await this.findOne(id, scope);
    return this.prisma.post.update({
      where: { id },
      data: { commentsLocked: locked },
      include: this.postInclude,
    });
  }

  async setHidden(id: string, scope: AuthScope, hidden: boolean) {
    assertAdmin(scope);
    const post = await this.prisma.post.findFirst({ where: { id, deletedAt: null } });
    requirePostOrThrow(post, 'Posting tidak ditemukan');
    return this.prisma.post.update({
      where: { id },
      data: { status: hidden ? 'hidden' : 'published' },
      include: this.postInclude,
    });
  }

  async votePoll(postId: string, optionId: string, scope: AuthScope) {
    await this.assertInteractive(postId, scope);
    const poll = await this.prisma.poll.findUnique({
      where: { postId },
      include: { options: { select: { id: true } } },
    });
    if (!poll) throw new ForbiddenException('Polling tidak ditemukan');
    if (poll.expiresAt && poll.expiresAt < new Date()) {
      throw new ForbiddenException('Polling sudah berakhir');
    }
    if (!poll.options.some((option) => option.id === optionId)) {
      throw new ForbiddenException('Pilihan polling tidak valid');
    }
    const existing = await this.prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId: poll.id, userId: scope.userId } },
    });
    if (existing?.optionId === optionId) return { voted: true, optionId };

    await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.pollOption.update({
          where: { id: existing.optionId },
          data: { voteCount: { decrement: 1 } },
        });
        await tx.pollVote.update({ where: { id: existing.id }, data: { optionId } });
      } else {
        await tx.pollVote.create({ data: { pollId: poll.id, optionId, userId: scope.userId } });
      }
      await tx.pollOption.update({
        where: { id: optionId },
        data: { voteCount: { increment: 1 } },
      });
    });
    return { voted: true, optionId };
  }

  async analytics(scope: AuthScope) {
    assertAdmin(scope);
    const [
      totalPosts,
      publishedPosts,
      hiddenPosts,
      totalComments,
      totalReactions,
      totalReports,
      pendingReports,
      totals,
    ] = await Promise.all([
      this.prisma.post.count({ where: { deletedAt: null } }),
      this.prisma.post.count({ where: { deletedAt: null, status: 'published' } }),
      this.prisma.post.count({ where: { deletedAt: null, status: 'hidden' } }),
      this.prisma.comment.count({ where: { deletedAt: null } }),
      this.prisma.postReaction.count(),
      this.prisma.report.count(),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.post.aggregate({
        where: { deletedAt: null },
        _sum: { likeCount: true, commentCount: true, shareCount: true, viewCount: true },
      }),
    ]);
    return {
      totalPosts,
      publishedPosts,
      hiddenPosts,
      totalComments,
      totalReactions,
      totalReports,
      pendingReports,
      engagement: totals._sum,
    };
  }
}
