# Implementation Plan: Laporan Keuangan RT Profesional

## Overview

Implementasi fitur generasi laporan keuangan RT profesional dalam format PDF dan Excel. Pendekatan incremental dengan validasi di setiap tahap untuk memastikan akurasi perhitungan keuangan dan kualitas output dokumen.

## Tasks

- [x] 1. Setup dependencies dan module structure
  - Install PDFKit (`pdfkit`, `@types/pdfkit`)
  - Install ExcelJS (`exceljs`)
  - Install fast-check untuk property-based testing (`fast-check`, `@types/fast-check`)
  - Install qrcode untuk QR code generation (`qrcode`, `@types/qrcode`)
  - Create `apps/backend/src/report` module directory
  - Create module file `report.module.ts`
  - Create assets directory structure:
    ```
    apps/backend/assets/
    ├── logos/
    │   ├── default/
    │   │   └── warganet-logo.png
    │   └── rt/
    ├── stamps/
    └── templates/
    ```
  - Add default WargaNet logo to `assets/logos/default/warganet-logo.png`
  - Update `.gitignore` to exclude RT-specific logos but keep default logo:
    ```
    # Exclude RT-specific logos (user uploads)
    apps/backend/assets/logos/rt/*
    !apps/backend/assets/logos/rt/.gitkeep
    
    # Keep default logo
    !apps/backend/assets/logos/default/
    ```
  - _Requirements: 8.1-8.8, 9.1-9.8, 11.1_

- [x] 2. Implement core data models dan DTOs
  - [x] 2.1 Create `dto/generate-report.dto.ts`
    - Define GenerateReportDto with validation decorators
    - Fields: rtId, startDate, endDate, includeWatermark, includeQrCode, status
    - _Requirements: 12.4_
  
  - [x] 2.2 Create `interfaces/report-data.interface.ts`
    - Define ReportData, RtInfo, Period, Summary interfaces
    - Define IncomeTransaction, ExpenseTransaction, CategoryRecap interfaces
    - _Requirements: 3.1-3.8, 4.1-4.7, 5.1-5.7, 6.1-6.6_

- [x] 3. Implement DataFetcherService
  - [x] 3.1 Create `services/data-fetcher.service.ts`
    - Implement fetchReportData() method as main orchestrator
    - Implement fetchRtInfo() to get RT details (name, address, kelurahan, kecamatan, kota, phone)
    - Fetch logoFilename from RT table (jika ada)
    - Implement fetchRtOfficials() to get Ketua, Sekretaris, Bendahara names from User table
    - Implement fetchPreviousBalance() to get saldo akhir from previous period
    - Handle case when no previous period exists (return 0)
    - _Requirements: 1.1-1.4, 7.3, 10.1_
  
  - [x] 3.2 Implement income transactions fetching
    - Implement fetchIncomeTransactions() with filters
    - Filter: approved status only (exclude draft)
    - Filter: non-deleted only (deletedAt is null)
    - Include: family, resident, feeType relations
    - Order by: paymentDate ascending
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [x] 3.3 Implement expense transactions fetching
    - Implement fetchExpenseTransactions() with filters
    - Filter: approved status only (exclude draft)
    - Filter: non-deleted only (deletedAt is null)
    - Include: category, approvedBy relations
    - Order by: expenseDate ascending
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [x] 3.4 Implement calculation methods
    - Implement calculateTotal() for summing transactions
    - Implement groupByCategory() for expense categorization
    - Calculate saldoAkhir = saldoAwal + totalIncome - totalExpense
    - _Requirements: 3.3, 3.4, 3.5, 6.1, 6.3_
  
  - [x] 3.5 Write property test for data fetching
    - **Property 5: Transaction Data Integrity**
    - **Validates: Requirements 4.3, 4.4, 5.3, 5.4**
  
  - [x] 3.6 Write property test for balance calculation
    - **Property 1: Balance Calculation Invariant**
    - **Validates: Requirements 3.5, 10.2**

