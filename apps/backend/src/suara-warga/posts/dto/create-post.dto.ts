import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PostMediaDto {
  @ApiProperty({ example: '/uploads/posts/abc.jpg' })
  @IsString()
  @IsNotEmpty({ message: 'URL media tidak boleh kosong' })
  url!: string;

  @ApiProperty({ example: 'IMAGE', enum: ['IMAGE', 'VIDEO'], required: false })
  @IsOptional()
  @IsIn(['IMAGE', 'VIDEO'])
  mediaType?: string;

  @ApiProperty({ example: 102400, required: false })
  @IsOptional()
  size?: number;
}

export class CreatePollDto {
  @ApiProperty({ example: 'Hari kerja bakti yang paling cocok?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  question!: string;

  @ApiProperty({ example: ['Sabtu', 'Minggu'] })
  @IsArray()
  @ArrayMinSize(2, { message: 'Polling minimal memiliki 2 pilihan' })
  @ArrayMaxSize(6, { message: 'Polling maksimal memiliki 6 pilihan' })
  @IsString({ each: true })
  options!: string[];
}

export class CreatePostDto {
  @ApiProperty({ example: 'TEXT', enum: ['TEXT', 'IMAGE', 'POLL', 'ANNOUNCEMENT'] })
  @IsOptional()
  @IsIn(['TEXT', 'IMAGE', 'POLL', 'ANNOUNCEMENT'])
  type?: string;

  @ApiProperty({ example: 'Halo warga, ada kegiatan gotong royong #gotongroyong', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Konten posting maksimal 5000 karakter' })
  content?: string;

  @ApiProperty({ type: [PostMediaDto], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4, { message: 'Maksimal 4 media per posting' })
  @ValidateNested({ each: true })
  @Type(() => PostMediaDto)
  media?: PostMediaDto[];

  @ApiProperty({ type: CreatePollDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll?: CreatePollDto;

  @ApiProperty({ example: 'RT', required: false })
  @IsOptional()
  @IsString()
  visibility?: string;
}
