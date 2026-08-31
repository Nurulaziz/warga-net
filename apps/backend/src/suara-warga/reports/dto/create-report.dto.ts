import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({
    enum: ['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'MISINFORMATION', 'FRAUD', 'OTHER'],
  })
  @IsIn(['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'MISINFORMATION', 'FRAUD', 'OTHER'])
  reason!: string;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
