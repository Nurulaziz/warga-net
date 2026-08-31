import { IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReactionDto {
  @ApiProperty({ example: 'LIKE', enum: ['LIKE', 'LOVE', 'HAHA', 'SAD', 'ANGRY'] })
  @IsOptional()
  @IsIn(['LIKE', 'LOVE', 'HAHA', 'SAD', 'ANGRY'])
  type?: string;
}
