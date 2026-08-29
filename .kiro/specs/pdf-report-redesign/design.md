# Design Document: PDF Report Redesign

## Overview

Sistem PDF generation WargaNet saat ini menggunakan PDFKit dengan pendekatan programmatic drawing yang menghasilkan layout tabel sederhana. Design ini akan mengganti PDFKit dengan Puppeteer + HTML/CSS untuk menghasilkan laporan keuangan RT yang profesional, formal, dan mudah dimaintain.

Pendekatan HTML/CSS memberikan keuntungan:
- Desain visual yang lebih fleksibel dan modern
- Maintenance lebih mudah (edit HTML/CSS vs edit drawing code)
- Styling yang konsisten dengan CSS
- Support untuk responsive design dan print media queries
- Lebih mudah untuk iterasi desain di masa depan

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ReportController                          │
│  (Existing - no changes to API endpoints)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    ReportService                             │
│  (Existing - fetches and processes data)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ ReportData
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              PdfGeneratorService (NEW)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Load & encode logos (base64)                     │  │
│  │  2. Render HTML template with data                   │  │
│  │  3. Launch Puppeteer browser                         │  │
│  │  4. Generate PDF from HTML                           │  │
│  │  5. Cleanup resources                                │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ PDF Buffer
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Response                             │
│  (application/pdf with proper headers)                      │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

**PdfGeneratorService** (Refactored)
- Orchestrates PDF generation process
- Manages Puppeteer browser lifecycle
- Handles logo loading and base64 encoding
- Renders HTML templates with data injection
- Implements error handling and resource cleanup

**TemplateRenderer** (New Helper)
- Renders HTML templates with data
- Handles safe data injection (XSS prevention)
- Formats dates and currency
- Generates document numbers

**AssetManager** (New Helper)
- Loads logo files from filesystem
- Converts images to base64 for HTML embedding
- Handles missing files with placeholders
- Supports dual-logo configuration

**BrowserPool** (Future Enhancement - Optional)
- Manages Puppeteer browser instances
- Implements connection pooling for performance
- Handles concurrent requests
- Note: Start with single instance, add pooling if needed

## Template System Design

### Template Structure

Template system menggunakan template literals (JavaScript template strings) untuk simplicity dan performance. Tidak perlu external template engine seperti Handlebars atau EJS.

```
templates/
├── financial-report.template.ts    # Main template
├── styles/
│   └── report.styles.ts           # CSS styles
└── helpers/
    ├── formatters.ts              # Date/currency formatters
    └── generators.ts              # Document number generator
```

### Main Template Structure

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Keuangan RT</title>
  <style>
    /* Inline CSS untuk print-friendly PDF */
    ${CSS_STYLES}
  </style>
</head>
<body>
  <!-- Header (repeated on every page) -->
  <header class="report-header">
    <!-- Logo(s) and RT Info -->
  </header>
  
  <!-- Main Content -->
  <main>
    <!-- Title Section -->
    <section class="title-section">
      <!-- Document title, period, document number -->
    </section>
    
    <!-- Financial Summary Box -->
    <section class="summary-section">
      <!-- Opening balance, income, expense, closing balance -->
    </section>
    
    <!-- Income Details Table -->
    <section class="income-section">
      <!-- Income transactions table -->
    </section>
    
    <!-- Expense Details Table -->
    <section class="expense-section">
      <!-- Expense transactions table -->
    </section>
    
    <!-- Category Summary -->
    <section class="category-section">
      <!-- Category recap -->
    </section>
    
    <!-- Signature Section -->
    <section class="signature-section">
      <!-- Ketua, Sekretaris, Bendahara -->
    </section>
  </main>
  
  <!-- Footer (repeated on every page) -->
  <footer class="report-footer">
    <!-- Generated date and page numbers -->
  </footer>
</body>
</html>
```

### CSS Design Approach

CSS akan menggunakan print media queries untuk optimal PDF output:

```css
/* Base styles */
@page {
  size: A4;
  margin: 50px;
}

body {
  font-family: 'Helvetica', 'Arial', 'Inter', sans-serif;
  font-size: 12px;
  line-height: 1.5;
  color: #000;
  max-width: 800px;
  margin: 0 auto;
}

/* Header styles - repeated on every page */
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 3px solid #000;
  margin-bottom: 24px;
}

/* Financial summary box - modern card design */
.summary-box {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

/* Table styles - clean horizontal borders */
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
}

thead {
  background-color: #f1f1f1;
}

th, td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

/* Page break control */
.section {
  page-break-inside: avoid;
}

table {
  page-break-inside: auto;
}

tr {
  page-break-inside: avoid;
  page-break-after: auto;
}

thead {
  display: table-header-group; /* Repeat on every page */
}

