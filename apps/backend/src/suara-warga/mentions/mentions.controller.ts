import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { UsersService } from '../../users/users.service';
import { getSessionPhoneNumber } from '../../common/session.util';
import { MentionsService } from './mentions.service';
import { resolvePostScope } from '../common/scope.helper';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Suara Warga - Mentions')
@Controller('mentions')
export class MentionsController {
  constructor(
    private readonly mentionsService: MentionsService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete warga untuk mention (scope RT)' })
  async autocomplete(@Session() session: UserSession, @Query('q') q = '') {
    const phoneNumber = getSessionPhoneNumber(session);
    const ctx = await this.usersService.resolveAuthContext(phoneNumber);
    const scope = await resolvePostScope(this.prisma, ctx);
    return this.mentionsService.autocomplete(q, scope);
  }
}
