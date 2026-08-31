import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { UsersService } from '../../users/users.service';
import { getSessionPhoneNumber } from '../../common/session.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CommentsService } from './comments.service';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { resolvePostScope } from '../common/scope.helper';

@ApiTags('Suara Warga - Comments')
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveScope(session: UserSession) {
    const phoneNumber = getSessionPhoneNumber(session);
    const ctx = await this.usersService.resolveAuthContext(phoneNumber);
    return resolvePostScope(this.prisma, ctx);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit komentar (owner)' })
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    const scope = await this.resolveScope(session);
    return this.commentsService.update(id, scope, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus komentar (owner/admin)' })
  async remove(@Session() session: UserSession, @Param('id') id: string) {
    const scope = await this.resolveScope(session);
    return this.commentsService.remove(id, scope);
  }
}
