# Design Document - Laporan Keuangan RT Profesional

## Overview

Fitur ini mengimplementasikan sistem generasi laporan keuangan RT yang profesional dengan output format PDF dan Excel. Sistem akan mengambil data transaksi keuangan dari database, memproses dan memformat data sesuai standar administrasi pemerintahan, kemudian menghasilkan dokumen yang siap cetak atau arsip.

### Key Design Decisions

1. **PDF Generation Library**: Menggunakan **PDFKit** karena:
   - Lightweight dan tidak memerlukan headless browser (berbeda dengan Puppeteer)
   - API yang powerful untuk kontrol layout dan formatting
   - Performa baik untuk server-side generation
   - Mendukung custom fonts dan styling profesional
   - Tidak ada memory leak issues seperti Puppeteer

2. **Excel Generation Library**: Menggunakan **ExcelJS** karena:
   - Library paling mature dan aktif untuk Excel generation di Node.js
   - Mendukung formula, styling, dan sheet protection
   - API yang intuitif dan well-documented
   - Performa baik untuk workbook dengan multiple sheets

3. **Data Processing**: Memisahkan logic data fetching, processing, dan rendering untuk maintainability

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Controller    │ ← HTTP Request (POST /api/financial-reports/pdf)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Report Service │ ← Business Logic & Orchestration
└────────┬────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Data Fetcher │ │ PDF Generator│ │Excel Generator│ │ Validator    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
         │
         ▼
┌─────────────────┐
│    Database     │ (Prisma)
└─────────────────┘
```

### Component Responsibilities

1. **ReportController**: Handle HTTP requests, validate input, return file response
2. **ReportService**: Orchestrate report generation workflow
3. **DataFetcherService**: Query database and aggregate financial data
4. **PdfGeneratorService**: Generate PDF document using PDFKit
5. **ExcelGeneratorService**: Generate Excel workbook using ExcelJS
6. **ReportValidatorService**: Validate data integrity and calculations

## Components and Interfaces

### 1. ReportController

```typescript
@Controller('api/financial-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportController {
  
  @Post('pdf')
  @RequirePermissions('financial_reports:generate')
  async generatePdf(
    @Body() dto: GenerateReportDto,
    @Res() res: Response
  ): Promise<void> {
    // Generate PDF and stream to response
  }
  
  @Post('excel')
  @RequirePermissions('financial_reports:generate')
  async generateExcel(
    @Body() dto: GenerateReportDto,
    @Res() res: Response
  ): Promise<void> {
    // Generate Excel and stream to response
  }
}
```

### 2. ReportService

```typescript
@Injectable()
export class ReportService {
  constructor(
    private dataFetcher: DataFetcherService,
    private pdfGenerator: PdfGeneratorService,
    private excelGenerator: ExcelGeneratorService,
    private validator: ReportValidatorService,
  ) {}
  
  async generatePdfReport(dto: GenerateReportDto): Promise<Buffer> {
    // 1. Fetch and aggregate data
    const reportData = await this.dataFetcher.fetchReportData(dto);
    
    // 2. Validate data
    this.validator.validateReportData(reportData);
    
    // 3. Generate PDF
    return this.pdfGenerator.generate(reportData);
  }
  
  async generateExcelReport(dto: GenerateReportDto): Promise<Buffer> {
    // Similar flow for Excel
  }
}
```

### 3. DataFetcherService

```typescript
@Injectable()
export class DataFetcherService {
  constructor(private prisma: PrismaService) {}
  
  async fetchReportData(dto: GenerateReportDto): Promise<ReportData> {
    // Fetch RT info
    const rtInfo = await this.fetchRtInfo(dto.rtId);
    
    // Fetch previous period ending balance
    const saldoAwal = await this.fetchPreviousBalance(dto.rtId, dto.startDate);
    
    // Fetch income transactions
    const incomeTransactions = await this.fetchIncomeTransactions(
      dto.rtId,
      dto.startDate,
      dto.endDate
    );
    
    // Fetch expense transactions
    const expenseTransactions = await this.fetchExpenseTransactions(
      dto.rtId,
      dto.startDate,
      dto.endDate
    );
    
    // Calculate totals
    const totalIncome = this.calculateTotal(incomeTransactions);
    const totalExpense = this.calculateTotal(expenseTransactions);
    const saldoAkhir = saldoAwal + totalIncome - totalExpense;
    
    // Group expenses by category
    const categoryRecap = this.groupByCategory(expenseTransactions);
    
    return {
      rtInfo,
      period: { startDate: dto.startDate, endDate: dto.endDate },
      summary: { saldoAwal, totalIncome, totalExpense, saldoAkhir },
      incomeTransactions,
      expenseTransactions,
      categoryRecap,
      generatedAt: new Date(),
      generatedBy: dto.userId,
    };
  }
  
