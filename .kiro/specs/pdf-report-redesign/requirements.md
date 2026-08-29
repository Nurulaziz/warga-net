# Requirements Document

## Introduction

Sistem WargaNet saat ini menghasilkan laporan keuangan RT dalam format PDF menggunakan PDFKit dengan layout tabel sederhana yang terlihat seperti raw data export. Fitur ini akan mendesain ulang sistem PDF generation untuk menghasilkan laporan keuangan yang profesional, formal, dan layak untuk didistribusikan kepada 200+ warga RT.

## Glossary

- **PDF_Generator**: Service yang bertanggung jawab menghasilkan dokumen PDF
- **Report_Service**: Service yang mengumpulkan dan memproses data laporan keuangan
- **Puppeteer**: Library Node.js untuk mengontrol headless Chrome/Chromium
- **HTML_Template**: Template HTML yang digunakan sebagai basis layout PDF
- **Letterhead**: Kop surat resmi yang muncul di header dokumen
- **Financial_Summary**: Ringkasan keuangan yang menampilkan saldo awal, total pemasukan, total pengeluaran, dan saldo akhir
- **Category_Summary**: Ringkasan transaksi berdasarkan kategori
- **Signature_Section**: Bagian tanda tangan untuk Ketua RT, Sekretaris RT, dan Bendahara RT
- **Document_Number**: Nomor dokumen unik dengan format LK-RT04-MMYY-XXX

## Requirements

### Requirement 1: Professional Document Layout

**User Story:** Sebagai Bendahara RT, saya ingin laporan keuangan terlihat profesional dan formal, sehingga layak didistribusikan kepada warga sebagai dokumen resmi RT.

#### Acceptance Criteria

1. WHEN generating PDF THEN the system SHALL use HTML template with CSS styling approach
2. WHEN generating PDF THEN the system SHALL use Puppeteer for PDF generation instead of PDFKit
3. WHEN rendering document THEN the system SHALL apply consistent page margins of 50px on all sides
4. WHEN rendering content THEN the system SHALL center content with maximum width of 800px
5. WHEN rendering text THEN the system SHALL use Helvetica/Arial/Inter font family with 12px body size and 1.5 line height
6. WHEN spacing sections THEN the system SHALL apply minimum 24px spacing between sections

### Requirement 2: Official Header and Letterhead

**User Story:** Sebagai Ketua RT, saya ingin setiap halaman laporan memiliki kop surat resmi dengan logo dan identitas RT, sehingga dokumen terlihat sebagai dokumen resmi RT.

#### Acceptance Criteria

1. WHEN rendering header THEN the system SHALL display RT logo on the left with size 60-80px
2. WHEN rendering header THEN the system SHALL display RT identity on the right including RT/RW number, housing name, full address, and city-postal code
3. WHEN rendering header THEN the system SHALL add thick separator line below header
4. WHEN rendering multi-page document THEN the system SHALL display consistent header on all pages
5. WHEN RT has dual logos THEN the system SHALL support displaying both logos in header

### Requirement 3: Document Title and Metadata

**User Story:** Sebagai Bendahara RT, saya ingin setiap laporan memiliki judul yang jelas dengan periode dan nomor dokumen, sehingga mudah diidentifikasi dan diarsipkan.

#### Acceptance Criteria

1. WHEN rendering title THEN the system SHALL display centered main title "LAPORAN KEUANGAN RT" with 20px bold font
2. WHEN rendering title THEN the system SHALL display period subtitle with format "Periode: DD MMM YYYY – DD MMM YYYY" in 14-16px semi-bold font
3. WHEN rendering title THEN the system SHALL display document number with format "No Dokumen: LK-RT04-MMYY-XXX"
4. WHEN rendering title THEN the system SHALL apply 20px spacing below title section

### Requirement 4: Financial Summary Box

**User Story:** Sebagai warga RT, saya ingin melihat ringkasan keuangan yang jelas dan menonjol di awal laporan, sehingga saya dapat dengan cepat memahami kondisi keuangan RT.

#### Acceptance Criteria