- [x] 4. Implement ReportValidatorService
  - [x] 4.1 Create `services/report-validator.service.ts`
    - Implement validateReportData() method
    - Validate balance calculation accuracy
    - Validate period dates (start < end)
    - Validate income total matches transaction sum
    - Validate expense total matches transaction sum
    - _Requirements: 10.2, 10.5_
  
  - [x] 4.2 Write unit tests for validator
    - Test balance mismatch detection
    - Test invalid period detection
    - Test total mismatch detection
    - _Requirements: 10.2, 10.5_

- [x] 5. Checkpoint - Ensure data layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement PdfGeneratorService - Core Structure
  - [x] 6.1 Create `services/pdf-generator.service.ts`
    - Implement generate() method skeleton
    - Setup PDFDocument with A4 size and margins
    - Setup buffer collection for streaming
    - _Requirements: 8.1, 8.2_
  
  - [x] 6.2 Implement helper methods
    - Implement formatCurrency() for "Rp X.XXX.XXX" format
    - Implement formatDate() for "DD Month YYYY" format
    - Implement formatDateShort() for "DD/MM/YYYY" format
    - Implement drawTable() for table rendering with borders
    - _Requirements: 3.6, 3.7, 2.4, 4.6_
  
  - [x] 6.3 Write property test for currency formatting
    - **Property 8: Currency Formatting Consistency**
    - **Validates: Requirements 3.6, 3.7**
  
  - [x] 6.4 Write property test for date formatting
    - **Property 9: Date Formatting Consistency**
    - **Property 10: Indonesian Date Format**
    - **Validates: Requirements 2.4, 4.6**

- [x] 7. Implement PdfGeneratorService - Content Sections
  - [x] 7.1 Implement addHeader() method
    - Define ASSETS_PATH constant: `path.join(process.cwd(), 'apps/backend/assets')`
    - Define DEFAULT_LOGO constant: `path.join(ASSETS_PATH, 'logos/default/warganet-logo.png')`
    - Check if rtInfo.logoFilename exists
    - If exists, construct RT logo path: `path.join(ASSETS_PATH, 'logos/rt', rtInfo.logoFilename)`
    - Check if RT logo file exists using fs.existsSync()
    - If RT logo exists, use it; otherwise use DEFAULT_LOGO
    - Add logo image centered at top (60px width)
    - Add RT name (font size 16, bold, centered)
    - Add kelurahan, kecamatan, kota (font size 10, centered)
    - Add address (font size 10, centered)
    - Add phone contact (font size 10, centered)
    - Add horizontal line separator (1px, full width)
    - Add spacing after header
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 7.2 Implement addTitle() method
    - Add "LAPORAN KEUANGAN RT" (font size 14, bold, centered)
    - Format period using formatDate() helper
    - Add period text: "Periode: [start] – [end]" (font size 11, centered)
    - Add spacing after title
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 7.3 Implement addSummary() method
    - Add "RINGKASAN KEUANGAN" heading (font size 12, bold)
    - Create 2-column table (Keterangan | Jumlah)
    - Add 4 data rows with formatted currency
    - Apply bold formatting to last row (Saldo Akhir)
    - Add table borders
    - Add spacing after summary
    - _Requirements: 3.1, 3.2, 3.8_
  
  - [x] 7.4 Implement addIncomeDetails() method
    - Add "RINCIAN PEMASUKAN" heading (font size 12, bold)
    - Create 7-column table with headers
    - Map each transaction to table row with formatted data
    - Add total row at bottom with bold formatting
    - Handle empty transactions case (show "Tidak ada data")
    - Add table borders
    - Add spacing after table
    - _Requirements: 4.1, 4.5_
  
  - [x] 7.5 Implement addExpenseDetails() method
    - Add "RINCIAN PENGELUARAN" heading (font size 12, bold)
    - Create 6-column table with headers
    - Map each transaction to table row with formatted data
    - Add total row at bottom with bold formatting
    - Handle empty transactions case (show "Tidak ada data")
    - Add table borders
    - Add spacing after table
    - _Requirements: 5.1, 5.5_
  
  - [x] 7.6 Implement addCategoryRecap() method
    - Add "REKAP PER KATEGORI" heading (font size 12, bold)
    - Create 2-column table (Kategori | Total)
    - Sort categories alphabetically before rendering
    - Add grand total row at bottom with bold formatting
    - Add table borders
    - Add spacing after table
    - _Requirements: 6.2, 6.4, 6.6_
  
  - [x] 7.7 Implement addSignatures() method
    - Add spacing before signature section
    - Add generation info: "Dibuat di: [kota], Tanggal: [date]" (right-aligned)
    - Add "Mengetahui:" label (centered)
    - Calculate column width for 3 columns
    - Add 3 signature blocks side-by-side:
      - Column 1: "Ketua RT" + name
      - Column 2: "Sekretaris RT" + name
      - Column 3: "Bendahara RT" + name
    - Add spacing for signature area (3 lines)
    - Add QR code if available (bottom right corner)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [x] 7.8 Write property test for required fields
    - **Property 11: Required Header Fields**
    - **Property 13: Report Title Presence**
    - **Property 15: Required Income Columns**
    - **Property 16: Required Expense Columns**
    - **Validates: Requirements 1.1-1.3, 2.1, 4.1, 5.1**

