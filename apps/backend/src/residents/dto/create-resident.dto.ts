import { IsString, IsDateString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateResidentDto {
  @ApiProperty({ example: 'family-uuid' })
  @IsString()
  familyId!: string;

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: '3201012345670001' })
  @IsString()
  idNumber!: string;

  @ApiProperty({ example: '1990-01-15' })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ example: 'Laki-laki' })
  @IsString()
  gender!: string;

  @ApiProperty({ example: 'Kepala Keluarga' })
  @IsString()
  relationship!: string;

  @ApiProperty({ required: false, description: 'Buat keluarga baru dari warga ini' })
  @IsOptional()
  @IsBoolean()
  createFamily?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  familyAddress?: string;
}
