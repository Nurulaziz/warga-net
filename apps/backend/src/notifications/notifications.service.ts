import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string, page = 1, limit = 30) {
    const skip = Math.max(0, page - 1) * Math.min(limit, 50); const take = Math.min(Math.max(limit, 1), 50);
    return Promise.all([this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip, take }), this.prisma.notification.count({ where: { userId } }), this.prisma.notification.count({ where: { userId, isRead: false } })]).then(([data, total, unread]) => ({ data, unread, meta: { total, page, limit: take, totalPages: Math.ceil(total / take) } }));
  }
  async markRead(userId: string, id: string) { const item = await this.prisma.notification.findFirst({ where: { id, userId } }); if (!item) throw new NotFoundException('Notifikasi tidak ditemukan'); return this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } }); }
  markAllRead(userId: string) { return this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } }); }
  create(data: { userId: string; type: string; title: string; message: string; referenceType?: string; referenceId?: string }) { return this.prisma.notification.create({ data }); }
  notifyFamily(familyId: string, data: Omit<Parameters<NotificationsService['create']>[0], 'userId'>) { return this.prisma.user.findMany({ where: { familyId, deletedAt: null, isActive: true }, select: { id: true } }).then((users) => Promise.all(users.map((user) => this.create({ ...data, userId: user.id })))); }
}
