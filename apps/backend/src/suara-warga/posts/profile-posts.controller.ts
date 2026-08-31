import { Controller, Get, Param, Query } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { getSessionPhoneNumber } from '../../common/session.util';
import { resolvePostScope } from '../common/scope.helper';
import { PostsService } from './posts.service';

@Controller('users')
export class ProfilePostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':id/posts')
  async findByAuthor(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const context = await this.usersService.resolveAuthContext(getSessionPhoneNumber(session));
    const scope = await resolvePostScope(this.prisma, context);
    return this.postsService.findByAuthor(id, scope, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
  }
}