  private async fetchIncomeTransactions(
    rtId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IncomeTransaction[]> {
    return this.prisma.payment.findMany({
      where: {
        bill: {
          family: { rtId },
        },
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'PAID', // Only approved payments
        deletedAt: null, // Exclude soft-deleted
      },
      include: {
        bill: {
          include: {
            family: {
              include: {
                residents: {
                  where: { isHeadOfFamily: true },
                },
              },
            },
            feeType: true,
          },
        },
      },
      orderBy: { paymentDate: 'asc' },
    });
  }
  
  private async fetchExpenseTransactions(
    rtId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ExpenseTransaction[]> {
    return this.prisma.expense.findMany({
      where: {
        rtId,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'APPROVED', // Only approved expenses
        deletedAt: null, // Exclude soft-deleted
      },
      include: {
        category: true,
        approvedBy: true,
      },
      orderBy: { expenseDate: 'asc' },
    });
  }
}
```

### 4. PdfGeneratorService

```typescript
@Injectable()
export class PdfGeneratorService {
  private readonly ASSETS_PATH = path.join(process.cwd(), 'apps/backend/assets');
  private readonly DEFAULT_LOGO = path.join(this.ASSETS_PATH, 'logos/default/warganet-logo.png');
  
  async generate(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 56.7, bottom: 56.7, left: 56.7, right: 56.7 }, // 2cm
      });
      
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Generate document sections
      this.addHeader(doc, data.rtInfo);
      this.addTitle(doc, data.period);
      this.addSummary(doc, data.summary);
      this.addIncomeDetails(doc, data.incomeTransactions);
      this.addExpenseDetails(doc, data.expenseTransactions);
      this.addCategoryRecap(doc, data.categoryRecap);
      this.addSignatures(doc, data.rtInfo, data.generatedAt);
      
