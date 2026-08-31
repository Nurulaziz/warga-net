import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Setuju, saya ikut gotong royong!' })
  @IsString()
  @IsNotEmpty({ message: 'Isi komentar tidak boleh kosong' })
  @MaxLength(1000, { message: 'Komentar maksimal 1000 karakter' })
  content!: string;

  @ApiProperty({ required: false, description: 'ID komentar induk untuk balasan (1 level)' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