1. WHEN rendering summary THEN the system SHALL display modern box with background color #f8f9fa, 20px padding, and 8px border-radius
2. WHEN rendering summary THEN the system SHALL display Opening Balance, Total Income, and Total Expenses
3. WHEN rendering summary THEN the system SHALL add separator line before Closing Balance
4. WHEN rendering summary THEN the system SHALL highlight Closing Balance with 14-16px bold font and darker color
5. WHEN rendering amounts THEN the system SHALL right-align all monetary values

### Requirement 5: Transaction Detail Tables

**User Story:** Sebagai Bendahara RT, saya ingin detail transaksi ditampilkan dalam tabel yang bersih dan mudah dibaca, sehingga warga dapat memverifikasi setiap transaksi dengan jelas.

#### Acceptance Criteria

1. WHEN rendering tables THEN the system SHALL use horizontal borders only without cell borders
2. WHEN rendering table headers THEN the system SHALL apply light gray background #f1f1f1 with bold text
3. WHEN rendering table cells THEN the system SHALL apply 8px padding
4. WHEN rendering amounts THEN the system SHALL right-align monetary values
5. WHEN rendering dates THEN the system SHALL center-align date values
6. WHEN table spans multiple pages THEN the system SHALL repeat table headers on new pages
7. WHEN table spans multiple pages THEN the system SHALL avoid breaking rows in the middle

### Requirement 6: Category Summary Section

**User Story:** Sebagai warga RT, saya ingin melihat ringkasan per kategori dalam format yang ringan dan mudah dipahami, sehingga saya dapat memahami distribusi pengeluaran RT.

#### Acceptance Criteria

1. WHEN rendering category summary THEN the system SHALL use lightweight format without heavy table borders
2. WHEN rendering category items THEN the system SHALL use format "Category .............. Total"
3. WHEN rendering category summary THEN the system SHALL display total row in bold
4. WHEN no transactions exist THEN the system SHALL not display empty category summary

### Requirement 7: Multi-Page Document Handling

**User Story:** Sebagai Bendahara RT, saya ingin laporan dengan banyak transaksi dapat terbagi ke beberapa halaman dengan format yang konsisten, sehingga dokumen tetap profesional meskipun panjang.

#### Acceptance Criteria

1. WHEN document spans multiple pages THEN the system SHALL maintain consistent header on all pages
2. WHEN document spans multiple pages THEN the system SHALL display page numbers with format "Page X of Y"
3. WHEN table spans multiple pages THEN the system SHALL repeat table headers on new pages
4. WHEN table spans multiple pages THEN the system SHALL avoid breaking rows in the middle
5. WHEN rendering footer THEN the system SHALL display footer on every page

### Requirement 8: Official Footer and Signature

**User Story:** Sebagai Ketua RT, saya ingin setiap laporan memiliki bagian tanda tangan resmi untuk pengurus RT, sehingga dokumen memiliki validitas formal.

#### Acceptance Criteria

1. WHEN rendering footer THEN the system SHALL display auto-generated print date
2. WHEN rendering footer THEN the system SHALL display page numbers on every page
3. WHEN rendering signature section THEN the system SHALL apply 80-100px spacing before names
4. WHEN rendering signature section THEN the system SHALL display three columns for Ketua RT, Sekretaris RT, and Bendahara RT
5. WHEN rendering signature section THEN the system SHALL retrieve names from database
6. WHEN rendering signature section THEN the system SHALL use format "Mengetahui," as header followed by names in parentheses

### Requirement 9: Data Formatting and Consistency

**User Story:** Sebagai warga RT, saya ingin semua angka dan tanggal ditampilkan dalam format yang konsisten dan mudah dibaca, sehingga tidak ada kebingungan dalam membaca laporan.

#### Acceptance Criteria

1. WHEN formatting currency THEN the system SHALL use Intl.NumberFormat for consistent Rupiah format
2. WHEN formatting currency THEN the system SHALL not display duplicate "Rp" prefix
3. WHEN formatting currency THEN the system SHALL right-align all monetary amounts
4. WHEN formatting dates THEN the system SHALL use consistent Indonesian date format
5. WHEN no transactions exist THEN the system SHALL display appropriate message instead of empty tables

### Requirement 10: Technical Migration and Compatibility

