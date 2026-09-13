import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeHtml } from '../common/sanitize';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(query: { page?: number; limit?: number; published?: boolean; scope?: string }) {
    const { page = 1, limit = 20, published, scope } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (published !== undefined) where.isPublished = published;
    if (scope) where.targetScope = scope;

    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) throw new NotFoundException('Pengumuman tidak ditemukan');
    return announcement;
  }

  async create(data: {
    title: string;
    content: string;
    priority?: string;
    targetScope?: string;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    isPublished?: boolean;
    createdBy?: string;
  }) {
    const announcement = await this.prisma.announcement.create({
      data: {
        ...data,
        title: sanitizeHtml(data.title),
        content: sanitizeHtml(data.content),
        publishedAt: data.isPublished !== false ? new Date() : null,
      },
    });
    if (announcement.isPublished) {
      await this.notifyPublished(announcement);
    }
    return announcement;
  }

  async update(
    id: string,
    data: {
      title?: string;
      content?: string;
      priority?: string;
      targetScope?: string;
      attachmentUrl?: string | null;
      attachmentName?: string | null;
      isPublished?: boolean;
    },
  ) {
    await this.findOne(id);

    const updateData: Record<string, unknown> = { ...data };
    if (data.title) updateData.title = sanitizeHtml(data.title);
    if (data.content) updateData.content = sanitizeHtml(data.content);
    if (data.isPublished === true) {
      updateData.publishedAt = new Date();
    }

    const announcement = await this.prisma.announcement.update({ where: { id }, data: updateData });
    if (data.isPublished === true) {
      await this.notifyPublished(announcement);
    }
    return announcement;
  }

  private async notifyPublished(announcement: { id: string; title: string; targetScope: string }) {
    try {
      await this.notifications.notifyAudience(
        {
          type: 'announcement_published',
          title: 'Pengumuman baru',
          message: announcement.title,
          referenceType: 'announcement',
          referenceId: announcement.id,
        },
        announcement.targetScope === 'pengurus',
      );
    } catch {
      // Notifikasi tidak boleh menggagalkan penerbitan pengumuman.
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.announcement.delete({ where: { id } });
  }
}
