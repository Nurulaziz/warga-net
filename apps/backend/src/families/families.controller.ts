import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { QueryFamilyDto } from './dto/query-family.dto';
import { UsersService } from '../users/users.service';
import { getSessionPhoneNumber } from '../common/session.util';

@ApiTags('Families')
@ApiBearerAuth()
@Controller('families')
export class FamiliesController {
  constructor(
    private readonly familiesService: FamiliesService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveScope(session: UserSession) {
    const phoneNumber = getSessionPhoneNumber(session);
    return this.usersService.resolveAuthContext(phoneNumber);
  }

  @Get()
  @ApiOperation({ summary: 'Get all families with pagination' })
  async findAll(@Query() query: QueryFamilyDto, @Session() session: UserSession) {
    const scope = await this.resolveScope(session);
    // Warga hanya melihat keluarganya sendiri
    if (!scope.isAdmin) {
      if (!scope.familyId)
        return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      return this.familiesService.findAll({ ...query, id: scope.familyId });
    }
    return this.familiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get family by ID' })
  async findOne(@Param('id') id: string, @Session() session: UserSession) {
    const scope = await this.resolveScope(session);
    if (!scope.isAdmin && id !== scope.familyId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke data keluarga ini');
    }
    return this.familiesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new family' })
  async create(@Body() dto: CreateFamilyDto, @Session() session: UserSession) {
    const scope = await this.resolveScope(session);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk menambah keluarga');
    }
    return this.familiesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update family' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFamilyDto,
    @Session() session: UserSession,
  ) {
    const scope = await this.resolveScope(session);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk mengubah data keluarga');
    }
    return this.familiesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete family (soft delete)' })
  async remove(@Param('id') id: string, @Session() session: UserSession) {
    const scope = await this.resolveScope(session);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk menghapus data keluarga');
    }
    return this.familiesService.remove(id);
  }
}
