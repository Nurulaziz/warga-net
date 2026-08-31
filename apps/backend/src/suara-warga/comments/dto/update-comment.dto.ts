import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Isi komentar yang sudah diperbarui' })
  @IsString()
  @IsNotEmpty({ message: 'Isi komentar tidak boleh kosong' })
  @MaxLength(1000, { message: 'Komentar maksimal 1000 karakter' })
  content!: string;
}
