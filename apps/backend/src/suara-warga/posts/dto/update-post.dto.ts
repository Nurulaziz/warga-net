import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Konten posting maksimal 5000 karakter' })
  content?: string;

  @ApiProperty({ enum: ['TEXT', 'IMAGE', 'POLL', 'ANNOUNCEMENT'], required: false })
  @IsOptional()
  @IsIn(['TEXT', 'IMAGE', 'POLL', 'ANNOUNCEMENT'])
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  visibility?: string;
}
