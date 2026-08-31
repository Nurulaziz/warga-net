import { IsIn, IsNumberString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryPostDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiProperty({
    required: false,
    enum: ['latest', 'trending', 'pinned'],
    description: 'Urutan feed',
  })
  @IsOptional()
  @IsIn(['latest', 'trending', 'pinned'])
  sort?: string;
}
