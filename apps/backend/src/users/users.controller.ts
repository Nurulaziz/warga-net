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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Session, UserSession, Roles } from '@thallesp/nestjs-better-auth';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { getSessionPhoneNumber } from '../common/session.util';
import { existsSync, mkdirSync } from 'fs';

const AVATAR_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(AVATAR_UPLOAD_DIR)) mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });

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

  @Put('me')
  updateMe(
    @Session() session: UserSession,
    @Body() body: { fullName?: string; email?: string },
  ) {
    return this.usersService.updateOwnProfile(getSessionPhoneNumber(session), body);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: AVATAR_UPLOAD_DIR,
      filename: (_request, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp']);
      callback(allowedMime.has(file.mimetype) ? null : new BadRequestException('Foto harus JPG, PNG, atau WebP'), allowedMime.has(file.mimetype));
    },
  }))
  async uploadMyAvatar(@Session() session: UserSession, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('File foto wajib dipilih');
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.usersService.updateOwnAvatar(getSessionPhoneNumber(session), avatarUrl);
    return { avatarUrl };
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
