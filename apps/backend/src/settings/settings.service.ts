import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(group?: string) {
    const where: Record<string, unknown> = {};
    if (group) where.group = group;
    return this.prisma.systemSetting.findMany({ where, orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  }

  async get(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value || null;
  }

  async updateBatch(settings: { key: string; value: string; label?: string; group?: string }[]) {
    const results = [];
    for (const setting of settings) {
      const result = await this.prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value, label: setting.label },
        create: { key: setting.key, value: setting.value, label: setting.label, group: setting.group || 'general' },
      });
      results.push(result);
    }
    return results;
  }
}
