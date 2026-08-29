import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExportService } from './export.service';

@ApiTags('Export')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('residents')
  @ApiOperation({ summary: 'Export residents data as CSV' })
  async exportResidents(@Res() res: any) {
    const csv = await this.exportService.exportResidentsCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=data-warga.csv');
    res.send('\ufeff' + csv); // BOM for Excel UTF-8
  }

  @Get('families')
  @ApiOperation({ summary: 'Export families data as CSV' })
  async exportFamilies(@Res() res: any) {
    const csv = await this.exportService.exportFamiliesCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=data-keluarga.csv');
    res.send('\ufeff' + csv);
  }

  @Get('bills')
  @ApiOperation({ summary: 'Export bills data as CSV' })
  async exportBills(@Query('period') period: string, @Res() res: any) {
    const csv = await this.exportService.exportBillsCsv(period);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=iuran-${period || 'all'}.csv`);
    res.send('\ufeff' + csv);
  }

  @Get('cash')
  @ApiOperation({ summary: 'Export cash transactions as CSV' })
  async exportCash(@Query('month') month: string, @Res() res: any) {
    const csv = await this.exportService.exportCashCsv(month);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=kas-rt-${month || 'all'}.csv`);
    res.send('\ufeff' + csv);
  }
}
