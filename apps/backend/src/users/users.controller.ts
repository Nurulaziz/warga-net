import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Session, UserSession, Roles } from '@thallesp/nestjs-better-auth';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with role and permissions' })
  getMe(@Session() session: UserSession) {
    const phoneNumber = (session as { user: { phoneNumber?: string } }).user.phoneNumber;
    if (!phoneNumber) {
      throw new Error('Session tidak memiliki nomor telepon');
    }
    return this.usersService.findByPhoneNumber(phoneNumber);
  }

  @Get(':id/ba-id')
  @Roles(['admin'])
  @ApiOperation({ summary: 'Get BetterAuth user ID by app user ID (for impersonation)' })
  async getBetterAuthUserId(@Param('id') id: string) {
    // Cari user di tabel users
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Cari BetterAuth user berdasarkan phone number
    const baUser = await this.prisma.betterAuthUser.findFirst({
      where: { phoneNumber: user.phoneNumber },
    });

    if (!baUser) {
      throw new NotFoundException(
        'User belum pernah login, jadi belum bisa di-impersonate. Minta user login (verifikasi OTP) terlebih dahulu.',
      );
    }

    return { baUserId: baUser.id };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