      doc.end();
    });
  }
  
  private addHeader(doc: PDFDocument, rtInfo: RtInfo): void {
    // Tentukan logo path: RT-specific logo atau default logo
    let logoPath = this.DEFAULT_LOGO;
    if (rtInfo.logoFilename) {
      const rtLogoPath = path.join(this.ASSETS_PATH, 'logos/rt', rtInfo.logoFilename);
      if (fs.existsSync(rtLogoPath)) {
        logoPath = rtLogoPath;
      }
    }
    
    // Add logo (selalu ada, minimal default logo)
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, { width: 60, align: 'center' });
    }
    
    // RT name
    doc.fontSize(16).font('Helvetica-Bold')
       .text(rtInfo.name, { align: 'center' });
    
    // Address and contact
    doc.fontSize(10).font('Helvetica')
       .text(`${rtInfo.kelurahan}, ${rtInfo.kecamatan}, ${rtInfo.kota}`, { align: 'center' })
       .text(`${rtInfo.address}`, { align: 'center' })
       .text(`Telp: ${rtInfo.phone}`, { align: 'center' });
    
    // Horizontal line
    doc.moveDown(0.5)
       .moveTo(doc.page.margins.left, doc.y)
       .lineTo(doc.page.width - doc.page.margins.right, doc.y)
       .stroke();
    
    doc.moveDown(1);
  }
  
  private addTitle(doc: PDFDocument, period: Period): void {
    doc.fontSize(14).font('Helvetica-Bold')
       .text('LAPORAN KEUANGAN RT', { align: 'center' });
    
    const startStr = this.formatDate(period.startDate);
    const endStr = this.formatDate(period.endDate);
    doc.fontSize(11).font('Helvetica')
       .text(`Periode: ${startStr} – ${endStr}`, { align: 'center' });
    
    doc.moveDown(1.5);
  }
  
  private addSummary(doc: PDFDocument, summary: Summary): void {
    doc.fontSize(12).font('Helvetica-Bold')
       .text('RINGKASAN KEUANGAN');
    
    doc.moveDown(0.5);
    
    // Create table
    const tableData = [
      ['Keterangan', 'Jumlah'],
      ['Saldo Awal', this.formatCurrency(summary.saldoAwal)],
      ['Total Pemasukan', this.formatCurrency(summary.totalIncome)],
      ['Total Pengeluaran', this.formatCurrency(summary.totalExpense)],
      ['Saldo Akhir', this.formatCurrency(summary.saldoAkhir)],
    ];
    
    this.drawTable(doc, tableData, { boldLastRow: true });
    doc.moveDown(1.5);
  }
  
  private addIncomeDetails(doc: PDFDocument, transactions: IncomeTransaction[]): void {
    doc.fontSize(12).font('Helvetica-Bold')
       .text('RINCIAN PEMASUKAN');
    
    doc.moveDown(0.5);
    
    const headers = ['Tanggal', 'Nama Warga', 'Jenis Iuran', 'Periode', 'Metode', 'Nominal', 'Ket'];
    const rows = transactions.map(t => [
      this.formatDateShort(t.paymentDate),
      t.bill.family.residents[0].fullName,
      t.bill.feeType.name,
      t.bill.period,
      t.paymentMethod,
      this.formatCurrency(t.amount),
      t.notes || '-',
    ]);
    
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    rows.push(['', '', '', '', 'TOTAL', this.formatCurrency(total), '']);
    
    this.drawTable(doc, [headers, ...rows], { boldLastRow: true });
    doc.moveDown(1.5);
  }
  
  private addExpenseDetails(doc: PDFDocument, transactions: ExpenseTransaction[]): void {
    // Similar to addIncomeDetails
  }
  
  private addCategoryRecap(doc: PDFDocument, recap: CategoryRecap[]): void {
    // Similar table structure
  }
  
  private addSignatures(doc: PDFDocument, rtInfo: RtInfo, generatedAt: Date): void {
    doc.moveDown(2);
    
    const cityDate = `${rtInfo.kota}, ${this.formatDate(generatedAt)}`;
    doc.fontSize(10).font('Helvetica')
       .text(cityDate, { align: 'right' });
    
    doc.moveDown(0.5);
    doc.text('Mengetahui:', { align: 'center' });
    doc.moveDown(2);
    
    // Three columns for signatures
    const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 3;
    const y = doc.y;
    
    // Ketua RT
    doc.text('Ketua RT', doc.page.margins.left, y, { width: colWidth, align: 'center' });
    doc.moveDown(3);
    doc.text(rtInfo.ketuaName, doc.page.margins.left, doc.y, { width: colWidth, align: 'center' });
    
    // Sekretaris RT
    doc.text('Sekretaris RT', doc.page.margins.left + colWidth, y, { width: colWidth, align: 'center' });
    doc.moveDown(3);
    doc.text(rtInfo.sekretarisName, doc.page.margins.left + colWidth, doc.y, { width: colWidth, align: 'center' });
    
    // Bendahara RT
    doc.text('Bendahara RT', doc.page.margins.left + 2 * colWidth, y, { width: colWidth, align: 'center' });
    doc.moveDown(3);
    doc.text(rtInfo.bendaharaName, doc.page.margins.left + 2 * colWidth, doc.y, { width: colWidth, align: 'center' });
  }
  
  private drawTable(doc: PDFDocument, data: string[][], options?: TableOptions): void {
    // Implementation for drawing tables with borders
  }
  
  private formatCurrency(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
  
  private formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
  
  private formatDateShort(date: Date): string {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
```

### 5. ExcelGeneratorService

```typescript
@Injectable()
export class ExcelGeneratorService {
  async generate(data: ReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Ringkasan
    this.createSummarySheet(workbook, data);
    
    // Sheet 2: Detail Pemasukan
    this.createIncomeSheet(workbook, data);
    
    // Sheet 3: Detail Pengeluaran
    this.createExpenseSheet(workbook, data);
    
    // Sheet 4: Rekap Kategori
    this.createCategorySheet(workbook, data);
    
    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }
  
  private createSummarySheet(workbook: ExcelJS.Workbook, data: ReportData): void {
    const sheet = workbook.addWorksheet('Ringkasan');
    
    // Header
    sheet.addRow(['LAPORAN KEUANGAN RT']);
    sheet.addRow([data.rtInfo.name]);
    sheet.addRow([`Periode: ${this.formatDate(data.period.startDate)} - ${this.formatDate(data.period.endDate)}`]);
    sheet.addRow([]);
    
    // Summary table
    sheet.addRow(['Keterangan', 'Jumlah']);
    sheet.addRow(['Saldo Awal', data.summary.saldoAwal]);
    sheet.addRow(['Total Pemasukan', data.summary.totalIncome]);
    sheet.addRow(['Total Pengeluaran', data.summary.totalExpense]);
    sheet.addRow(['Saldo Akhir', data.summary.saldoAkhir]);
    
    // Styling
    sheet.getRow(1).font = { bold: true, size: 14 };
    sheet.getRow(5).font = { bold: true };
    sheet.getRow(9).font = { bold: true };
    
    // Format currency columns
    sheet.getColumn(2).numFmt = '"Rp "#,##0';
    
    // Auto width
    sheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Freeze header
    sheet.views = [{ state: 'frozen', ySplit: 5 }];
    
    // Borders
    this.addBorders(sheet, 5, 9, 1, 2);
  }
  
  private createIncomeSheet(workbook: ExcelJS.Workbook, data: ReportData): void {
    const sheet = workbook.addWorksheet('Detail Pemasukan');
    
    // Headers
    sheet.addRow(['Tanggal', 'Nama Warga', 'Jenis Iuran', 'Periode', 'Metode Pembayaran', 'Nominal', 'Keterangan']);
    sheet.getRow(1).font = { bold: true };
    
    // Data rows
    data.incomeTransactions.forEach(t => {
      sheet.addRow([
        t.paymentDate,
        t.bill.family.residents[0].fullName,
        t.bill.feeType.name,
        t.bill.period,
        t.paymentMethod,
        t.amount,
        t.notes || '',
      ]);
    });
    
    // Total row
    const totalRow = sheet.addRow([
      '', '', '', '', 'TOTAL',
      { formula: `SUM(F2:F${sheet.rowCount})` },
      '',
    ]);
    totalRow.font = { bold: true };
    
    // Format columns
    sheet.getColumn(1).numFmt = 'dd/mm/yyyy';
    sheet.getColumn(6).numFmt = '"Rp "#,##0';
    
    // Auto width
    sheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Freeze header
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    
    // Borders
    this.addBorders(sheet, 1, sheet.rowCount, 1, 7);
  }
  
  private createExpenseSheet(workbook: ExcelJS.Workbook, data: ReportData): void {
    // Similar to createIncomeSheet
  }
  
  private createCategorySheet(workbook: ExcelJS.Workbook, data: ReportData): void {
    // Similar structure for category recap
  }
  
  private addBorders(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ): void {
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = sheet.getRow(row).getCell(col);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }
  }
  
  private formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID');
  }
}
```

### 6. ReportValidatorService

```typescript
@Injectable()
export class ReportValidatorService {
  validateReportData(data: ReportData): void {
    // Validate balance calculation
    const calculatedBalance = 
      data.summary.saldoAwal + 
      data.summary.totalIncome - 
      data.summary.totalExpense;
    
    if (Math.abs(calculatedBalance - data.summary.saldoAkhir) > 0.01) {
      throw new BadRequestException('Balance calculation mismatch');
    }
    
    // Validate period
    if (data.period.startDate >= data.period.endDate) {
      throw new BadRequestException('Invalid period: start date must be before end date');
    }
    
    // Validate totals match transaction sums
    const incomeSum = data.incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    if (Math.abs(incomeSum - data.summary.totalIncome) > 0.01) {
      throw new BadRequestException('Income total mismatch');
    }
    
    const expenseSum = data.expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    if (Math.abs(expenseSum - data.summary.totalExpense) > 0.01) {
      throw new BadRequestException('Expense total mismatch');
    }
  }
}
```

## Data Models

### DTOs

```typescript
// Generate Report DTO
export class GenerateReportDto {
  @IsUUID()
  rtId: string;
  
