import { IsIn, IsNumberString, IsOptional } from 'class-validator';

export class QueryReportDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsIn(['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'])
  status?: string;
}