- [x] 8. Implement PdfGeneratorService - Advanced Features
  - [x] 8.1 Implement page numbering
    - Add page numbers to footer (format: "Halaman X dari Y")
    - Position at bottom center of each page
    - Use font size 9
    - _Requirements: 8.4_
  
  - [x] 8.2 Implement multi-page handling
    - Detect when content exceeds page height
    - Auto page break for long tables
    - Repeat table headers on new pages
    - Maintain consistent margins across pages
    - _Requirements: 8.5, 8.6_
  
  - [x] 8.3 Implement optional watermark
    - Add "WargaNet" watermark if includeWatermark flag is true
    - Position diagonally across center of page
    - Use light gray color with transparency
    - Apply to all pages
    - _Requirements: 8.7_
  
  - [x] 8.4 Implement professional fonts
    - Use Helvetica font family (built-in PDFKit font)
    - Use Helvetica-Bold for headings and emphasis
    - Ensure all text is selectable (not image-based)
    - _Requirements: 8.3, 8.8_
  
  - [x] 8.5 Write property tests for PDF features
    - **Property 19: PDF A4 Format**
    - **Property 20: PDF Professional Fonts**
    - **Property 21: PDF Page Numbers**
    - **Property 23: PDF Watermark (Conditional)**
    - **Validates: Requirements 8.1-8.4, 8.7**

- [x] 9. Checkpoint - Ensure PDF generation tests pass
  - Run all PDF-related tests (unit and property tests)
  - Verify PDF output manually with sample data
  - Ensure all tests pass, ask the user if questions arise