  @IsDateString()
  startDate: string;
  
  @IsDateString()
  endDate: string;
  
  @IsOptional()
  @IsBoolean()
  includeWatermark?: boolean;
  
  @IsOptional()
  @IsBoolean()
  includeQrCode?: boolean;
  
  @IsOptional()
  @IsEnum(['DRAFT', 'FINAL'])
  status?: 'DRAFT' | 'FINAL';
}

// Report Data Structure
export interface ReportData {
  rtInfo: RtInfo;
  period: Period;
  summary: Summary;
  incomeTransactions: IncomeTransaction[];
  expenseTransactions: ExpenseTransaction[];
  categoryRecap: CategoryRecap[];
  generatedAt: Date;
  generatedBy: string;
  documentNumber?: string;
  status?: 'DRAFT' | 'FINAL';
}

export interface RtInfo {
  id: string;
  name: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  address: string;
  phone: string;
  logoFilename?: string; // Filename saja (contoh: "rt-001.png"), bukan full path
  ketuaName: string;
  sekretarisName: string;
  bendaharaName: string;
}

export interface Period {
  startDate: Date;
  endDate: Date;
}

export interface Summary {
  saldoAwal: number;
  totalIncome: number;
  totalExpense: number;
  saldoAkhir: number;
}

export interface IncomeTransaction {
  paymentDate: Date;
  residentName: string;
  feeTypeName: string;
  period: string;
  paymentMethod: string;
  amount: number;
  notes?: string;
}

