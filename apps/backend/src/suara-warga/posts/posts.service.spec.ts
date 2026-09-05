import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: {
    post: {
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    postReaction: {
      findUnique: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    savedPost: {
      findUnique: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    postShare: {
      findUnique: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const post = {
    id: 'post-1',
    authorId: 'user-1',
    type: 'TEXT',
    content: 'Halo warga',
    visibility: 'RT',
    status: 'published',
    isPinned: false,
    pinnedAt: null,
    pinOrder: 0,
    commentsLocked: false,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    author: { id: 'user-1', fullName: 'Budi', phoneNumber: '+62' },
  };

  const scope = {
    userId: 'user-1',
    roleName: 'WARGA',
    familyId: 'fam-1',
    isAdmin: false,
    rt: '04',
  };

  beforeEach(async () => {
    const mockPrisma = {
      post: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      postReaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      savedPost: {
        findUnique: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      postShare: {
        findUnique: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      family: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((arg: unknown) =>
        Array.isArray(arg) ? Promise.resolve(arg.map(() => null)) : Promise.resolve(null),
      ),
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('warga hanya melihat posting status published dari RT yang sama', async () => {
      prisma.post.findMany.mockResolvedValue([post]);
      prisma.post.count.mockResolvedValue(1);

      await service.findAll(scope, { page: 1, limit: 20 });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'published',
            deletedAt: null,
            OR: [
              { author: { family: { rt: '04' } } },
              { author: { role: { name: 'SUPER_ADMIN' } } },
            ],
          },
        }),
      );
    });

    it('admin melihat semua posting tanpa filter RT', async () => {
      const adminScope = { ...scope, isAdmin: true };
      prisma.post.findMany.mockResolvedValue([post]);
      prisma.post.count.mockResolvedValue(0);

      await service.findAll(adminScope, { page: 1, limit: 20 });

      const arg = prisma.post.findMany.mock.calls[0][0];
      expect(arg.where.author).toBeUndefined();
      expect(arg.where.status).toBe('published');
    });
  });

  describe('create', () => {
    it('menolak konten kosong setelah sanitasi', async () => {
      await expect(
        service.create('user-1', { content: '<script>alert(1)</script>' } as never),
      ).rejects.toThrow(ForbiddenException);
    });

    it('menghapus tag script dari konten', async () => {
      prisma.post.create.mockResolvedValue(post);
      await service.create('user-1', { content: 'Halo <script>x</script> warga' } as never);
      expect(prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ content: 'Halo  warga' }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('non-owner non-admin tidak bisa menghapus posting', async () => {
      prisma.post.findFirst
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce({ author: { family: { rt: '04' } } });
      await expect(service.remove('post-1', { ...scope, userId: 'user-2' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('owner dapat soft-delete posting', async () => {
      prisma.post.findFirst
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce({ author: { family: { rt: '04' } } });
      prisma.post.update.mockResolvedValue(post);
      await service.remove('post-1', scope);
      expect(prisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
      );
    });
  });

  describe('findOne (privasi RT)', () => {
    it('warga tidak dapat membuka posting dari RT lain', async () => {
      prisma.post.findFirst
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce({ author: { family: { rt: '05' } } });
      await expect(service.findOne('post-1', { ...scope, rt: '04' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('warga dapat membuka posting dari RT yang sama', async () => {
      prisma.post.findFirst
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce({ author: { family: { rt: '04' } } });
      const result = await service.findOne('post-1', scope);
      expect(result.id).toBe('post-1');
    });
  });

  describe('interaksi sosial', () => {
    // findOne mengakses post + authorRt (2 query post.findFirst)
    function mockPostAccess() {
      prisma.post.findFirst
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce({ author: { family: { rt: '04' } } });
    }

    describe('react', () => {
      it('membuat reaksi & increment counter dalam transaction', async () => {
        mockPostAccess();
        prisma.postReaction.findUnique.mockResolvedValue(null);
        prisma.$transaction.mockImplementation(() => Promise.resolve([null, null]));

        const result = await service.react('post-1', scope, 'LIKE');

        expect(result.liked).toBe(true);
        expect(prisma.postReaction.create).toHaveBeenCalledWith({
          data: { postId: 'post-1', userId: 'user-1', type: 'LIKE' },
        });
        expect(prisma.$transaction).toHaveBeenCalled();
      });

      it('tidak duplikat jika sudah like (unique)', async () => {
        mockPostAccess();
        prisma.postReaction.findUnique.mockResolvedValue({ id: 'r-1' });

        const result = await service.react('post-1', scope, 'LIKE');

        expect(result.liked).toBe(true);
        expect(prisma.postReaction.create).not.toHaveBeenCalled();
      });

      it('unreact menghapus reaksi & decrement counter', async () => {
        mockPostAccess();
        prisma.postReaction.findUnique.mockResolvedValue({ id: 'r-1' });
        prisma.$transaction.mockImplementation(() => Promise.resolve([null, null]));
        const result = await service.unreact('post-1', scope);
        expect(result.liked).toBe(false);
        expect(prisma.postReaction.deleteMany).toHaveBeenCalledWith({
          where: { postId: 'post-1', userId: 'user-1' },
        });
      });

      it('unreact tidak mengurangi counter jika reaksi tidak ada', async () => {
        mockPostAccess();
        prisma.postReaction.findUnique.mockResolvedValue(null);
        const result = await service.unreact('post-1', scope);
        expect(result.liked).toBe(false);
        expect(prisma.postReaction.deleteMany).not.toHaveBeenCalled();
        expect(prisma.post.update).not.toHaveBeenCalled();
      });
    });

    describe('save/unsave', () => {
      it('save membuat SavedPost (upsert)', async () => {
        mockPostAccess();
        prisma.savedPost.findUnique.mockResolvedValue(null);
        const result = await service.save('post-1', scope);
        expect(result.saved).toBe(true);
        expect(prisma.savedPost.create).toHaveBeenCalledWith({
          data: { postId: 'post-1', userId: 'user-1' },
        });
      });

      it('unsave menghapus SavedPost', async () => {
        mockPostAccess();
        const result = await service.unsave('post-1', scope);
        expect(result.saved).toBe(false);
        expect(prisma.savedPost.deleteMany).toHaveBeenCalledWith({
          where: { postId: 'post-1', userId: 'user-1' },
        });
      });
    });
  });
});
