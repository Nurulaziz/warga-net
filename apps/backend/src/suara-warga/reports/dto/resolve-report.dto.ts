import { IsIn } from 'class-validator';

export class ResolveReportDto {
  @IsIn(['REVIEWING', 'RESOLVED', 'DISMISSED'])
  status!: string;
}
