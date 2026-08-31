import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { AnnouncementsService } from './announcements.service';
import { UsersService } from '../users/users.service';
import { getSessionPhoneNumber } from '../common/session.util';

// Folder upload lampiran pengumuman
const ATTACHMENT_UPLOAD_DIR = join(process.cwd(), 'uploads', 'announcements');

// Pastikan folder ada
if (!existsSync(ATTACHMENT_UPLOAD_DIR)) {
  mkdirSync(ATTACHMENT_UPLOAD_DIR, { recursive: true });
}

interface AnnouncementBody {
  title: string;
  content: string;
  priority?: string;
  targetScope?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  isPublished?: boolean;
  createdBy?: string;
}

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all announcements' })
  async findAll(
    @Session() session: UserSession,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('published') published?: string,
  ) {
    const phoneNumber = getSessionPhoneNumber(session);
    const scope = await this.usersService.resolveAuthContext(phoneNumber);

    // Warga hanya melihat pengumuman yang sudah terbit & ditujukan untuk semua warga.
    // Admin bebas memfilter (termasuk draft & pengumuman khusus pengurus).
    const params = scope.isAdmin
      ? {
          published: published === 'true' ? true : published === 'false' ? false : undefined,
        }
      : { published: true, scope: 'all' };

    return this.announcementsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      ...params,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement by ID' })
  findOne(@Param('id') id: string) {
    return this.announcementsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create announcement' })
  create(@Body() body: AnnouncementBody) {
    return this.announcementsService.create(body);
  }

  @Post('attachment')
  @ApiOperation({ summary: 'Upload lampiran pengumuman (PDF/gambar)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: ATTACHMENT_UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|webp|pdf)$/i;
        if (!allowed.test(extname(file.originalname))) {
          cb(
            new BadRequestException(
              'Hanya file PDF atau gambar (JPG, PNG, WebP) yang diperbolehkan',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File wajib diupload');
    }
    return {
      url: `/uploads/announcements/${file.filename}`,
      name: file.originalname,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update announcement' })
  update(@Param('id') id: string, @Body() body: Partial<AnnouncementBody>) {
    return this.announcementsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete announcement' })
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}
