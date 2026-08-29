import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: '+6281234567890' })
  @IsString()
  @Matches(/^\+62\d{9,13}$/, { message: 'Format: +62xxxxxxxxxxx' })
  phoneNumber!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: 'role-uuid' })
  @IsString()
  roleId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  familyId?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
