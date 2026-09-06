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

    let familyId = dto.familyId;
    if (dto.createFamily) {
      const existingHead = await this.prisma.family.findFirst({
        where: { deletedAt: null, headOfFamily: { equals: dto.fullName, mode: 'insensitive' } },
      });
      if (existingHead) {
        throw new ConflictException('Keluarga dengan kepala keluarga tersebut sudah ada');
      }
      const family = await this.prisma.family.create({
        data: { headOfFamily: dto.fullName, address: dto.familyAddress || '', housingComplex: '', rt: '', rw: '' },
      });
      familyId = family.id;
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const types = await this.prisma.billType.findMany({ where: { period: 'monthly', isActive: true }, select: { id: true, amount: true, dueDay: true } });
      for (const type of types) {
        const dueDate = new Date(now.getFullYear(), now.getMonth(), Math.min(Math.max(type.dueDay || 10, 1), 28));
        await this.prisma.bill.upsert({
          where: { billTypeId_familyId_period: { billTypeId: type.id, familyId: family.id, period } },
          create: { billTypeId: type.id, familyId: family.id, amount: type.amount, dueDate, period, status: 'unpaid' },
          update: {},
        });
      }
    }
    if (!familyId) throw new ConflictException('Pilih keluarga atau buat keluarga baru');

    return this.prisma.resident.create({
      data: {
        familyId,
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
