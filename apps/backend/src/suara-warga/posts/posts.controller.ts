import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { UsersService } from '../../users/users.service';
import { getSessionPhoneNumber } from '../../common/session.util';
import { PostsService } from './posts.service';
import { CommentsService } from '../comments/comments.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { ReactionDto } from './dto/reaction.dto';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { resolvePostScope } from '../common/scope.helper';
import { PrismaService } from '../../prisma/prisma.service';
import { VotePollDto } from './dto/vote-poll.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Suara Warga - Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveScope(session: UserSession) {
    const phoneNumber = getSessionPhoneNumber(session);
    const ctx = await this.usersService.resolveAuthContext(phoneNumber);
    return resolvePostScope(this.prisma, ctx);
  }

  @Get()
  @ApiOperation({ summary: 'Feed posting (scope RT)' })
  async findAll(@Session() session: UserSession, @Query() query: QueryPostDto) {
    const scope = await this.resolveScope(session);
    return this.postsService.findAll(scope, {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      sort: query.sort,
    });
  }

  // Wajib dideklarasikan sebelum @Get(':id') agar '/saved' tidak dianggap id.
  @Get('saved')
  @ApiOperation({ summary: 'Daftar posting yang disimpan' })
  async listSaved(
    @Session() session: UserSession,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const scope = await this.resolveScope(session);
    return this.postsService.listSaved(scope, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Ringkasan analytics Suara Warga (admin)' })
  async analytics(@Session() session: UserSession) {
    return this.postsService.analytics(await this.resolveScope(session));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail posting' })
  async findOne(@Session() session: UserSession, @Param('id') id: string) {
    const scope = await this.resolveScope(session);
    return this.postsService.findOne(id, scope);
  }

  @Post()
  @Throttle({ medium: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Buat posting' })
  async create(@Session() session: UserSession, @Body() dto: CreatePostDto) {
    const scope = await this.resolveScope(session);
    return this.postsService.create(scope.userId, dto, scope.rt);
  }

  @Get('hashtags/:tag')
  @ApiOperation({ summary: 'Cari posting per hashtag (scope RT)' })
  async findByHashtag(
    @Session() session: UserSession,
    @Param('tag') tag: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const scope = await this.resolveScope(session);
    return this.postsService.findByHashtag(tag, scope, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update posting (owner/admin)' })
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    const scope = await this.resolveScope(session);
    return this.postsService.update(id, scope, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus posting (owner/admin, soft delete)' })
  async remove(@Session() session: UserSession, @Param('id') id: string) {
    const scope = await this.resolveScope(session);
    return this.postsService.remove(id, scope);
  }

  // ==== Reactions ====

  @Post(':id/reactions')
  @Throttle({ medium: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Sukai/reaksi posting (upsert, unique)' })
  async react(@Session() session: UserSession, @Param('id') id: string, @Body() dto: ReactionDto) {
    const scope = await this.resolveScope(session);
    return this.postsService.react(id, scope, dto.type || 'LIKE');
  }

  @Delete(':id/reactions')
  @ApiOperation({ summary: 'Batalkan suka' })
  async unreact(@Session() session: UserSession, @Param('id') id: string) {
    const scope = await this.resolveScope(session);
    return this.postsService.unreact(id, scope);
  }

  @Post(':id/poll/vote')
  @ApiOperation({ summary: 'Pilih atau ubah pilihan polling' })
  async votePoll(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: VotePollDto,
  ) {
    return this.postsService.votePoll(id, dto.optionId, await this.resolveScope(session));
  }

  // ==== Comments ====

  @Get(':id/comments')
  @ApiOperation({ summary: 'Daftar komentar + balasan (1 level)' })
  async listComments(@Session() session: UserSession, @Param('id') id: string) {
    const scope = await this.resolveScope(session);
    return this.commentsService.findByPost(id, scope);
  }

  @Post(':id/comments')
  @Throttle({ medium: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Buat komentar atau balasan' })
  async addComment(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    const scope = await this.resolveScope(session);
    return this.commentsService.create(id, scope, dto);
  }

  // ==== Share & Save ====

  @Post(':id/share')
  @ApiOperation({ summary: 'Bagikan posting (internal, unique)' })
  async share(@Session() session: UserSession, @Param('id') id: string) {
    const scope = await this.resolveScope(session);
    return this.postsService.share(id, scope);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Simpan posting (upsert)' })
  async save(@Session() session: UserSession, @Param('id') id: string) {
    const scope = await this.resolveScope(session);
    return this.postsService.save(id, scope);
  }

  @Delete(':id/save')
  @ApiOperation({ summary: 'Batal simpan' })
  async unsave(@Session() session: UserSession, @Param('id') id: string) {
    const scope = await this.resolveScope(session);
    return this.postsService.unsave(id, scope);
  }

  // ==== Moderasi (admin) ====

  @Post(':id/pin')
  async pin(@Session() session: UserSession, @Param('id') id: string) {
    return this.postsService.setPinned(id, await this.resolveScope(session), true);
  }

  @Delete(':id/pin')
  async unpin(@Session() session: UserSession, @Param('id') id: string) {
    return this.postsService.setPinned(id, await this.resolveScope(session), false);
  }

  @Post(':id/lock')
  async lock(@Session() session: UserSession, @Param('id') id: string) {
    return this.postsService.setCommentsLocked(id, await this.resolveScope(session), true);
  }

  @Delete(':id/lock')
  async unlock(@Session() session: UserSession, @Param('id') id: string) {
    return this.postsService.setCommentsLocked(id, await this.resolveScope(session), false);
  }

  @Post(':id/hide')
  async hide(@Session() session: UserSession, @Param('id') id: string) {
    return this.postsService.setHidden(id, await this.resolveScope(session), true);
  }

  @Delete(':id/hide')
  async unhide(@Session() session: UserSession, @Param('id') id: string) {
    return this.postsService.setHidden(id, await this.resolveScope(session), false);
  }
}
