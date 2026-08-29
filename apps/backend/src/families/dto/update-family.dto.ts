import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFamilyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  headOfFamily?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  housingComplex?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rw?: string;
}
