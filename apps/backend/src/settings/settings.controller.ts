import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { SettingsService } from './settings.service';

// Folder upload logos
const LOGO_UPLOAD_DIR = join(process.cwd(), 'uploads', 'logos');

// Pastikan folder ada
if (!existsSync(LOGO_UPLOAD_DIR)) {
  mkdirSync(LOGO_UPLOAD_DIR, { recursive: true });
}

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get all settings or by group' })
  findAll(@Query('group') group?: string) {
    return this.settingsService.findAll(group);
  }

  @Put()
  @ApiOperation({ summary: 'Update settings (batch)' })
  update(
    @Body() body: { settings: { key: string; value: string; label?: string; group?: string }[] },
  ) {
    return this.settingsService.updateBatch(body.settings);
  }

  @Post('logo')
  @ApiOperation({ summary: 'Upload logo (app_logo atau gov_logo)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: LOGO_UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|svg|webp)$/i;
        if (!allowed.test(extname(file.originalname))) {
          cb(
            new BadRequestException('Hanya file gambar (JPG, PNG, SVG, WebP) yang diperbolehkan'),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File, @Body('type') type: string) {
    if (!file) {
      throw new BadRequestException('File wajib diupload');
    }

    if (!['app_logo', 'gov_logo'].includes(type)) {
      throw new BadRequestException('Type harus app_logo atau gov_logo');
    }

    // URL relatif untuk akses file
    const url = `/uploads/logos/${file.filename}`;
    const settingKey = type === 'app_logo' ? 'app_logo_url' : 'gov_logo_url';

    // Simpan URL ke settings
    await this.settingsService.updateBatch([
      {
        key: settingKey,
        value: url,
        label: type === 'app_logo' ? 'Logo Aplikasi' : 'Logo Pemerintah',
        group: 'branding',
      },
    ]);

    return { url, filename: file.filename };
  }
}
