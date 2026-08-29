import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { QueryFamilyDto } from './dto/query-family.dto';

@Injectable()
export class FamiliesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async findAll(query: QueryFamilyDto & { id?: string }) {
    const { page = 1, limit = 20, search, id } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    // Scoping: batasi ke satu keluarga tertentu (untuk warga)
    if (id) {
      where.id = id;
    }

    if (search) {
      where.OR = [
        { headOfFamily: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.family.findMany({
        where,
        skip,
        take: limit,
        include: { _count: { select: { residents: true, users: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.family.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const family = await this.prisma.family.findFirst({
      where: { id, deletedAt: null },
      include: { residents: true, users: true },
    });

    if (!family) {
      throw new NotFoundException('Keluarga tidak ditemukan');
    }

    return family;
  }

  async create(dto: CreateFamilyDto) {
    // Isi default dari settings jika tidak diisi
    if (!dto.housingComplex || !dto.rt || !dto.rw) {
      const settings = await this.settingsService.findAll('rt_info');
      const map: Record<string, string> = {};
      for (const s of settings) map[s.key] = s.value;

      if (!dto.housingComplex) dto.housingComplex = map['housing_complex'] || '';
      if (!dto.rt) dto.rt = (map['rt_name'] || '04').replace(/\D/g, '');
      if (!dto.rw) dto.rw = (map['rw_name'] || '010').replace(/\D/g, '');
    }

    return this.prisma.family.create({ data: dto });
  }

  async update(id: string, dto: UpdateFamilyDto) {
    await this.findOne(id);
    return this.prisma.family.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.family.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
