import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuthScope {
  userId: string;
  roleName: string;
  familyId: string | null;
  isAdmin: boolean;
  rt: string | null;
}

/**
 * Resolve otorisasi + scope RT untuk fitur Suara Warga.
 * Berbasis resolveAuthContext (UsersService) + lookup family utk mendapat RT.
 */
export async function resolvePostScope(
  prisma: PrismaService,
  scope: { userId: string; roleName: string; familyId: string | null; isAdmin: boolean },
): Promise<AuthScope> {
  let rt: string | null = null;
  if (scope.familyId) {
    const family = await prisma.family.findFirst({
      where: { id: scope.familyId, deletedAt: null },
      select: { rt: true },
    });
    rt = family?.rt ?? null;
  }
  return { ...scope, rt };
}

export function assertCanModify(scope: { userId: string; isAdmin: boolean }, authorId: string) {
  if (scope.isAdmin || scope.userId === authorId) return;
  throw new ForbiddenException('Anda hanya dapat mengubah posting milik Anda sendiri');
}

export function assertAdmin(scope: { isAdmin: boolean }) {
  if (scope.isAdmin) return;
  throw new ForbiddenException('Anda tidak memiliki izin untuk aksi ini');
}

export function requirePostOrThrow<T>(post: T | null, message = 'Posting tidak ditemukan'): T {
  if (!post) throw new NotFoundException(message);
  return post;
}