- [x] 10. Implement ExcelGeneratorService
  - [x] 10.1 Create `services/excel-generator.service.ts`
    - Implement generate() method skeleton
    - Create ExcelJS workbook instance
    - Call sheet creation methods
    - Return buffer from workbook.xlsx.writeBuffer()
    - _Requirements: 9.1_
  
  - [x] 10.2 Implement createSummarySheet() method
    - Create "Ringkasan" sheet
    - Add header rows: RT name, period (rows 1-3)
    - Add blank row (row 4)
    - Add summary table starting at row 5
    - Headers: Keterangan, Jumlah (bold, row 5)
    - Data rows: Saldo Awal, Total Pemasukan, Total Pengeluaran, Saldo Akhir (rows 6-9)
    - Apply currency format to column B: `"Rp "#,##0`
    - Apply borders to table cells (A5:B9)
    - Bold formatting for header row and Saldo Akhir row
    - Freeze header row (ySplit: 5)
    - Auto-adjust column widths (minimum 20)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 10.3 Implement createIncomeSheet() method
    - Create "Detail Pemasukan" sheet
    - Add column headers: Tanggal, Nama Warga, Jenis Iuran, Periode, Metode Pembayaran, Nominal, Keterangan
    - Bold formatting for header row
    - Add transaction data rows
    - Add total row with SUM formula: `=SUM(F2:F${lastRow})`
    - Bold formatting for total row
    - Apply date format to column A: `dd/mm/yyyy`
    - Apply currency format to column F: `"Rp "#,##0`
    - Apply borders to all table cells
    - Freeze header row (ySplit: 1)
    - Auto-adjust column widths (minimum 15)
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.7_
  
  - [x] 10.4 Implement createExpenseSheet() method
    - Create "Detail Pengeluaran" sheet
    - Add column headers: Tanggal, Jenis Pengeluaran, Kategori, Nominal, Keterangan, Disetujui Oleh
    - Bold formatting for header row
    - Add transaction data rows
    - Add total row with SUM formula: `=SUM(D2:D${lastRow})`
    - Bold formatting for total row
    - Apply date format to column A: `dd/mm/yyyy`
    - Apply currency format to column D: `"Rp "#,##0`
    - Apply borders to all table cells
    - Freeze header row (ySplit: 1)
    - Auto-adjust column widths (minimum 15)
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.7_
  
  - [x] 10.5 Implement createCategorySheet() method
    - Create "Rekap Kategori" sheet
    - Add column headers: Kategori, Total
    - Bold formatting for header row
    - Sort categories alphabetically before adding rows
    - Add category data rows
    - Add grand total row with SUM formula: `=SUM(B2:B${lastRow})`
    - Bold formatting for total row
    - Apply currency format to column B: `"Rp "#,##0`
    - Apply borders to all table cells
    - Freeze header row (ySplit: 1)
    - Auto-adjust column widths (minimum 20)
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.7_
  
  - [x] 10.6 Implement optional sheet protection
    - Check if includeProtection flag is true
    - If true, protect all sheets with password
    - Use password from environment variable or default
    - _Requirements: 9.8_
  
  - [x] 10.7 Implement addBorders() helper method
    - Accept sheet, startRow, endRow, startCol, endCol parameters
    - Loop through cell range
    - Apply thin borders to all sides of each cell
    - Border style: `{ style: 'thin' }`
    - _Requirements: 9.6_
  
  - [x] 10.8 Write property tests for Excel features
    - **Property 25: Excel Sheet Structure**
    - **Property 26: Excel Currency Formatting**
    - **Property 27: Excel Header Formatting**
    - **Property 29: Excel Formula Usage**
    - **Validates: Requirements 9.1, 9.2, 9.4, 9.5, 9.7**

- [-] 11. Implement ReportService - Orchestration
  - [x] 11.1 Create `services/report.service.ts`
    - Inject all dependencies (DataFetcher, Validator, PdfGenerator, ExcelGenerator)
    - Implement generatePdfReport() method
    - Implement generateExcelReport() method
    - _Requirements: All_
  
  - [x] 11.2 Implement document number generation
    - Create generateDocumentNumber() method
    - Format: "LKR-RT[XX]-[MMYYYY]"
    - Extract RT number from rtInfo (e.g., "RT 05" → "05")
    - Use current month and year (format: MMYYYY)
    - Example: "LKR-RT05-022026" for RT 05 in February 2026
    - _Requirements: 11.2_
  
  - [x] 11.3 Implement report metadata recording
    - Add generatedBy field (userId from request)
    - Add generatedAt field (current timestamp)
    - Add documentNumber field (from generateDocumentNumber)
    - Include in ReportData structure before generation
    - _Requirements: 11.3_
  
  - [x] 11.4 Implement optional QR code generation
    - Check if includeQrCode flag is true
    - If true, generate QR code using qrcode library
    - QR code content: verification URL with document number
    - Format: `https://warganet.app/verify-report/${documentNumber}`
    - Generate as base64 data URL for embedding in PDF
    - Add qrCodeDataUrl field to ReportData
    - _Requirements: 11.1_
  
  - [ ] 11.5 Write property test for unique document numbers
    - **Property 34: Unique Document Numbers**
    - Generate multiple reports with different RTs and dates
    - Verify all document numbers are unique
    - **Validates: Requirements 11.2**
  
  - [ ] 11.6 Write integration tests
    - Test end-to-end PDF generation with real database data
    - Test end-to-end Excel generation with real database data
    - Test with empty period (no transactions)
    - Test with QR code enabled
    - Test with watermark enabled
    - Verify generated files are valid (can be opened)
    - _Requirements: 10.6, 11.1**

