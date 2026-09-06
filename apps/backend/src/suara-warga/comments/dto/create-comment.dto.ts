import { ArrayMaxSize, ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
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

  @ApiProperty({ type: [String], required: false, description: 'ID akun yang dipilih melalui fitur tag' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  mentionedUserIds?: string[];
}
