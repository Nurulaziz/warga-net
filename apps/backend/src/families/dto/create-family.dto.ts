import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFamilyDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  headOfFamily!: string;

  @ApiProperty({ example: 'Jl. Mawar No. 5' })
  @IsString()
  address!: string;

  @ApiProperty({ required: false, description: 'Default dari system settings jika kosong' })
  @IsOptional()
  @IsString()
  housingComplex?: string;

  @ApiProperty({ required: false, description: 'Default dari system settings jika kosong' })
  @IsOptional()
  @IsString()
  rt?: string;

  @ApiProperty({ required: false, description: 'Default dari system settings jika kosong' })
  @IsOptional()
  @IsString()
  rw?: string;
}