- [-] 12. Implement ReportController
  - [x] 12.1 Create `report.controller.ts`
    - Add @Controller decorator with route 'api/financial-reports'
    - Add guards: @UseGuards(JwtAuthGuard, PermissionsGuard)
    - Inject ReportService in constructor
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [x] 12.2 Implement POST /pdf endpoint
    - Add @Post('pdf') decorator
    - Add @RequirePermissions('financial_reports:generate') decorator
    - Accept @Body() dto: GenerateReportDto
    - Accept @Req() request to extract user
    - Validate DTO using ValidationPipe (automatic)
    - Extract userId from request.user.id (JWT payload)
    - Call reportService.generatePdfReport(dto, userId)
    - Set response headers:
      - Content-Type: 'application/pdf'
      - Content-Disposition: `attachment; filename="Laporan-Keuangan-RT-${monthYear}.pdf"`
    - Use @Res() response to send buffer: res.send(buffer)
    - _Requirements: 12.1, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [x] 12.3 Implement POST /excel endpoint
    - Add @Post('excel') decorator
    - Add @RequirePermissions('financial_reports:generate') decorator
    - Accept @Body() dto: GenerateReportDto
    - Accept @Req() request to extract user
    - Validate DTO using ValidationPipe (automatic)
    - Extract userId from request.user.id (JWT payload)
    - Call reportService.generateExcelReport(dto, userId)
    - Set response headers:
      - Content-Type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      - Content-Disposition: `attachment; filename="Laporan-Keuangan-RT-${monthYear}.xlsx"`
    - Use @Res() response to send buffer: res.send(buffer)
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [x] 12.4 Implement error handling
    - Wrap controller methods in try-catch blocks
    - Catch BadRequestException → return 400 with error message
    - Catch NotFoundException → return 404 with error message
    - Catch other errors → return 500 with generic error message
    - Use NestJS exception filters for consistent error format
    - Log errors using LoggerService
    - _Requirements: 12.8_
  
  - [ ] 12.5 Write property tests for API validation
    - **Property 37: Permission Validation**
    - **Property 38: Required Parameters Validation**
    - **Property 39: Response Headers**
    - **Validates: Requirements 12.3, 12.4, 12.6, 12.7**

- [-] 13. Wire everything together
  - [x] 13.1 Update report.module.ts
    - Import PrismaModule
    - Import LoggerModule
    - Declare all services as providers:
      - DataFetcherService
      - ReportValidatorService
      - PdfGeneratorService
      - ExcelGeneratorService
      - ReportService
    - Declare ReportController in controllers array
    - Export ReportService for use in other modules
    - _Requirements: All_
  
  - [x] 13.2 Update app.module.ts
    - Import ReportModule
    - Add to imports array
    - _Requirements: All_
  
  - [x] 13.3 Add permission to seed data
    - Open `prisma/seed.ts` or create migration
    - Add 'financial_reports:generate' permission to permissions table
    - Assign permission to appropriate roles:
      - Bendahara RT (should have this permission)
      - Ketua RT (should have this permission)
      - Sekretaris RT (optional, based on requirements)
    - Run seed or migration to update database
    - _Requirements: 12.3_

