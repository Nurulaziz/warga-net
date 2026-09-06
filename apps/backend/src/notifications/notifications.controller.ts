import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { getSessionPhoneNumber } from '../common/session.util';
import { UsersService } from '../users/users.service';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService, private readonly users: UsersService) {}
  private async userId(session: UserSession) { const user = await this.users.findByPhoneNumber(getSessionPhoneNumber(session)); return user.id; }
  @Get() async list(@Session() session: UserSession, @Query('page') page?: string, @Query('limit') limit?: string) { return this.service.list(await this.userId(session), Number(page) || 1, Number(limit) || 30); }
  @Patch(':id/read') async read(@Param('id') id: string, @Session() session: UserSession) { return this.service.markRead(await this.userId(session), id); }
  @Patch('read-all') async readAll(@Session() session: UserSession) { return this.service.markAllRead(await this.userId(session)); }
}