**User Story:** Sebagai developer, saya ingin migrasi dari PDFKit ke Puppeteer berjalan lancar tanpa breaking changes, sehingga sistem tetap berfungsi untuk pengguna yang ada.

#### Acceptance Criteria

1. WHEN migrating PDF generation THEN the system SHALL replace PDFKit with Puppeteer
2. WHEN migrating PDF generation THEN the system SHALL maintain existing API endpoints
3. WHEN migrating PDF generation THEN the system SHALL preserve dual-logo support functionality
4. WHEN migrating PDF generation THEN the system SHALL remain backward compatible with Report_Service
5. WHEN generating PDF THEN the system SHALL integrate seamlessly with existing report.controller.ts

### Requirement 11: HTML Template System

**User Story:** Sebagai developer, saya ingin sistem template HTML yang modular dan mudah dimaintain, sehingga perubahan desain dapat dilakukan dengan mudah di masa depan.

#### Acceptance Criteria

1. WHEN creating templates THEN the system SHALL separate HTML structure from CSS styling
2. WHEN creating templates THEN the system SHALL use template engine for dynamic content injection
3. WHEN creating templates THEN the system SHALL support reusable components for header, footer, and sections
4. WHEN creating templates THEN the system SHALL maintain clean and readable template code
5. WHEN rendering templates THEN the system SHALL inject data safely to prevent XSS vulnerabilities

### Requirement 12: Asset Management and Logo Handling

**User Story:** Sebagai Bendahara RT, saya ingin logo RT dapat ditampilkan dengan benar di laporan PDF, sehingga dokumen memiliki identitas visual yang jelas.

#### Acceptance Criteria

1. WHEN loading logos THEN the system SHALL support PNG and JPG image formats
2. WHEN loading logos THEN the system SHALL handle missing logo files gracefully with placeholder
3. WHEN loading logos THEN the system SHALL convert logo files to base64 for embedding in HTML
4. WHEN dual logos exist THEN the system SHALL display both logos with proper spacing
5. WHEN logo path is invalid THEN the system SHALL log error and continue with placeholder

### Requirement 13: Performance and Resource Management

**User Story:** Sebagai system administrator, saya ingin PDF generation tidak membebani server, sehingga sistem tetap responsif untuk pengguna lain.

#### Acceptance Criteria

1. WHEN generating PDF THEN the system SHALL complete generation within 10 seconds for reports with up to 500 transactions
2. WHEN generating PDF THEN the system SHALL properly close Puppeteer browser instances to prevent memory leaks
3. WHEN generating PDF THEN the system SHALL handle concurrent PDF generation requests without blocking
4. WHEN generating PDF THEN the system SHALL limit maximum concurrent Puppeteer instances
5. WHEN PDF generation fails THEN the system SHALL clean up resources and return appropriate error

### Requirement 14: Error Handling and Validation

**User Story:** Sebagai Bendahara RT, saya ingin sistem memberikan pesan error yang jelas jika PDF generation gagal, sehingga saya dapat mengetahui apa yang perlu diperbaiki.

#### Acceptance Criteria

1. WHEN data is invalid THEN the system SHALL validate input data before PDF generation
2. WHEN PDF generation fails THEN the system SHALL return descriptive error message
3. WHEN template rendering fails THEN the system SHALL log detailed error for debugging
4. WHEN Puppeteer fails to launch THEN the system SHALL return ServiceUnavailableException
5. WHEN file system operations fail THEN the system SHALL handle errors gracefully and clean up partial files

### Requirement 15: Accessibility and Readability

**User Story:** Sebagai warga RT yang lebih tua, saya ingin laporan mudah dibaca dengan ukuran font yang cukup besar dan kontras yang jelas, sehingga saya dapat membaca laporan tanpa kesulitan.

#### Acceptance Criteria

1. WHEN rendering text THEN the system SHALL use minimum 12px font size for body text
2. WHEN rendering text THEN the system SHALL maintain sufficient contrast ratio between text and background
3. WHEN rendering tables THEN the system SHALL use adequate cell padding for readability
4. WHEN rendering document THEN the system SHALL use clear visual hierarchy with appropriate font sizes
5. WHEN printing document THEN the system SHALL ensure content is print-friendly without cut-off elements