- [-] 14. Final checkpoint - Integration testing
  - [x] 14.1 Test PDF generation via API
    - Use Postman or curl to test POST /api/financial-reports/pdf
    - Test with valid data (existing RT, valid date range)
    - Test with empty period (no transactions in date range)
    - Test with missing logo (RT without logoFilename)
    - Test with watermark enabled (includeWatermark: true)
    - Test with QR code enabled (includeQrCode: true)
    - Verify file downloads correctly
    - Open PDF and verify:
      - Header displays correctly with logo
      - All sections present (summary, income, expense, category, signatures)
      - Currency formatting is correct
      - Date formatting is correct
      - Page numbers appear (if multi-page)
    - _Requirements: 8.1-8.8_
  
  - [x] 14.2 Test Excel generation via API
    - Use Postman or curl to test POST /api/financial-reports/excel
    - Test with valid data (existing RT, valid date range)
    - Test with empty period (no transactions in date range)
    - Test with sheet protection enabled (if implemented)
    - Verify file downloads correctly
    - Open in Excel/LibreOffice and verify:
      - All 4 sheets present (Ringkasan, Detail Pemasukan, Detail Pengeluaran, Rekap Kategori)
      - Currency formatting applied correctly
      - Date formatting applied correctly
      - Formulas work (SUM formulas calculate correctly)
      - Headers are frozen
      - Borders applied to tables
    - _Requirements: 9.1-9.8_
  
  - [x] 14.3 Test permission guards
    - Test with user without 'financial_reports:generate' permission
    - Should return 403 Forbidden
    - Test with user with permission
    - Should return 200 OK with file
    - _Requirements: 12.3_
  
  - [x] 14.4 Test error scenarios
    - Test with invalid period (startDate >= endDate)
    - Should return 400 Bad Request with error message
    - Test with missing required parameters (no rtId)
    - Should return 400 Bad Request with validation errors
    - Test with non-existent RT (invalid rtId)
    - Should return 404 Not Found
    - Test with invalid date format
    - Should return 400 Bad Request
    - _Requirements: 12.8_
  
  - [ ] 14.5 Write property test for round-trip serialization
    - **Property 41: Data Serialization Round-Trip**
    - Generate report data structure
    - Serialize to PDF and Excel
    - Parse content back (extract text from PDF, read Excel cells)
    - Verify critical financial data preserved:
      - All amounts match
      - All dates match
      - All names match
    - **Validates: Requirements 13.1-13.5**
  
  - [x] 14.6 Run all property tests
    - Execute all property test files
    - Ensure minimum 100 iterations per property
    - Verify all 41 properties pass
    - Fix any failures before marking complete
    - Document any edge cases discovered
    - _Requirements: All_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Run complete test suite: `pnpm test`
  - Verify all unit tests pass
  - Verify all property tests pass
  - Verify all integration tests pass
  - Check test coverage meets requirements
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Focus on data accuracy first (tasks 3-5), then PDF (tasks 6-9), then Excel (task 10)
- Integration tests at the end ensure everything works together

## Implementation Tips

1. **Module Location**: Create module di `apps/backend/src/report/`
2. **Assets Location**: Simpan logo dan assets lain di `apps/backend/assets/`
   - Default logo: `assets/logos/default/warganet-logo.png`
   - RT-specific logos: `assets/logos/rt/rt-001.png`, `assets/logos/rt/rt-002.png`, dll
   - Logo filename disimpan di database RT table (contoh: "rt-001.png")
   - Saat generate report, construct full path: `path.join(ASSETS_PATH, 'logos/rt', logoFilename)`
3. **Database Schema**: Pastikan schema Prisma sudah memiliki field yang dibutuhkan untuk RT officials dan logoFilename
4. **Testing**: Gunakan test data dari seed files yang sudah ada
5. **Error Handling**: Gunakan NestJS built-in exceptions (BadRequestException, NotFoundException, dll)
6. **Logging**: Tambahkan logging untuk debugging report generation
7. **Performance**: Consider caching RT info jika sering diakses
8. **File Naming**: Gunakan format yang konsisten untuk filename download
9. **Logo Fallback**: Selalu gunakan default logo jika RT-specific logo tidak ada atau file tidak ditemukan
