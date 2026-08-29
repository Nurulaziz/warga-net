import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new role' })
  create(@Body() body: { name: string; description?: string }) {
    return this.rolesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role' })
  update(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
    return this.rolesService.update(id, body);
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Assign permissions to role' })
  assignPermissions(@Param('id') id: string, @Body() body: { permissionIds: string[] }) {
    return this.rolesService.assignPermissions(id, body.permissionIds);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
