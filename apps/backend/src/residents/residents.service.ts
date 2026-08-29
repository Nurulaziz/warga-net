import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { QueryResidentDto } from './dto/query-resident.dto';

@Injectable()
export class ResidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryResidentDto) {
    const { page = 1, limit = 20, search, familyId } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search } },
      ];
    }

    if (familyId) {
      where.familyId = familyId;
    }

    const [data, total] = await Promise.all([
      this.prisma.resident.findMany({
        where,
        skip,
        take: limit,
        include: { family: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resident.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { id, deletedAt: null },
      include: { family: true },
    });

    if (!resident) {
      throw new NotFoundException('Warga tidak ditemukan');
    }

    return resident;
  }

  async create(dto: CreateResidentDto) {
    // Cek duplikat NIK
    const existing = await this.prisma.resident.findUnique({
      where: { idNumber: dto.idNumber },
    });

    if (existing) {
      throw new ConflictException('NIK sudah terdaftar');
    }

    return this.prisma.resident.create({
      data: {
        familyId: dto.familyId,
        fullName: dto.fullName,
        idNumber: dto.idNumber,
        birthDate: new Date(dto.birthDate),
        gender: dto.gender,
        relationship: dto.relationship,
      },
      include: { family: true },
    });
  }

  async update(id: string, dto: UpdateResidentDto) {
    await this.findOne(id);

    if (dto.idNumber) {
      const existing = await this.prisma.resident.findFirst({
        where: { idNumber: dto.idNumber, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('NIK sudah terdaftar');
      }
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.birthDate) {
      data.birthDate = new Date(dto.birthDate);
    }

    return this.prisma.resident.update({
      where: { id },
      data,
      include: { family: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.resident.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
