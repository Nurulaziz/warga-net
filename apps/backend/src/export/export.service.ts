import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');
import { PrismaService } from '../prisma/prisma.service';

export interface BillReportQuery {
  periodFrom?: string;
  periodTo?: string;
  billTypeId?: string;
  status?: string;
  method?: string;
  search?: string;
}

type ReportRow = { period: string; billType: string; family: string; amount: number; paid: number; outstanding: number; status: 'paid' | 'partial' | 'unpaid' | 'overdue'; dueDate: Date; paidAt: Date | null; methods: string; reference: string };
const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const VALID_STATUS = new Set(['paid', 'partial', 'unpaid', 'overdue']);
const isSettled = (p: { method: string; transactionStatus: string | null }) => p.method === 'cash' || p.method === 'transfer' || p.transactionStatus === 'settlement' || p.transactionStatus === 'capture';
const rupiah = (value: number) => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
const dateId = (value: Date | string | null) => value ? new Date(value).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
const statusLabel = (value: ReportRow['status']) => ({ paid: 'Lunas', partial: 'Sebagian', unpaid: 'Belum Bayar', overdue: 'Jatuh Tempo' })[value];
function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  private validate(query: BillReportQuery) {
    if (query.periodFrom && !PERIOD_RE.test(query.periodFrom)) throw new BadRequestException('Periode awal tidak valid');
    if (query.periodTo && !PERIOD_RE.test(query.periodTo)) throw new BadRequestException('Periode akhir tidak valid');
    if (query.periodFrom && query.periodTo && query.periodFrom > query.periodTo) throw new BadRequestException('Periode awal tidak boleh melewati periode akhir');
    if (query.status && !VALID_STATUS.has(query.status)) throw new BadRequestException('Status laporan tidak valid');
  }

  async getBillsReport(query: BillReportQuery) {
    this.validate(query);
    const where: any = {};
    if (query.periodFrom || query.periodTo) {
      where.period = {};
      if (query.periodFrom) where.period.gte = query.periodFrom;
      if (query.periodTo) where.period.lte = query.periodTo;
    }
    if (query.billTypeId) where.billTypeId = query.billTypeId;
    if (query.search?.trim()) where.family = { headOfFamily: { contains: query.search.trim(), mode: 'insensitive' } };
    const bills = await this.prisma.bill.findMany({ where, include: { family: true, billType: true, payments: { orderBy: { paidAt: 'asc' } } }, orderBy: [{ period: 'desc' }, { family: { headOfFamily: 'asc' } }] });
    let rows: ReportRow[] = bills.map((bill) => {
      const payments = bill.payments.filter(isSettled);
      const paid = Math.min(bill.amount, payments.reduce((sum, payment) => sum + payment.amount, 0));
      const outstanding = Math.max(0, bill.amount - paid);
      const status: ReportRow['status'] = outstanding === 0 ? 'paid' : paid > 0 ? 'partial' : bill.dueDate.getTime() < Date.now() ? 'overdue' : 'unpaid';
      return { period: bill.period, billType: bill.billType.name, family: bill.family.headOfFamily, amount: bill.amount, paid, outstanding, status, dueDate: bill.dueDate, paidAt: payments.at(-1)?.paidAt ?? null, methods: [...new Set(payments.map((payment) => payment.paymentType || payment.method))].join(', ') || '-', reference: payments.map((payment) => payment.referenceNo || payment.orderId).filter(Boolean).join(', ') || '-' };
    });
    if (query.status) rows = rows.filter((row) => row.status === query.status);
    if (query.method) rows = rows.filter((row) => row.methods.split(', ').includes(query.method!));
    const summary = rows.reduce((acc, row) => { acc.totalBills++; acc.totalAmount += row.amount; acc.paidAmount += row.paid; acc.outstandingAmount += row.outstanding; acc[row.status]++; return acc; }, { totalBills: 0, totalAmount: 0, paidAmount: 0, outstandingAmount: 0, paid: 0, partial: 0, unpaid: 0, overdue: 0 });
    return { summary: { ...summary, collectionRate: summary.totalAmount ? Math.round(summary.paidAmount / summary.totalAmount * 10000) / 100 : 0 }, rows };
  }

  async exportBillsReportCsv(query: BillReportQuery) {
    const report = await this.getBillsReport(query);
    const header = ['No', 'Periode', 'Jenis Iuran', 'Kepala Keluarga', 'Tagihan', 'Dibayar', 'Sisa', 'Status', 'Jatuh Tempo', 'Tanggal Bayar', 'Metode', 'Referensi'];
    const rows = report.rows.map((row, i) => [i + 1, row.period, row.billType, row.family, row.amount, row.paid, row.outstanding, statusLabel(row.status), dateId(row.dueDate), dateId(row.paidAt), row.methods, row.reference]);
    return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  }

  async exportBillsReportExcel(query: BillReportQuery): Promise<Buffer> {
    const report = await this.getBillsReport(query);
    const workbook = new ExcelJS.Workbook(); workbook.creator = 'WargaNet';
    const summary = workbook.addWorksheet('Ringkasan');
    summary.addRows([['LAPORAN IURAN WARGANET'], ['Periode', `${query.periodFrom || 'Awal'} s.d. ${query.periodTo || 'Akhir'}`], [], ['Total Tagihan', report.summary.totalBills], ['Nilai Ditagihkan', report.summary.totalAmount], ['Pembayaran Diterima', report.summary.paidAmount], ['Sisa Piutang', report.summary.outstandingAmount], ['Tingkat Penagihan', `${report.summary.collectionRate}%`], ['Lunas', report.summary.paid], ['Sebagian', report.summary.partial], ['Belum Bayar', report.summary.unpaid], ['Jatuh Tempo', report.summary.overdue]]);
    summary.getColumn(1).width = 25; summary.getColumn(2).width = 24; summary.mergeCells('A1:B1'); summary.getRow(1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }; summary.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF171717' } }; [5, 6, 7].forEach((r) => summary.getCell(r, 2).numFmt = '"Rp" #,##0');
    const detail = workbook.addWorksheet('Rincian Iuran', { views: [{ state: 'frozen', ySplit: 1 }] });
    detail.columns = [{ header: 'No', key: 'no', width: 7 }, { header: 'Periode', key: 'period', width: 12 }, { header: 'Jenis Iuran', key: 'billType', width: 22 }, { header: 'Kepala Keluarga', key: 'family', width: 24 }, { header: 'Tagihan', key: 'amount', width: 16 }, { header: 'Dibayar', key: 'paid', width: 16 }, { header: 'Sisa', key: 'outstanding', width: 16 }, { header: 'Status', key: 'status', width: 16 }, { header: 'Jatuh Tempo', key: 'dueDate', width: 16 }, { header: 'Tanggal Bayar', key: 'paidAt', width: 16 }, { header: 'Metode', key: 'methods', width: 18 }, { header: 'Referensi', key: 'reference', width: 28 }];
    report.rows.forEach((row, i) => detail.addRow({ ...row, no: i + 1, status: statusLabel(row.status), dueDate: dateId(row.dueDate), paidAt: dateId(row.paidAt) }));
    detail.getRow(1).font = { bold: true, color: { argb: 'FF171717' } }; detail.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8D0' } }; detail.getRow(1).alignment = { vertical: 'middle' }; detail.getRow(1).height = 24; detail.autoFilter = { from: 'A1', to: 'L1' }; ['E', 'F', 'G'].forEach((c) => detail.getColumn(c).numFmt = '"Rp" #,##0'); detail.eachRow((row, index) => { if (index > 1 && index % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBF4' } }; });
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async exportBillsReportPdf(query: BillReportQuery, branding: Record<string, string>): Promise<Buffer> {
    const report = await this.getBillsReport(query);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, info: { Title: 'Laporan Iuran WargaNet', Author: branding.app_name || 'WargaNet' } });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(Buffer.from(chunk))); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
      const pageWidth = 842 - 72;
      const drawHeader = () => {
        doc.fillColor('#171717').font('Helvetica-Bold').fontSize(19).text(branding.app_name || 'WargaNet');
        doc.fontSize(11).text('LAPORAN PENERIMAAN IURAN WARGA');
        doc.font('Helvetica').fontSize(9).fillColor('#4b5563').text(`${branding.housing_complex || ''}  |  RT ${branding.rt_name || '-'} / RW ${branding.rw_name || '-'}  |  ${branding.kelurahan || ''}, ${branding.kabupaten || ''}`);
        doc.moveTo(36, doc.y + 8).lineTo(36 + pageWidth, doc.y + 8).lineWidth(2).strokeColor('#171717').stroke(); doc.moveDown(0.8);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#171717').text('Periode laporan: ', { continued: true }).font('Helvetica').text(`${query.periodFrom || 'awal'} s.d. ${query.periodTo || 'akhir'}`);
        doc.fontSize(8).fillColor('#6b7280').text(`Dicetak: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`); doc.moveDown(0.8);
      };
      drawHeader();
      const boxes = [['TOTAL TAGIHAN', rupiah(report.summary.totalAmount)], ['DITERIMA', rupiah(report.summary.paidAmount)], ['SISA PIUTANG', rupiah(report.summary.outstandingAmount)], ['KOLEKTIBILITAS', `${report.summary.collectionRate}%`]];
      const boxWidth = (pageWidth - 18) / 4; const boxY = doc.y;
      boxes.forEach((box, i) => { const x = 36 + i * (boxWidth + 6); doc.rect(x, boxY, boxWidth, 42).fillAndStroke('#f3e8d0', '#171717'); doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(7).text(box[0], x + 8, boxY + 8, { width: boxWidth - 16 }); doc.fillColor('#171717').fontSize(11).text(box[1], x + 8, boxY + 22, { width: boxWidth - 16 }); });
      doc.y = boxY + 56;
      const widths = [28, 55, 95, 110, 68, 68, 68, 68, 72]; const headers = ['No', 'Periode', 'Jenis Iuran', 'Keluarga', 'Tagihan', 'Dibayar', 'Sisa', 'Status', 'Jatuh Tempo']; const totalWidth = widths.reduce((a, b) => a + b, 0);
      const drawRow = (values: string[], header = false) => { const y = doc.y; let x = 36; if (header) doc.rect(36, y - 3, totalWidth, 19).fillAndStroke('#f3e8d0', '#171717'); doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(header ? 7.2 : 7.5).fillColor('#171717'); values.forEach((value, i) => { doc.text(value, x + 3, y + (header ? 2 : 0), { width: widths[i] - 6, height: 13, ellipsis: true }); x += widths[i]; }); doc.y = y + 19; doc.moveTo(36, doc.y - 2).lineTo(36 + totalWidth, doc.y - 2).lineWidth(header ? 1.2 : 0.4).strokeColor('#b8aa90').stroke(); };
      let pageNumber = 1;
      const footer = () => { const y = 528; doc.moveTo(36, y).lineTo(36 + pageWidth, y).lineWidth(0.6).strokeColor('#b8aa90').stroke(); doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text('Dokumen dihasilkan oleh WargaNet - Laporan resmi administrasi RT/RW', 36, y + 8, { lineBreak: false }); doc.text(`Halaman ${pageNumber}`, 36 + pageWidth - 70, y + 8, { width: 70, align: 'right', lineBreak: false }); };
      drawRow(headers, true); report.rows.forEach((row, i) => { if (doc.y > 520) { footer(); pageNumber += 1; doc.addPage(); drawHeader(); drawRow(headers, true); } drawRow([String(i + 1), row.period, row.billType, row.family, rupiah(row.amount), rupiah(row.paid), rupiah(row.outstanding), statusLabel(row.status), dateId(row.dueDate)]); }); if (!report.rows.length) doc.font('Helvetica').fontSize(11).fillColor('#4b5563').text('Tidak ada data untuk filter yang dipilih.', 36, doc.y + 15); footer(); doc.end();
    });
  }

  exportBillsCsv(period?: string) { return this.exportBillsReportCsv({ periodFrom: period, periodTo: period }); }
  async exportResidentsCsv() { const data = await this.prisma.resident.findMany({ where: { deletedAt: null }, include: { family: true }, orderBy: [{ family: { headOfFamily: 'asc' } }, { fullName: 'asc' }] }); const rows = data.map((r, i) => [i + 1, r.fullName, r.idNumber, dateId(r.birthDate), r.gender, r.relationship, r.family.headOfFamily, r.family.address, r.family.rt, r.family.rw]); return [['No', 'Nama Lengkap', 'NIK', 'Tanggal Lahir', 'Jenis Kelamin', 'Hubungan', 'Kepala Keluarga', 'Alamat', 'RT', 'RW'], ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n'); }
  async exportFamiliesCsv() { const data = await this.prisma.family.findMany({ where: { deletedAt: null }, include: { _count: { select: { residents: true } } }, orderBy: { headOfFamily: 'asc' } }); const rows = data.map((f, i) => [i + 1, f.headOfFamily, f.address, f.housingComplex, f.rt, f.rw, f.kelurahan, f.kecamatan, f._count.residents]); return [['No', 'Kepala Keluarga', 'Alamat', 'Perumahan', 'RT', 'RW', 'Kelurahan', 'Kecamatan', 'Jumlah Anggota'], ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n'); }
  async exportCashCsv(month?: string) { const where: any = {}; if (month) { if (!PERIOD_RE.test(month)) throw new BadRequestException('Bulan tidak valid'); const [year, value] = month.split('-').map(Number); where.date = { gte: new Date(year, value - 1, 1), lt: new Date(year, value, 1) }; } const data = await this.prisma.cashTransaction.findMany({ where, include: { category: true }, orderBy: { date: 'desc' } }); const rows = data.map((t, i) => [i + 1, dateId(t.date), t.type === 'income' ? 'Pemasukan' : 'Pengeluaran', t.category.name, t.description, t.amount]); return [['No', 'Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal'], ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n'); }
}
