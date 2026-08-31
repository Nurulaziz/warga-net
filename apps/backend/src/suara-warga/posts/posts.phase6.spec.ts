import { ForbiddenException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PostsService fase 6', () => {
  const scope = {
    userId: 'user-1',
    roleName: 'WARGA',
    familyId: 'family-1',
    isAdmin: false,
    rt: '04',
  };

  function createService() {
    const tx = {
      pollOption: { update: jest.fn() },
      pollVote: { create: jest.fn(), update: jest.fn() },
    };
    const prisma = {
      post: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'post-1',
            authorId: 'user-2',
            status: 'published',
            author: { family: { rt: '04' } },
            reactions: [],
            savedBy: [],
          })
          .mockResolvedValueOnce({ author: { family: { rt: '04' } } }),
      },
      poll: { findUnique: jest.fn() },
      pollVote: { findUnique: jest.fn() },
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx)),
    };
    return { service: new PostsService(prisma as unknown as PrismaService), prisma, tx };
  }

  it('membuat vote baru dan menaikkan counter pilihan', async () => {
    const { service, prisma, tx } = createService();
    prisma.poll.findUnique.mockResolvedValue({
      id: 'poll-1',
      expiresAt: null,
      options: [{ id: 'option-1' }, { id: 'option-2' }],
    });
    prisma.pollVote.findUnique.mockResolvedValue(null);

    await expect(service.votePoll('post-1', 'option-2', scope)).resolves.toEqual({
      voted: true,
      optionId: 'option-2',
    });
    expect(tx.pollVote.create).toHaveBeenCalledWith({
      data: { pollId: 'poll-1', optionId: 'option-2', userId: 'user-1' },
    });
    expect(tx.pollOption.update).toHaveBeenCalledWith({
      where: { id: 'option-2' },
      data: { voteCount: { increment: 1 } },
    });
  });

  it('menolak pilihan yang bukan milik polling', async () => {
    const { service, prisma } = createService();
    prisma.poll.findUnique.mockResolvedValue({
      id: 'poll-1',
      expiresAt: null,
      options: [{ id: 'option-1' }],
    });
    await expect(service.votePoll('post-1', 'option-lain', scope)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('menolak vote pada polling kedaluwarsa', async () => {
    const { service, prisma } = createService();
    prisma.poll.findUnique.mockResolvedValue({
      id: 'poll-1',
      expiresAt: new Date('2020-01-01'),
      options: [{ id: 'option-1' }],
    });
    await expect(service.votePoll('post-1', 'option-1', scope)).rejects.toThrow(
      'Polling sudah berakhir',
    );
  });
});
