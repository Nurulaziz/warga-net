import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { UsersService } from '../../users/users.service';
import { getSessionPhoneNumber } from '../../common/session.util';
import { Throttle } from '@nestjs/throttler';

const POST_MEDIA_UPLOAD_DIR = join(process.cwd(), 'uploads', 'posts');

if (!existsSync(POST_MEDIA_UPLOAD_DIR)) {
  mkdirSync(POST_MEDIA_UPLOAD_DIR, { recursive: true });
}

@ApiTags('Suara Warga - Media')
@Controller('posts')
export class MediaController {
  constructor(private readonly usersService: UsersService) {}

  @Post('media')
  @Throttle({ medium: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Upload gambar posting (5MB, JPG/PNG/WebP)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: POST_MEDIA_UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|webp)$/i;
        const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp']);
        if (!allowed.test(extname(file.originalname)) || !allowedMime.has(file.mimetype)) {
          cb(new BadRequestException('Hanya gambar JPG, PNG, atau WebP yang diperbolehkan'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(@Session() session: UserSession, @UploadedFile() file?: Express.Multer.File) {
    // Pastikan sesi valid (auth) sebelum upload
    await this.usersService.resolveAuthContext(getSessionPhoneNumber(session));

    if (!file) {
      throw new BadRequestException('File wajib diupload');
    }
    return {
      url: `/uploads/posts/${file.filename}`,
      name: file.originalname,
      size: file.size,
    };
  }
}
