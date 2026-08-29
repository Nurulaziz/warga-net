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
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { QueryResidentDto } from './dto/query-resident.dto';
import { UsersService } from '../users/users.service';
import { getSessionPhoneNumber } from '../common/session.util';

@ApiTags('Residents')
@ApiBearerAuth()
@Controller('residents')
export class ResidentsController {
  constructor(
    private readonly residentsService: ResidentsService,
    private readonly usersService: UsersService,
  ) {}

  // Warga hanya boleh melihat data keluarganya sendiri
  private async resolveScope(session: UserSession) {
    const phoneNumber = getSessionPhoneNumber(session);
    return this.usersService.resolveAuthContext(phoneNumber);
  }

  @Get()
  @ApiOperation({ summary: 'Get all residents with pagination' })
  async findAll(@Query() query: QueryResidentDto, @Session() session: UserSession) {
    const scope = await this.resolveScope(session);
    // Warga dipaksa hanya melihat anggota keluarganya
    if (!scope.isAdmin) {
      if (!scope.familyId)
        return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      return this.residentsService.findAll({ ...query, familyId: scope.familyId });
    }
    return this.residentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resident by ID' })
  async findOne(@Param('id') id: string, @Session() session: UserSession) {
    const scope = await this.resolveScope(session);
    const resident = await this.residentsService.findOne(id);
    if (!scope.isAdmin && resident.familyId !== scope.familyId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke data warga ini');
    }
    return resident;
  }

  @Post()
  @ApiOperation({ summary: 'Create new resident' })
  async create(@Body() dto: CreateResidentDto, @Session() session: UserSession) {
    const scope = await this.resolveScope(session);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk menambah warga');
    }
    return this.residentsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update resident' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateResidentDto,
    @Session() session: UserSession,
  ) {
    const scope = await this.resolveScope(session);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk mengubah data warga');
    }
    return this.residentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete resident (soft delete)' })
  async remove(@Param('id') id: string, @Session() session: UserSession) {
    const scope = await this.resolveScope(session);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk menghapus data warga');
    }
    return this.residentsService.remove(id);
  }
}
