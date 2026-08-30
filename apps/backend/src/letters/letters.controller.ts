import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { LettersService } from './letters.service';
import { UsersService } from '../users/users.service';
import { getSessionPhoneNumber } from '../common/session.util';

interface AuthScope {
  userId: string;
  roleName: string;
  familyId: string | null;
  isAdmin: boolean;
}

@ApiTags('Letters')
@Controller('letters')
export class LettersController {
  constructor(
    private readonly lettersService: LettersService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveScope(session: UserSession): Promise<AuthScope> {
    const phoneNumber = getSessionPhoneNumber(session);
    return this.usersService.resolveAuthContext(phoneNumber);
  }

  private async assertAdmin(session: UserSession): Promise<AuthScope> {
    const scope = await this.resolveScope(session);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk aksi ini');
    }
    return scope;
  }

  // Warga hanya boleh mengakses surat milik keluarganya sendiri (atau yang dibuatnya).
  private async assertCanAccess(scope: AuthScope, letterId: string) {
    if (scope.isAdmin) return;
    const letter = await this.lettersService.findOneLetter(letterId);
    const ownerFamilyId = await this.lettersService.getResidentFamilyId(letter.residentId);
    const owned =
      letter.createdBy === scope.userId || (!!scope.familyId && ownerFamilyId === scope.familyId);
    if (!owned) {
      throw new ForbiddenException('Anda hanya dapat mengakses surat milik keluarga Anda');
    }
  }

  // === Templates ===

  @Get('templates')
  @ApiOperation({ summary: 'Get all letter templates (authenticated)' })
  async findAllTemplates(@Session() session: UserSession) {
    await this.resolveScope(session);
    return this.lettersService.findAllTemplates();
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create letter template (admin only)' })
  async createTemplate(
    @Body() body: { name: string; type: string; content: string; description?: string },
    @Session() session: UserSession,
  ) {
    await this.assertAdmin(session);
    return this.lettersService.createTemplate(body);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update letter template (admin only)' })
  async updateTemplate(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      type?: string;
      content?: string;
      description?: string;
      isActive?: boolean;
    },
    @Session() session: UserSession,
  ) {
    await this.assertAdmin(session);
    return this.lettersService.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Deactivate letter template (admin only)' })
  async deleteTemplate(@Param('id') id: string, @Session() session: UserSession) {
    await this.assertAdmin(session);
    return this.lettersService.deleteTemplate(id);
  }

  // === Letters ===

  @Get()
  @ApiOperation({ summary: 'Get letters (warga: hanya surat keluarganya sendiri)' })
  async findAllLetters(
    @Session() session: UserSession,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('templateId') templateId?: string,
  ) {
    const scope = await this.resolveScope(session);
    return this.lettersService.findAllLetters({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      templateId,
      familyId: scope.isAdmin ? undefined : scope.familyId || undefined,
      userId: scope.isAdmin ? undefined : scope.userId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get letter by ID (warga: hanya miliknya)' })
  async findOne(@Param('id') id: string, @Session() session: UserSession) {
    const scope = await this.resolveScope(session);
    await this.assertCanAccess(scope, id);
    return this.lettersService.findOneLetter(id);
  }

  @Get(':id/html')
  @ApiOperation({ summary: 'Get letter as printable HTML (warga: hanya miliknya)' })
  async getHtml(@Param('id') id: string, @Session() session: UserSession, @Res() res: any) {
    const scope = await this.resolveScope(session);
    await this.assertCanAccess(scope, id);
    const html = await this.lettersService.getLetterHtml(id);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Post()
  @ApiOperation({
    summary: 'Generate a letter from template (warga: hanya untuk warga di keluarganya)',
  })
  async generate(
    @Body()
    body: {
      templateId: string;
      residentId?: string;
      recipientName: string;
      purpose?: string;
      variables?: Record<string, string>;
      createdBy?: string;
    },
    @Session() session: UserSession,
  ) {
    const scope = await this.resolveScope(session);

    if (!scope.isAdmin) {
      if (!body.residentId) {
        throw new ForbiddenException('Pilih warga dari keluarga Anda terlebih dahulu');
      }
      const residentFamilyId = await this.lettersService.getResidentFamilyId(body.residentId);
      if (!scope.familyId || residentFamilyId !== scope.familyId) {
        throw new ForbiddenException('Anda hanya dapat membuat surat untuk warga di keluarga Anda');
      }
      // Paksa nama penerima sesuai data warga (anti-tamper)
      const resident = await this.lettersService.getResident(body.residentId);
      if (resident) body.recipientName = resident.fullName;
    }

    return this.lettersService.generateLetter({ ...body, createdBy: scope.userId });
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update letter status (admin only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Session() session: UserSession,
  ) {
    await this.assertAdmin(session);
    return this.lettersService.updateLetterStatus(id, body.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete letter (admin only)' })
  async remove(@Param('id') id: string, @Session() session: UserSession) {
    await this.assertAdmin(session);
    return this.lettersService.deleteLetter(id);
  }
}
