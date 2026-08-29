import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { mapAppRoleToBetterAuth } from '../common/role-mapping';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Sinkronkan ba_user.role dengan app role (app role sumber kebenaran)
  // Efek samping — TIDAK boleh menggagalkan request pemanggil
  private async syncBetterAuthRole(phoneNumber: string, appRoleName: string) {
    try {
      const targetRole = mapAppRoleToBetterAuth(appRoleName);
      const baUser = await this.prisma.betterAuthUser.findFirst({ where: { phoneNumber } });

      // Update hanya jika berbeda, hindari write yang tidak perlu
      if (baUser && baUser.role !== targetRole) {
        await this.prisma.betterAuthUser.update({
          where: { id: baUser.id },
          data: { role: targetRole },
        });
        this.logger.log(
          `Sinkronisasi role ${phoneNumber}: ${baUser.role || 'null'} -> ${targetRole}`,
        );
      }
    } catch (error) {
      // Jangan blokir alur utama jika sinkronisasi gagal
      this.logger.warn(`Gagal sinkronisasi ba_user.role untuk ${phoneNumber}: ${error}`);
    }
  }

  // Cari user berdasarkan nomor telepon, return dengan role dan permissions
  async findByPhoneNumber(phoneNumber: string) {
    const user = await this.prisma.user.findFirst({
      where: { phoneNumber, deletedAt: null },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Sinkronkan ba_user.role dengan app role setiap kali user diakses (self-healing)
    await this.syncBetterAuthRole(user.phoneNumber, user.role.name);

    // Format permissions sebagai matrix
    const permissions: Record<string, Record<string, boolean>> = {};
    for (const rp of user.role.permissions) {
      const { feature, action } = rp.permission;
      if (!permissions[feature]) {
        permissions[feature] = {};
      }
      permissions[feature][action] = true;
    }

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      isActive: user.isActive,
      familyId: user.familyId,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
      permissions,
    };
  }

  // Resolusi user aplikasi (id, role, familyId) dari nomor telepon session.
  // Dipakai untuk scoping data per-keluarga pada endpoint lain.
  async resolveAuthContext(phoneNumber: string) {
    const user = await this.prisma.user.findFirst({
      where: { phoneNumber, deletedAt: null },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const roleName = (user.role.name || '').toUpperCase();
    const isAdmin = roleName === 'SUPER_ADMIN' || roleName.startsWith('ADMIN');

    return {
      userId: user.id,
      roleName: user.role.name,
      familyId: user.familyId,
      isAdmin,
    };
  }

  async findAll(query: QueryUserDto) {
    const { page = 1, limit = 20, search, roleId } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
      ];
    }

    if (roleId) {
      where.roleId = roleId;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true, family: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    // Cek duplikat nomor telepon
    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existing) {
      throw new ConflictException('Nomor telepon sudah terdaftar');
    }

    const user = await this.prisma.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        fullName: dto.fullName,
        roleId: dto.roleId,
        familyId: dto.familyId,
        isActive: dto.isActive ?? true,
      },
      include: { role: true },
    });

    // Sinkronkan ba_user.role jika user sudah pernah login (ba_user ada)
    await this.syncBetterAuthRole(user.phoneNumber, user.role.name);

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    // Cek duplikat nomor telepon jika diubah
    if (dto.phoneNumber) {
      const existing = await this.prisma.user.findFirst({
        where: { phoneNumber: dto.phoneNumber, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Nomor telepon sudah terdaftar');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: { role: true },
    });

    // Sinkronkan ba_user.role setelah perubahan (mis. admin ganti role user)
    await this.syncBetterAuthRole(user.phoneNumber, user.role.name);

    return user;
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
