import { Controller, ForbiddenException, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { ExportService, BillReportQuery } from './export.service';
import { UsersService } from '../users/users.service';
import { SettingsService } from '../settings/settings.service';
import { getSessionPhoneNumber } from '../common/session.util';

@ApiTags('Export')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService, private readonly usersService: UsersService, private readonly settingsService: SettingsService) {}

  private async assertAdmin(session: UserSession) {
    const scope = await this.usersService.resolveAuthContext(getSessionPhoneNumber(session));
    if (!scope.isAdmin) throw new ForbiddenException('Hanya pengurus yang dapat mengunduh laporan');
  }

  private query(periodFrom?: string, periodTo?: string, billTypeId?: string, status?: string, method?: string, search?: string): BillReportQuery {
    return { periodFrom, periodTo, billTypeId, status, method, search };
  }

  @Get('residents')
  @ApiOperation({ summary: 'Export residents data as CSV' })
  async exportResidents(@Session() session: UserSession, @Res() res: any) {
    await this.assertAdmin(session);
    const csv = await this.exportService.exportResidentsCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=data-warga.csv');
    res.send('\ufeff' + csv); // BOM for Excel UTF-8
  }

  @Get('families')
  @ApiOperation({ summary: 'Export families data as CSV' })
  async exportFamilies(@Session() session: UserSession, @Res() res: any) {
    await this.assertAdmin(session);
    const csv = await this.exportService.exportFamiliesCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=data-keluarga.csv');
    res.send('\ufeff' + csv);
  }

  @Get('bills')
  @ApiOperation({ summary: 'Export bills data as CSV' })
  async exportBills(@Session() session: UserSession, @Query('period') period: string, @Res() res: any) {
    await this.assertAdmin(session);
    const csv = await this.exportService.exportBillsCsv(period);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=iuran-${period || 'all'}.csv`);
    res.send('\ufeff' + csv);
  }

  @Get('cash')
  @ApiOperation({ summary: 'Export cash transactions as CSV' })
  async exportCash(@Session() session: UserSession, @Query('month') month: string, @Res() res: any) {
    await this.assertAdmin(session);
    const csv = await this.exportService.exportCashCsv(month);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=kas-rt-${month || 'all'}.csv`);
    res.send('\ufeff' + csv);
  }

  @Get('reports/bills')
  @ApiOperation({ summary: 'Get filtered bills report data' })
  async billsReport(@Session() session: UserSession, @Query('periodFrom') from?: string, @Query('periodTo') to?: string, @Query('billTypeId') type?: string, @Query('status') status?: string, @Query('method') method?: string, @Query('search') search?: string) {
    await this.assertAdmin(session);
    return this.exportService.getBillsReport(this.query(from, to, type, status, method, search));
  }

  @Get('reports/bills.csv')
  async billsReportCsv(@Session() session: UserSession, @Res() res: any, @Query('periodFrom') from?: string, @Query('periodTo') to?: string, @Query('billTypeId') type?: string, @Query('status') status?: string, @Query('method') method?: string, @Query('search') search?: string) {
    await this.assertAdmin(session);
    const csv = await this.exportService.exportBillsReportCsv(this.query(from, to, type, status, method, search));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename="laporan-iuran.csv"'); res.send('\ufeff' + csv);
  }

  @Get('reports/bills.xlsx')
  async billsReportExcel(@Session() session: UserSession, @Res() res: any, @Query('periodFrom') from?: string, @Query('periodTo') to?: string, @Query('billTypeId') type?: string, @Query('status') status?: string, @Query('method') method?: string, @Query('search') search?: string) {
    await this.assertAdmin(session);
    const file = await this.exportService.exportBillsReportExcel(this.query(from, to, type, status, method, search));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', 'attachment; filename="laporan-iuran.xlsx"'); res.send(file);
  }

  @Get('reports/bills.pdf')
  async billsReportPdf(@Session() session: UserSession, @Res() res: any, @Query('download') download?: string, @Query('periodFrom') from?: string, @Query('periodTo') to?: string, @Query('billTypeId') type?: string, @Query('status') status?: string, @Query('method') method?: string, @Query('search') search?: string) {
    await this.assertAdmin(session);
    // Laporan tetap dapat dibuat bila tabel pengaturan belum terisi/terganggu;
    // branding hanya bersifat pelengkap, bukan prasyarat pembuatan PDF.
    let branding: Record<string, string> = { app_name: 'WargaNet' };
    try {
      const settings = await this.settingsService.findAll();
      branding = { ...branding, ...Object.fromEntries(settings.map((item) => [item.key, item.value])) };
    } catch {
      // Gunakan branding default.
    }
    const file = await this.exportService.exportBillsReportPdf(this.query(from, to, type, status, method, search), branding);
    res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `${download === '1' ? 'attachment' : 'inline'}; filename="laporan-iuran.pdf"`); res.send(file);
  }
}