/* Footer - repeated on every page */
.report-footer {
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  font-size: 10px;
  color: #666;
}
```

## Service Layer Design

### PdfGeneratorService Refactoring

```typescript
@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private readonly ASSETS_PATH = path.join(process.cwd(), 'apps/backend/assets');
  
  constructor(
    private readonly templateRenderer: TemplateRenderer,
    private readonly assetManager: AssetManager,
  ) {}

  /**
   * Generate PDF dari ReportData menggunakan Puppeteer
   * Requirements: 1.1, 1.2, 10.1, 10.2
   */
  async generate(data: ReportData): Promise<Buffer> {
    let browser: Browser | null = null;
    
    try {
      // 1. Load and encode logos
      const logos = await this.assetManager.loadLogos(data.rtInfo);
      
      // 2. Render HTML template
      const html = this.templateRenderer.render(data, logos);
      
      // 3. Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const page = await browser.newPage();
      
      // 4. Set content and generate PDF
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '50px',
          right: '50px',
          bottom: '50px',
          left: '50px',
        },
        displayHeaderFooter: true,
        headerTemplate: this.templateRenderer.renderHeader(data.rtInfo, logos),
        footerTemplate: this.templateRenderer.renderFooter(data.generatedAt),
      });
      
      return pdfBuffer;
      
    } catch (error) {
      this.logger.error('PDF generation failed', error);
      throw new ServiceUnavailableException('Gagal generate PDF');
    } finally {
      // 5. Cleanup resources
      if (browser) {
        await browser.close();
      }
    }
  }
}
```

### TemplateRenderer Helper

```typescript
@Injectable()
export class TemplateRenderer {
  /**
   * Render complete HTML document
   * Requirements: 11.1, 11.2, 11.3, 11.5
   */
  render(data: ReportData, logos: LogoData): string {
    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Laporan Keuangan RT</title>
        <style>${this.getStyles()}</style>
      </head>
      <body>
        <main>
          ${this.renderTitle(data.period, data.documentNumber)}
          ${this.renderSummary(data.summary)}
          ${this.renderIncomeTable(data.incomeTransactions)}
          ${this.renderExpenseTable(data.expenseTransactions)}
          ${this.renderCategoryRecap(data.categoryRecap)}
          ${this.renderSignatures(data.rtInfo, data.generatedAt)}
        </main>
      </body>
      </html>
    `;
  }

  /**
   * Render header template (for Puppeteer headerTemplate)
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  renderHeader(rtInfo: RtInfo, logos: LogoData): string {
    return `
      <div style="width: 100%; padding: 20px; border-bottom: 3px solid #000;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          ${logos.left ? `<img src="${logos.left}" style="height: 70px;" />` : ''}
          <div style="text-align: center; flex: 1;">
            <h1 style="margin: 0; font-size: 18px;">${this.escape(rtInfo.name.toUpperCase())}</h1>
            <p style="margin: 4px 0; font-size: 11px;">${this.escape(rtInfo.kelurahan)}, ${this.escape(rtInfo.kecamatan)}, ${this.escape(rtInfo.kota)}</p>
            <p style="margin: 4px 0; font-size: 11px;">${this.escape(rtInfo.address)}</p>
            ${rtInfo.phone ? `<p style="margin: 4px 0; font-size: 11px;">Telp: ${this.escape(rtInfo.phone)}</p>` : ''}
          </div>
          ${logos.right ? `<img src="${logos.right}" style="height: 70px;" />` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render footer template (for Puppeteer footerTemplate)
   * Requirements: 8.1, 8.2
   */
  renderFooter(generatedAt: Date): string {
    return `
      <div style="width: 100%; text-align: center; font-size: 10px; color: #666; padding: 10px;">
        <p style="margin: 0;">Dicetak: ${this.formatDate(generatedAt)}</p>
        <p style="margin: 4px 0;">Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></p>
      </div>
    `;
  }

  /**
   * Render title section
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  private renderTitle(period: Period, documentNumber?: string): string {
    const docNum = documentNumber || this.generateDocumentNumber(period);
    
    return `
      <section class="title-section">
        <h2 class="main-title">LAPORAN KEUANGAN RT</h2>
        <p class="period">Periode: ${this.formatDate(period.startDate)} – ${this.formatDate(period.endDate)}</p>
        <p class="doc-number">No Dokumen: ${this.escape(docNum)}</p>
      </section>
    `;
  }

  /**
   * Render financial summary box
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
   */
  private renderSummary(summary: Summary): string {
    return `
      <section class="summary-section">
        <h3>RINGKASAN KEUANGAN</h3>
        <div class="summary-box">
          <div class="summary-row">
            <span>Saldo Awal</span>
            <span class="amount">${this.formatCurrency(summary.saldoAwal)}</span>
          </div>
          <div class="summary-row">
            <span>Total Pemasukan</span>
            <span class="amount">${this.formatCurrency(summary.totalIncome)}</span>
          </div>
          <div class="summary-row">
            <span>Total Pengeluaran</span>
            <span class="amount">${this.formatCurrency(summary.totalExpense)}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-row summary-total">
            <span>Saldo Akhir</span>
            <span class="amount">${this.formatCurrency(summary.saldoAkhir)}</span>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Render income transactions table
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
   */
  private renderIncomeTable(transactions: IncomeTransaction[]): string {
    if (transactions.length === 0) {
      return `
        <section class="income-section">
          <h3>RINCIAN PEMASUKAN</h3>
          <p class="no-data">Tidak ada data</p>
        </section>
      `;
    }

    const rows = transactions.map(t => `
      <tr>
        <td class="text-center">${this.formatDateShort(t.paymentDate)}</td>
        <td>${this.escape(t.residentName)}</td>
        <td>${this.escape(t.feeTypeName)}</td>
        <td class="text-center">${this.escape(t.period)}</td>
        <td>${this.escape(t.paymentMethod)}</td>
        <td class="text-right">${this.formatCurrency(t.amount)}</td>
        <td>${this.escape(t.notes || '-')}</td>
      </tr>
    `).join('');

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    return `
      <section class="income-section">
        <h3>RINCIAN PEMASUKAN</h3>
        <table>
          <thead>
            <tr>
              <th class="text-center">Tanggal</th>
              <th>Nama Warga</th>
              <th>Jenis Iuran</th>
              <th class="text-center">Periode</th>
              <th>Metode</th>
              <th class="text-right">Nominal</th>
              <th>Ket</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td colspan="5" class="text-right"><strong>TOTAL</strong></td>
              <td class="text-right"><strong>${this.formatCurrency(total)}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  /**
   * Render expense transactions table
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
   */
  private renderExpenseTable(transactions: ExpenseTransaction[]): string {
    if (transactions.length === 0) {
      return `
        <section class="expense-section">
          <h3>RINCIAN PENGELUARAN</h3>
          <p class="no-data">Tidak ada data</p>
        </section>
      `;
    }

    const rows = transactions.map(t => `
      <tr>
        <td class="text-center">${this.formatDateShort(t.expenseDate)}</td>
        <td>${this.escape(t.description)}</td>
        <td>${this.escape(t.categoryName)}</td>
        <td class="text-right">${this.formatCurrency(t.amount)}</td>
        <td>${this.escape(t.notes || '-')}</td>
        <td>${this.escape(t.approvedByName || '-')}</td>
      </tr>
    `).join('');

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    return `
      <section class="expense-section">
        <h3>RINCIAN PENGELUARAN</h3>
        <table>
          <thead>
            <tr>
              <th class="text-center">Tanggal</th>
              <th>Jenis Pengeluaran</th>
              <th>Kategori</th>
              <th class="text-right">Nominal</th>
              <th>Keterangan</th>
              <th>Disetujui Oleh</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td colspan="3" class="text-right"><strong>TOTAL</strong></td>
              <td class="text-right"><strong>${this.formatCurrency(total)}</strong></td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  /**
   * Render category recap section
   * Requirements: 6.1, 6.2, 6.3, 6.4
   */
  private renderCategoryRecap(recap: CategoryRecap[]): string {
    if (recap.length === 0) {
      return '';
    }

    const sorted = [...recap].sort((a, b) => 
      a.categoryName.localeCompare(b.categoryName, 'id-ID')
    );

    const rows = sorted.map(c => `
      <div class="category-row">
        <span>${this.escape(c.categoryName)}</span>
        <span class="dots"></span>
        <span class="amount">${this.formatCurrency(c.total)}</span>
      </div>
    `).join('');

    const total = sorted.reduce((sum, c) => sum + c.total, 0);

    return `
      <section class="category-section">
        <h3>REKAP PER KATEGORI</h3>
        <div class="category-list">
          ${rows}
          <div class="category-row category-total">
            <span><strong>TOTAL</strong></span>
            <span class="dots"></span>
            <span class="amount"><strong>${this.formatCurrency(total)}</strong></span>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Render signature section
   * Requirements: 8.3, 8.4, 8.5, 8.6
   */
  private renderSignatures(rtInfo: RtInfo, generatedAt: Date): string {
    return `
      <section class="signature-section">
        <p class="signature-header">Mengetahui,</p>
        <div class="signature-grid">
          <div class="signature-block">
            <p class="signature-title">Ketua RT</p>
            <div class="signature-space"></div>
            <p class="signature-name">${this.escape(rtInfo.ketuaName)}</p>
          </div>
          <div class="signature-block">
            <p class="signature-title">Sekretaris RT</p>
            <div class="signature-space"></div>
            <p class="signature-name">${this.escape(rtInfo.sekretarisName)}</p>
          </div>
          <div class="signature-block">
            <p class="signature-title">Bendahara RT</p>
            <div class="signature-space"></div>
            <p class="signature-name">${this.escape(rtInfo.bendaharaName)}</p>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Get complete CSS styles
   */
  private getStyles(): string {
    return REPORT_STYLES; // Imported from styles file
  }

  /**
   * Format currency dengan Intl.NumberFormat
   * Requirements: 9.1, 9.2, 9.3
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format date dengan format Indonesia formal
   * Requirements: 9.4
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  /**
   * Format date dengan format short
   * Requirements: 9.4
   */
  private formatDateShort(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  /**
   * Generate document number
   * Requirements: 3.3
   */
  private generateDocumentNumber(period: Period): string {
    const month = String(period.endDate.getMonth() + 1).padStart(2, '0');
    const year = String(period.endDate.getFullYear()).slice(-2);
    const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `LK-RT04-${month}${year}-${sequence}`;
  }

  /**
   * Escape HTML untuk prevent XSS
   * Requirements: 11.5
   */
  private escape(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
```

### AssetManager Helper

```typescript
@Injectable()
export class AssetManager {
  private readonly logger = new Logger(AssetManager.name);
  private readonly ASSETS_PATH = path.join(process.cwd(), 'apps/backend/assets');
  
  /**
   * Load logos and convert to base64
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
   */
  async loadLogos(rtInfo: RtInfo): Promise<LogoData> {
    const logos: LogoData = {
      left: null,
      right: null,
    };

    try {
      // Load Bekasi logo (left)
      const bekasiPath = path.join(this.ASSETS_PATH, 'logos/logo-bekasi.jpg');
      if (fs.existsSync(bekasiPath)) {
        logos.left = await this.imageToBase64(bekasiPath);
      }

      // Load SMR logo (right)
      const smrPath = path.join(this.ASSETS_PATH, 'logos/bekasi/logo-smr2.png');
      if (fs.existsSync(smrPath)) {
        logos.right = await this.imageToBase64(smrPath);
      }

      // If no logos found, use placeholder
      if (!logos.left && !logos.right) {
        this.logger.warn('No logos found, using placeholder');
        logos.left = this.getPlaceholderLogo();
      }

    } catch (error) {
      this.logger.error('Failed to load logos', error);
      logos.left = this.getPlaceholderLogo();
    }

    return logos;
  }

  /**
   * Convert image file to base64 data URI
   * Requirements: 12.3
   */
  private async imageToBase64(filePath: string): Promise<string> {
    const buffer = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }

  /**
   * Get placeholder logo as base64 SVG
   * Requirements: 12.2
   */
  private getPlaceholderLogo(): string {
    const svg = `
      <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="60" fill="#e0e0e0"/>
        <text x="30" y="35" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">
          LOGO
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}

interface LogoData {
  left: string | null;
  right: string | null;
}
```

## Data Flow

```
1. HTTP Request
   ↓
2. ReportController.generatePdf()
   ↓
3. ReportService.generateReport()
   - Fetch data from database
   - Calculate summaries
   - Format transactions
   ↓
4. ReportData object
   ↓
5. PdfGeneratorService.generate(data)
   ├─→ AssetManager.loadLogos()
   │   - Load logo files
   │   - Convert to base64
   │   - Return LogoData
   ├─→ TemplateRenderer.render(data, logos)
   │   - Inject data into HTML template
   │   - Apply CSS styles
   │   - Return HTML string
   ├─→ Puppeteer.launch()
   │   - Start headless browser
   ├─→ page.setContent(html)
   │   - Load HTML into browser
   ├─→ page.pdf()
   │   - Generate PDF from HTML
   │   - Apply print settings
   └─→ browser.close()
       - Cleanup resources
   ↓
6. PDF Buffer
   ↓
7. HTTP Response (application/pdf)
```

## Components and Interfaces

### Core Interfaces (Existing - No Changes)

```typescript
// From report-data.interface.ts
interface ReportData {
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
  includeWatermark?: boolean;
  includeQrCode?: boolean;
}
```

### New Interfaces

```typescript
// Logo data for template rendering
interface LogoData {
  left: string | null;  // Base64 data URI
  right: string | null; // Base64 data URI
}

// Puppeteer PDF options
interface PdfOptions {
  format: 'A4';
  printBackground: boolean;
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  displayHeaderFooter: boolean;
  headerTemplate: string;
  footerTemplate: string;
}
```

## Data Models

No new database models required. Existing ReportData interface is sufficient.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: HTML Template Generation

*For any* valid ReportData object, the template renderer should generate valid HTML that contains all required sections (header, title, summary, transactions, signatures, footer).

**Validates: Requirements 1.1, 11.2**

### Property 2: Currency Formatting Consistency

*For any* monetary amount in the report, the formatted currency should use Intl.NumberFormat with Indonesian locale and should not contain duplicate "Rp" prefixes.

**Validates: Requirements 9.1, 9.2**

### Property 3: Date Formatting Consistency

*For any* date value in the report, all dates should be formatted using consistent Indonesian date format (either "DD Month YYYY" or "DD/MM/YYYY" depending on context).

**Validates: Requirements 9.4**

### Property 4: XSS Prevention

*For any* user-provided text data (names, descriptions, notes), the rendered HTML should escape special characters (<, >, &, ", ') to prevent XSS vulnerabilities.

**Validates: Requirements 11.5**

### Property 5: Logo Loading Resilience

*For any* logo file path (valid or invalid), the system should either load the logo as base64 or use a placeholder, never failing the entire PDF generation.

**Validates: Requirements 12.2, 12.5**

### Property 6: Resource Cleanup

*For any* PDF generation attempt (successful or failed), the Puppeteer browser instance should be properly closed to prevent memory leaks.

**Validates: Requirements 13.2, 13.5**

### Property 7: Empty Data Handling

*For any* report with zero transactions in a section, the system should display "Tidak ada data" message instead of rendering an empty table.

**Validates: Requirements 9.5, 6.4**

### Property 8: API Backward Compatibility

*For any* existing API endpoint that previously used PDFKit, the endpoint should continue to work with the same request/response format after migrating to Puppeteer.

**Validates: Requirements 10.2, 10.4, 10.5**

### Property 9: Dual Logo Support

*For any* RT configuration with two logos, both logos should be displayed in the header with proper spacing (left and right positions).

**Validates: Requirements 2.5, 10.3, 12.4**

### Property 10: Document Number Format

*For any* generated report, the document number should match the pattern "LK-RT04-MMYY-XXX" where MM is month, YY is year, and XXX is a sequence number.

**Validates: Requirements 3.3**

### Property 11: Multi-Page Header Consistency

*For any* report that spans multiple pages, the header should appear consistently on all pages with the same content and styling.

**Validates: Requirements 2.4, 7.1**

### Property 12: Multi-Page Footer Consistency

*For any* report that spans multiple pages, the footer should appear on every page with correct page numbers in format "Halaman X dari Y".

**Validates: Requirements 7.2, 7.5, 8.2**

### Property 13: Table Header Repetition

*For any* transaction table that spans multiple pages, the table header row should be repeated at the top of each new page.

**Validates: Requirements 5.6, 7.3**

### Property 14: Performance Requirement

*For any* report with up to 500 transactions, PDF generation should complete within 10 seconds.

**Validates: Requirements 13.1**

### Property 15: Error Handling

*For any* error during PDF generation (Puppeteer launch failure, template rendering error, file system error), the system should return a descriptive error message and clean up resources.

**Validates: Requirements 14.2, 14.3, 14.4, 14.5**

## Error Handling

### Error Categories

**1. Asset Loading Errors**
- Missing logo files
- Invalid image formats
- File system permission errors

**Strategy**: Log warning, use placeholder, continue generation

```typescript
try {
  const logo = await this.loadLogo(path);
  return logo;
} catch (error) {
  this.logger.warn(`Failed to load logo: ${path}`, error);
  return this.getPlaceholderLogo();
}
```

**2. Template Rendering Errors**
- Invalid data structure
- Missing required fields
- Type mismatches

**Strategy**: Validate data early, throw BadRequestException with descriptive message

```typescript
if (!data.rtInfo || !data.period) {
  throw new BadRequestException('Invalid report data: missing required fields');
}
```

**3. Puppeteer Errors**
- Browser launch failure
- Page load timeout
- PDF generation failure

**Strategy**: Throw ServiceUnavailableException, ensure cleanup in finally block

```typescript
try {
  browser = await puppeteer.launch(options);
  // ... generate PDF
} catch (error) {
  this.logger.error('Puppeteer error', error);
  throw new ServiceUnavailableException('PDF generation service unavailable');
} finally {
  if (browser) {
    await browser.close();
  }
}
```

**4. File System Errors**
- Disk full
- Permission denied
- Path not found

**Strategy**: Log error, throw InternalServerErrorException

```typescript
try {
  await fs.promises.readFile(path);
} catch (error) {
  this.logger.error('File system error', error);
  throw new InternalServerErrorException('Failed to access file system');
}
```

### Error Response Format

```typescript
{
  statusCode: 503,
  message: 'PDF generation service unavailable',
  error: 'Service Unavailable',
  timestamp: '2026-02-10T10:30:00.000Z',
  path: '/api/v1/reports/pdf'
}
```

### Logging Strategy

**Log Levels**:
- ERROR: Puppeteer failures, file system errors
- WARN: Missing logos, invalid data (non-critical)
- INFO: PDF generation start/complete, performance metrics
- DEBUG: Template rendering details, data transformation

**Log Format**:
```typescript
this.logger.error('PDF generation failed', {
  error: error.message,
  stack: error.stack,
  reportData: {
    rtId: data.rtInfo.id,
    period: `${data.period.startDate} - ${data.period.endDate}`,
    transactionCount: data.incomeTransactions.length + data.expenseTransactions.length,
  },
});
```

## Testing Strategy

### Unit Tests

**PdfGeneratorService**
- Test PDF generation with valid data
- Test error handling for Puppeteer failures
- Test resource cleanup (browser.close called)
- Test with missing logos (placeholder used)
- Test with dual logos (both displayed)

**TemplateRenderer**
- Test HTML generation with complete data
- Test HTML generation with empty transactions
- Test XSS prevention (special characters escaped)
- Test currency formatting (no duplicate Rp)
- Test date formatting consistency
- Test document number generation format

**AssetManager**
- Test logo loading with valid PNG file
- Test logo loading with valid JPG file
- Test logo loading with missing file (placeholder)
- Test logo loading with invalid path (error handling)
- Test base64 conversion accuracy

### Integration Tests

**End-to-End PDF Generation**
- Test complete flow from ReportData to PDF Buffer
- Test with realistic data (100+ transactions)
- Test multi-page document generation
- Test with dual logos configuration
- Test with single logo configuration
- Test with no logos (placeholder)

**API Endpoint Tests**
- Test /api/v1/reports/pdf endpoint
- Test response headers (Content-Type: application/pdf)
- Test response status codes
- Test error responses
- Test backward compatibility with existing clients

### Property-Based Tests

**Property 1: HTML Validity**
```typescript
// For any valid ReportData, generated HTML should be valid
fc.assert(
  fc.property(reportDataArbitrary, async (data) => {
    const html = renderer.render(data, logos);
    const isValid = validateHtml(html);
    expect(isValid).toBe(true);
  })
);
```

**Property 2: Currency Formatting**
```typescript
// For any amount, formatted currency should not have duplicate Rp
fc.assert(
  fc.property(fc.integer(), (amount) => {
    const formatted = renderer.formatCurrency(amount);
    const rpCount = (formatted.match(/Rp/g) || []).length;
    expect(rpCount).toBe(1);
  })
);
```

**Property 3: XSS Prevention**
```typescript
// For any string with special characters, output should be escaped
fc.assert(
  fc.property(fc.string(), (input) => {
    const escaped = renderer.escape(input);
    expect(escaped).not.toContain('<script>');
    expect(escaped).not.toContain('</script>');
  })
);
```

**Property 4: Resource Cleanup**
```typescript
// For any generation attempt, browser should be closed
fc.assert(
  fc.property(reportDataArbitrary, async (data) => {
    const browserCloseSpy = jest.spyOn(browser, 'close');
    try {
      await service.generate(data);
    } catch (error) {
      // Even on error
    }
    expect(browserCloseSpy).toHaveBeenCalled();
  })
);
```

### Visual Regression Tests (Optional)

**Using Puppeteer Screenshots**
- Generate PDF for baseline report
- Convert PDF to images
- Compare with reference images
- Detect visual changes

**Tools**: jest-image-snapshot, pixelmatch

### Performance Tests

**Load Testing**
- Test with 500 transactions (should complete < 10 seconds)
- Test concurrent requests (5 simultaneous)
- Test memory usage (no leaks after 100 generations)

**Metrics to Track**:
- PDF generation time
- Memory usage per generation
- Browser launch time
- Template rendering time

### Manual Testing Checklist

- [ ] Visual inspection of generated PDF
- [ ] Print test (ensure no cut-off elements)
- [ ] Multi-page document (headers/footers on all pages)
- [ ] Dual logo display (both logos visible)
- [ ] Empty data handling (appropriate messages)
- [ ] Long text handling (no overflow)
- [ ] Special characters in names/descriptions
- [ ] Date formatting consistency
- [ ] Currency formatting consistency
- [ ] Signature section layout
- [ ] Category summary format

## Migration Strategy

### Phase 1: Preparation (Week 1)

**Tasks**:
1. Install Puppeteer dependency
2. Create new service files (TemplateRenderer, AssetManager)
3. Write HTML template and CSS styles
4. Write unit tests for new services

**Deliverables**:
- Puppeteer installed and configured
- Template system implemented
- Unit tests passing

### Phase 2: Implementation (Week 2)

**Tasks**:
1. Refactor PdfGeneratorService to use Puppeteer
2. Implement logo loading and base64 encoding
3. Implement HTML template rendering
4. Write integration tests

**Deliverables**:
- PdfGeneratorService refactored
- Integration tests passing
- Side-by-side comparison with old PDFKit output

### Phase 3: Testing (Week 3)

**Tasks**:
1. Run property-based tests
2. Perform visual regression testing
3. Conduct performance testing
4. Manual testing and QA

**Deliverables**:
- All tests passing
- Performance benchmarks met
- Visual quality approved

### Phase 4: Deployment (Week 4)

**Tasks**:
1. Deploy to staging environment
2. Conduct user acceptance testing
3. Deploy to production
4. Monitor for errors

**Deliverables**:
- Production deployment complete
- Monitoring dashboards updated
- Documentation updated

### Rollback Plan

**If issues occur in production**:
1. Revert to previous version (PDFKit)
2. Investigate root cause
3. Fix issues in development
4. Re-deploy after testing

**Rollback Trigger**:
- Error rate > 5%
- Performance degradation > 50%
- User complaints about PDF quality

### Migration Checklist

- [ ] Puppeteer installed and tested
- [ ] Template system implemented
- [ ] Logo loading working
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Property tests written and passing
- [ ] Performance tests passing
- [ ] Visual quality approved
- [ ] API backward compatibility verified
- [ ] Error handling tested
- [ ] Resource cleanup verified
- [ ] Documentation updated
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Monitoring in place

## Backward Compatibility

### API Compatibility

**No changes to API endpoints**:
- POST /api/v1/reports/pdf
- Request format: same DTO
- Response format: same (application/pdf)
- Response headers: same

**Example**:
```typescript
// Before (PDFKit)
@Post('pdf')
async generatePdf(@Body() dto: GenerateReportDto): Promise<StreamableFile> {
  const data = await this.reportService.generateReport(dto);
  const pdfBuffer = await this.pdfGenerator.generate(data);
  return new StreamableFile(pdfBuffer, {
    type: 'application/pdf',
    disposition: `attachment; filename="laporan-${dto.startDate}-${dto.endDate}.pdf"`,
  });
}

// After (Puppeteer) - SAME CODE
@Post('pdf')
async generatePdf(@Body() dto: GenerateReportDto): Promise<StreamableFile> {
  const data = await this.reportService.generateReport(dto);
  const pdfBuffer = await this.pdfGenerator.generate(data); // Same interface
  return new StreamableFile(pdfBuffer, {
    type: 'application/pdf',
    disposition: `attachment; filename="laporan-${dto.startDate}-${dto.endDate}.pdf"`,
  });
}
```

### Data Compatibility

**ReportData interface unchanged**:
- All existing fields preserved
- No breaking changes to data structure
- Optional fields remain optional

**Logo handling**:
- Dual logo support maintained
- Logo paths remain the same
- Fallback to placeholder if missing

### Feature Parity

**All existing features preserved**:
- ✅ Dual logo support
- ✅ Multi-page documents
- ✅ Page numbering
- ✅ Signature section
- ✅ Category recap
- ✅ Empty data handling
- ✅ Date formatting
- ✅ Currency formatting

**New features added**:
- ✨ Modern professional layout
- ✨ Better typography
- ✨ Improved visual hierarchy
- ✨ Print-friendly styling
- ✨ Better accessibility

### Testing Backward Compatibility

**Comparison Tests**:
```typescript
describe('Backward Compatibility', () => {
  it('should generate PDF with same data structure', async () => {
    const data = await reportService.generateReport(dto);
    
    // Old way (PDFKit)
    const oldPdf = await oldPdfGenerator.generate(data);
    
    // New way (Puppeteer)
    const newPdf = await newPdfGenerator.generate(data);
    
    // Both should be valid PDFs
    expect(isPdfValid(oldPdf)).toBe(true);
    expect(isPdfValid(newPdf)).toBe(true);
  });

  it('should maintain API endpoint compatibility', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/reports/pdf')
      .send(dto)
      .expect(200)
      .expect('Content-Type', /pdf/);
    
    expect(response.body).toBeInstanceOf(Buffer);
  });
});
```

## Performance Optimization

### Browser Pooling (Future Enhancement)

**Current Approach**: Launch new browser for each request
**Optimized Approach**: Reuse browser instances

```typescript
@Injectable()
export class BrowserPool {
  private browsers: Browser[] = [];
  private readonly MAX_INSTANCES = 3;
  
  async acquire(): Promise<Browser> {
    if (this.browsers.length > 0) {
      return this.browsers.pop()!;
    }
    return await puppeteer.launch(options);
  }
  
  async release(browser: Browser): Promise<void> {
    if (this.browsers.length < this.MAX_INSTANCES) {
      this.browsers.push(browser);
    } else {
      await browser.close();
    }
  }
}
```

**Benefits**:
- Faster PDF generation (no browser launch overhead)
- Better resource utilization
- Handles concurrent requests efficiently

**Trade-offs**:
- More complex code
- Requires connection management
- Potential for stale connections

**Recommendation**: Start without pooling, add if performance issues arise

### Template Caching

**Cache compiled templates**:
```typescript
private templateCache = new Map<string, string>();

private getTemplate(key: string): string {
  if (!this.templateCache.has(key)) {
    this.templateCache.set(key, this.compileTemplate(key));
  }
  return this.templateCache.get(key)!;
}
```

### Asset Caching

**Cache base64-encoded logos**:
```typescript
private logoCache = new Map<string, string>();

async loadLogo(path: string): Promise<string> {
  if (this.logoCache.has(path)) {
    return this.logoCache.get(path)!;
  }
  const base64 = await this.imageToBase64(path);
  this.logoCache.set(path, base64);
  return base64;
}
```

### Performance Targets

- PDF generation: < 10 seconds for 500 transactions
- Browser launch: < 2 seconds
- Template rendering: < 100ms
- Logo loading: < 50ms per logo
- Memory usage: < 200MB per generation
- Concurrent requests: Support 5 simultaneous

## Security Considerations

### XSS Prevention

**All user input must be escaped**:
```typescript
private escape(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
```

**Apply to all dynamic content**:
- Resident names
- Transaction descriptions
- Notes fields
- RT information

### Path Traversal Prevention

**Validate logo paths**:
```typescript
private validateLogoPath(logoPath: string): boolean {
  const normalized = path.normalize(logoPath);
  const assetsPath = path.normalize(this.ASSETS_PATH);
  return normalized.startsWith(assetsPath);
}
```

### Resource Limits

**Prevent DoS attacks**:
- Limit concurrent PDF generations
- Set timeout for Puppeteer operations
- Limit maximum transactions per report
- Validate file sizes for logos

```typescript
const MAX_CONCURRENT = 5;
const PUPPETEER_TIMEOUT = 30000; // 30 seconds
const MAX_TRANSACTIONS = 10000;
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB
```

### Dependency Security

**Keep Puppeteer updated**:
- Monitor security advisories
- Update regularly
- Use npm audit
- Review CVEs

## Deployment Considerations

### Environment Variables

```env
# Puppeteer configuration
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox
PUPPETEER_TIMEOUT=30000

# PDF generation
PDF_MAX_CONCURRENT=5
PDF_GENERATION_TIMEOUT=10000

# Asset paths
ASSETS_PATH=/app/assets
LOGO_CACHE_TTL=3600
```

### Docker Configuration

**Install Chromium in Docker**:
```dockerfile
FROM node:18-alpine

# Install Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy application
COPY . /app
WORKDIR /app

# Install dependencies
RUN npm install

# Start application
CMD ["npm", "run", "start:prod"]
```

### System Requirements

**Minimum**:
- RAM: 2GB
- CPU: 2 cores
- Disk: 1GB for Chromium

**Recommended**:
- RAM: 4GB
- CPU: 4 cores
- Disk: 2GB

### Monitoring

**Metrics to track**:
- PDF generation success rate
- PDF generation duration
- Browser launch failures
- Memory usage
- Concurrent requests
- Error rates by type

**Alerts**:
- Error rate > 5%
- Generation time > 15 seconds
- Memory usage > 80%
- Browser launch failures > 10%

## Summary

This design provides a comprehensive approach to redesigning the PDF report generation system using HTML/CSS and Puppeteer. The key benefits are:

1. **Professional Layout**: Modern, formal design suitable for official RT documents
2. **Maintainability**: HTML/CSS is easier to modify than programmatic drawing
3. **Flexibility**: Easy to add new sections or modify styling
4. **Backward Compatibility**: No breaking changes to API or data structures
5. **Performance**: Optimized for reports with hundreds of transactions
6. **Reliability**: Robust error handling and resource management
7. **Security**: XSS prevention and input validation
8. **Testability**: Comprehensive testing strategy with property-based tests

The migration can be done incrementally with minimal risk, and the system can be rolled back if issues arise. The design maintains all existing features while significantly improving the visual quality and maintainability of the PDF generation system.