export interface ExpenseTransaction {
  expenseDate: Date;
  description: string;
  categoryName: string;
  amount: number;
  notes: string;
  approvedByName?: string;
}

export interface CategoryRecap {
  categoryName: string;
  total: number;
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **Currency formatting** (3.6, 3.7, 4.7, 5.7, 6.5) can be combined into one comprehensive property
2. **Date formatting** (4.6, 5.6) can be combined into one property
3. **Transaction filtering** (4.3, 4.4, 5.3, 5.4, 10.3, 10.4) can be combined into one property about data integrity
4. **Sorting** (4.2, 5.2) can be combined into one property about transaction ordering
5. **Column presence** (1.1, 1.2, 1.3, 4.1, 5.1, 6.2) can be combined into properties about required fields

### Core Properties

**Property 1: Balance Calculation Invariant**

*For any* report period and RT, the ending balance (Saldo Akhir) must equal: starting balance (Saldo Awal) + total income (Total Pemasukan) - total expenses (Total Pengeluaran)

**Validates: Requirements 3.5, 10.2**

**Property 2: Income Total Consistency**

*For any* report, the displayed Total Pemasukan must equal the sum of all individual income transaction amounts in the detail table

**Validates: Requirements 3.3, 4.5**

**Property 3: Expense Total Consistency**

*For any* report, the displayed Total Pengeluaran must equal the sum of all individual expense transaction amounts in the detail table

**Validates: Requirements 3.4, 5.5**

**Property 4: Category Recap Consistency**

*For any* report, the sum of all category totals in the recap must equal the Total Pengeluaran

**Validates: Requirements 6.3, 6.6**

**Property 5: Transaction Data Integrity**

*For any* report, all included transactions (both income and expense) must have approved status (not draft) and must not be soft-deleted

**Validates: Requirements 4.3, 4.4, 5.3, 5.4, 10.3, 10.4**

**Property 6: Transaction Chronological Ordering**

*For any* report, all transactions in the detail tables (income and expense) must be sorted by date in ascending order

**Validates: Requirements 4.2, 5.2**

**Property 7: Category Alphabetical Ordering**

*For any* report, all categories in the category recap must be sorted alphabetically

**Validates: Requirements 6.4**

**Property 8: Currency Formatting Consistency**

*For any* monetary amount displayed in the report (PDF or Excel), it must be formatted with thousand separators and prefixed with "Rp"

**Validates: Requirements 3.6, 3.7, 4.7, 5.7, 6.5**

**Property 9: Date Formatting Consistency**

*For any* date displayed in transaction details, it must be formatted as "DD/MM/YYYY"

**Validates: Requirements 4.6, 5.6**

**Property 10: Indonesian Date Format**

*For any* date displayed in headers or summaries, it must use formal Indonesian format (e.g., "01 Januari 2026")

**Validates: Requirements 2.4**

**Property 11: Required Header Fields**

*For any* report, the header must contain RT name, kelurahan, kecamatan, kota, address, and contact information

**Validates: Requirements 1.1, 1.2, 1.3**

**Property 12: Conditional Logo Display**

*For any* report where RT has a logo path, the logo must be displayed in the header; for reports where no logo exists, the report must still generate successfully without logo

**Validates: Requirements 1.4**

**Property 13: Report Title Presence**

*For any* report, the document must contain the exact text "LAPORAN KEUANGAN RT"

**Validates: Requirements 2.1**

**Property 14: Period Display Format**

*For any* report with start date and end date, the period must be displayed in format "DD Month YYYY – DD Month YYYY"

**Validates: Requirements 2.2**

**Property 15: Required Income Columns**

*For any* report, the income detail table must contain all required columns: Tanggal, Nama Warga, Jenis Iuran, Periode, Metode Pembayaran, Nominal, Keterangan

**Validates: Requirements 4.1**

**Property 16: Required Expense Columns**

*For any* report, the expense detail table must contain all required columns: Tanggal, Jenis Pengeluaran, Kategori, Nominal, Keterangan, Disetujui Oleh

**Validates: Requirements 5.1**

**Property 17: Signature Section Completeness**

*For any* report, the signature section must contain "Mengetahui:" label and three signature placeholders for Ketua RT, Sekretaris RT, and Bendahara RT with their actual names from system data

**Validates: Requirements 7.1, 7.2, 7.3**

**Property 18: Generation Metadata**

*For any* report, the document must display generation location and date in format "Dibuat di: [Kota], Tanggal: [DD Month YYYY]" where the date is the current date

**Validates: Requirements 7.4, 7.5, 7.6**

**Property 19: PDF A4 Format**

*For any* PDF report, the document must use A4 paper size (210mm x 297mm) with margins of 2-2.5 cm

**Validates: Requirements 8.1, 8.2**

**Property 20: PDF Professional Fonts**

*For any* PDF report, the document must use professional fonts (Arial, Helvetica, or Times)

**Validates: Requirements 8.3**

**Property 21: PDF Page Numbers**

*For any* PDF report with one or more pages, each page must have a page number

**Validates: Requirements 8.4**

**Property 22: PDF Multi-Page Handling**

*For any* PDF report where table content exceeds one page, the document must automatically break pages and maintain consistent headers across all pages

**Validates: Requirements 8.5, 8.6**

**Property 23: PDF Watermark (Conditional)**

*For any* PDF report where watermark is enabled, the document must contain "WargaNet" watermark

**Validates: Requirements 8.7**

**Property 24: PDF Text Selectability**

*For any* PDF report, all text content must be selectable and searchable (not image-based)

**Validates: Requirements 8.8**

**Property 25: Excel Sheet Structure**

*For any* Excel report, the workbook must contain exactly four sheets named: "Ringkasan", "Detail Pemasukan", "Detail Pengeluaran", "Rekap Kategori"

**Validates: Requirements 9.1**

**Property 26: Excel Currency Formatting**

*For any* Excel report, all amount columns must have currency format applied

**Validates: Requirements 9.2**

**Property 27: Excel Header Formatting**

*For any* Excel report, all sheets must have frozen header rows and bold formatting on headers

**Validates: Requirements 9.4, 9.5**

**Property 28: Excel Cell Borders**

*For any* Excel report, all table cells must have borders

**Validates: Requirements 9.6**

**Property 29: Excel Formula Usage**

*For any* Excel report, total calculations must use Excel formulas (SUM) rather than hardcoded values

**Validates: Requirements 9.7**

**Property 30: Excel Sheet Protection (Conditional)**

*For any* Excel report where sheet protection is enabled, all sheets must be protected from editing

**Validates: Requirements 9.8**

**Property 31: Previous Period Balance Continuity**

*For any* report period, the starting balance (Saldo Awal) must equal the ending balance (Saldo Akhir) of the previous period for the same RT

**Validates: Requirements 10.1**

**Property 32: Period Date Validation**

*For any* report request, if the start date is not before the end date, the system must reject the request with an error

**Validates: Requirements 10.5**

**Property 33: Empty Period Handling**

*For any* report period with no transactions, the system must generate a valid report with zero amounts for income and expense

**Validates: Requirements 10.6** (edge case)

**Property 34: Unique Document Numbers**

*For any* two reports generated by the system, their document numbers must be unique

**Validates: Requirements 11.2**

**Property 35: QR Code (Conditional)**

*For any* report where QR code feature is enabled, the document must contain a QR code for verification

**Validates: Requirements 11.1**

**Property 36: Report Generation Metadata**

*For any* report, the system must record who generated it and when it was generated

**Validates: Requirements 11.3**

**Property 37: Permission Validation**

*For any* report generation request, if the user does not have "financial_reports:generate" permission, the request must be rejected

**Validates: Requirements 12.3**

**Property 38: Required Parameters Validation**

*For any* report generation request missing required parameters (rtId, startDate, or endDate), the system must return a validation error

**Validates: Requirements 12.4**

**Property 39: Response Headers**

*For any* successful report generation, the response must have appropriate Content-Type header (application/pdf or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet) and Content-Disposition header with filename

**Validates: Requirements 12.5, 12.6, 12.7**

**Property 40: Error Handling**

*For any* report generation that fails due to system error, the system must return an appropriate error message

**Validates: Requirements 12.8**

**Property 41: Data Serialization Round-Trip**

*For any* valid report data structure, serializing to PDF or Excel format and then parsing the content back should preserve all critical financial data (amounts, dates, names)

**Validates: Requirements 13.1, 13.2, 13.3, 13.5**

## Error Handling

### Validation Errors

1. **Invalid Period**: Return 400 Bad Request if start date >= end date
2. **Missing Parameters**: Return 400 Bad Request if required parameters are missing
3. **Invalid RT ID**: Return 404 Not Found if RT does not exist
4. **Permission Denied**: Return 403 Forbidden if user lacks permission

### Data Errors

1. **Balance Mismatch**: Throw exception if calculated balance doesn't match expected
2. **Missing Officials**: Log warning and use placeholder if RT official names are missing
3. **No Previous Balance**: Use 0 as starting balance if no previous period exists

### Generation Errors

1. **PDF Generation Failure**: Return 500 Internal Server Error with error details
2. **Excel Generation Failure**: Return 500 Internal Server Error with error details
3. **Database Query Failure**: Return 500 Internal Server Error

### Error Response Format

```typescript
{
  "statusCode": 400,
  "message": "Invalid period: start date must be before end date",
  "error": "Bad Request"
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of report generation with known data
- Edge cases (empty periods, missing logos, single transaction)
- Error conditions (invalid dates, missing permissions)
- Integration between components

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs (balance calculations, sorting, formatting)
- Comprehensive input coverage through randomization
- Data integrity across various scenarios

### Property-Based Testing Configuration

- **Library**: Use `fast-check` for TypeScript/NestJS
- **Iterations**: Minimum 100 iterations per property test
- **Tagging**: Each property test must reference its design document property

Example tag format:
```typescript
// Feature: professional-financial-reports, Property 1: Balance Calculation Invariant
```

### Test Organization

```
src/
├── report/
│   ├── report.service.spec.ts           # Unit tests
│   ├── balance-calculation.property.spec.ts  # Property test for Property 1
│   ├── transaction-integrity.property.spec.ts # Property test for Property 5
│   ├── currency-formatting.property.spec.ts   # Property test for Property 8
│   └── report.integration.spec.ts       # Integration tests
```

### Key Test Scenarios

**Unit Tests:**
1. Generate report with sample data and verify structure
2. Test empty period handling
3. Test missing logo scenario
4. Test permission validation
5. Test error responses

**Property Tests:**
1. Balance calculation invariant (Property 1)
2. Transaction data integrity (Property 5)
3. Currency formatting consistency (Property 8)
4. Date formatting consistency (Property 9)
5. Sorting properties (Properties 6, 7)
6. Round-trip serialization (Property 41)

**Integration Tests:**
1. End-to-end PDF generation
2. End-to-end Excel generation
3. Multi-page PDF handling
4. Database query integration
5. Permission guard integration

### Example Property Test

```typescript
import fc from 'fast-check';

describe('ReportService Property Tests', () => {
  // Feature: professional-financial-reports, Property 1: Balance Calculation Invariant
  it('should maintain balance calculation invariant for all reports', () => {
    fc.assert(
      fc.property(
        fc.record({
          saldoAwal: fc.integer({ min: 0, max: 100000000 }),
          incomeTransactions: fc.array(fc.record({
            amount: fc.integer({ min: 1000, max: 1000000 }),
          })),
          expenseTransactions: fc.array(fc.record({
            amount: fc.integer({ min: 1000, max: 1000000 }),
          })),
        }),
        (data) => {
          const totalIncome = data.incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
          const totalExpense = data.expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
          const expectedBalance = data.saldoAwal + totalIncome - totalExpense;
          
          const reportData = {
            summary: {
              saldoAwal: data.saldoAwal,
              totalIncome,
              totalExpense,
              saldoAkhir: expectedBalance,
            },
          };
          
          // Validate
          expect(() => validator.validateReportData(reportData)).not.toThrow();
          expect(reportData.summary.saldoAkhir).toBe(expectedBalance);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```
