import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    if (!role) throw new NotFoundException('Role tidak ditemukan');
    return role;
  }

  async create(data: { name: string; description?: string }) {
    const existing = await this.prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Nama role sudah digunakan');

    return this.prisma.role.create({ data });
  }

  async update(id: string, data: { name?: string; description?: string }) {
    await this.findOne(id);

    if (data.name) {
      const existing = await this.prisma.role.findFirst({
        where: { name: data.name, id: { not: id } },
      });
      if (existing) throw new ConflictException('Nama role sudah digunakan');
    }

    return this.prisma.role.update({ where: { id }, data });
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role._count.users > 0) {
      throw new ConflictException('Role masih digunakan oleh user');
    }
    return this.prisma.role.delete({ where: { id } });
  }

  // Permissions
  async findAllPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ feature: 'asc' }, { action: 'asc' }] });
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    await this.findOne(roleId);

    // Hapus semua permission lama, assign ulang
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });

    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
    });

    return this.findOne(roleId);
  }
}
