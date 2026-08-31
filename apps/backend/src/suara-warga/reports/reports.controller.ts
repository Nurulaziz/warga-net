import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { getSessionPhoneNumber } from '../../common/session.util';
import { resolvePostScope } from '../common/scope.helper';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { ReportsService } from './reports.service';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Suara Warga - Moderation')
@Controller()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveScope(session: UserSession) {
    const ctx = await this.usersService.resolveAuthContext(getSessionPhoneNumber(session));
    return resolvePostScope(this.prisma, ctx);
  }

  @Post('posts/:id/report')
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Laporkan posting' })
  async reportPost(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.reportPost(id, await this.resolveScope(session), dto);
  }

  @Post('comments/:id/report')
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Laporkan komentar' })
  async reportComment(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.reportComment(id, await this.resolveScope(session), dto);
  }

  @Get('post-reports')
  @ApiOperation({ summary: 'Antrean laporan (admin)' })
  async findAll(@Session() session: UserSession, @Query() query: QueryReportDto) {
    return this.reportsService.findAll(await this.resolveScope(session), {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
      status: query.status,
    });
  }

  @Patch('post-reports/:id')
  @ApiOperation({ summary: 'Ubah status laporan (admin)' })
  async resolve(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolve(id, await this.resolveScope(session), dto.status);
  }
}
