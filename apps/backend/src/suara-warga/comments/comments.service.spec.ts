import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: {
    post: { findFirst: jest.Mock; update: jest.Mock };
    comment: {
      findMany: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const scope = {
    userId: 'user-1',
    roleName: 'WARGA',
    familyId: 'fam-1',
    isAdmin: false,
    rt: '04',
  };
  const post = {
    id: 'post-1',
    status: 'published',
    commentsLocked: false,
    author: { family: { rt: '04' } },
  };

  beforeEach(async () => {
    const mockPrisma = {
      post: { findFirst: jest.fn(), update: jest.fn() },
      comment: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((arg: unknown) =>
        Array.isArray(arg) ? Promise.resolve(arg.map(() => null)) : Promise.resolve(null),
      ),
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('warga tidak dapat berkomentar di posting RT lain', async () => {
      prisma.post.findFirst.mockResolvedValue({
        ...post,
        author: { family: { rt: '05' } },
      });
      await expect(service.create('post-1', scope, { content: 'halo' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('menolak komentar saat commentsLocked', async () => {
      prisma.post.findFirst.mockResolvedValue({ ...post, commentsLocked: true });
      await expect(service.create('post-1', scope, { content: 'halo' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('membuat komentar & increment commentCount (tanpa parent)', async () => {
      prisma.post.findFirst.mockResolvedValue(post);
      prisma.comment.create.mockResolvedValue({ id: 'c-1' });
      prisma.post.findFirst.mockResolvedValueOnce(post);

      await service.create('post-1', scope, { content: 'Halo warga' });

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: { postId: 'post-1', authorId: 'user-1', content: 'Halo warga', parentId: undefined },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('menolak parent yang bukan komentar akar (max depth 1)', async () => {
      prisma.post.findFirst.mockResolvedValueOnce(post).mockResolvedValueOnce(post); // query parent
      prisma.comment.findFirst.mockResolvedValue(null);
      await expect(
        service.create('post-1', scope, { content: 'balasan', parentId: 'x' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('non-owner tidak bisa mengedit komentar', async () => {
      prisma.comment.findFirst.mockResolvedValue({ id: 'c-1', authorId: 'user-2' });
      await expect(
        service.update('c-1', { ...scope, userId: 'user-1' }, { content: 'x' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('owner dapat mengedit komentar', async () => {
      prisma.comment.findFirst.mockResolvedValue({ id: 'c-1', authorId: 'user-1' });
      prisma.comment.update.mockResolvedValue({ id: 'c-1' });
      await service.update('c-1', scope, { content: 'edit' });
      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'c-1' },
        data: { content: 'edit' },
      });
    });
  });

  describe('remove', () => {
    it('warga non-owner tidak bisa menghapus komentar', async () => {
      prisma.comment.findFirst.mockResolvedValue({
        id: 'c-1',
        authorId: 'user-2',
        postId: 'post-1',
      });
      await expect(service.remove('c-1', scope)).rejects.toThrow(ForbiddenException);
    });

    it('pemilik komentar tetap tidak dapat menghapus tanpa role admin', async () => {
      prisma.comment.findFirst.mockResolvedValue({
        id: 'c-1',
        authorId: 'user-1',
        postId: 'post-1',
      });
      await expect(service.remove('c-1', scope)).rejects.toThrow(ForbiddenException);
    });

    it('admin dapat menghapus komentar orang lain', async () => {
      prisma.comment.findFirst.mockResolvedValue({
        id: 'c-1',
        authorId: 'user-2',
        postId: 'post-1',
      });
      prisma.$transaction.mockImplementation(() => Promise.resolve([null, null]));
      const result = await service.remove('c-1', { ...scope, isAdmin: true });
      expect(result.success).toBe(true);
    });
  });
});
