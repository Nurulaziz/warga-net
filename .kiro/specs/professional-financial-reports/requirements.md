# Requirements Document - Laporan Keuangan RT Profesional

## Introduction

Sistem WargaNet membutuhkan fitur untuk menghasilkan laporan keuangan RT yang profesional, formal, dan sesuai standar administrasi pemerintahan. Laporan harus dapat diekspor dalam format PDF (siap cetak) dan Excel (untuk arsip dan analisis). Fitur ini akan digunakan oleh pengurus RT untuk membuat laporan pertanggungjawaban keuangan kepada warga dan pihak kelurahan.

## Glossary

- **RT**: Rukun Tetangga, unit organisasi terkecil dalam pemerintahan di Indonesia
- **System**: Sistem WargaNet yang mengelola data keuangan RT
- **Financial_Report**: Dokumen laporan keuangan yang dihasilkan oleh sistem
- **PDF_Generator**: Komponen sistem yang menghasilkan file PDF
- **Excel_Generator**: Komponen sistem yang menghasilkan file Excel
- **Header_Section**: Bagian kop surat resmi di laporan
- **Summary_Section**: Bagian ringkasan keuangan (rekap)
- **Detail_Section**: Bagian rincian transaksi pemasukan dan pengeluaran
- **Category_Recap**: Ringkasan pengeluaran berdasarkan kategori
- **Signature_Section**: Bagian tanda tangan pengurus RT
- **Saldo_Awal**: Saldo keuangan di awal periode laporan
- **Saldo_Akhir**: Saldo keuangan di akhir periode laporan
- **Pemasukan**: Transaksi masuk (iuran warga)
- **Pengeluaran**: Transaksi keluar (belanja RT)
- **Approved_Data**: Data transaksi yang sudah disetujui dan tidak berstatus draft

## Requirements

### Requirement 1: Header Laporan Resmi

**User Story:** Sebagai Ketua RT, saya ingin laporan memiliki kop surat resmi yang formal, sehingga laporan terlihat profesional dan dapat dipertanggungjawabkan kepada warga dan kelurahan.

#### Acceptance Criteria

1. THE System SHALL display RT name in the header (contoh: "RT 05 / RW 03")
2. THE System SHALL display kelurahan, kecamatan, and kota/kabupaten information in the header
3. THE System SHALL display RT address and contact information in the header
4. WHERE logo is available, THE System SHALL display RT logo or WargaNet logo in the header
5. THE System SHALL format header content with center alignment
6. THE System SHALL add horizontal separator line after header section

### Requirement 2: Judul dan Periode Laporan

**User Story:** Sebagai Bendahara RT, saya ingin judul laporan dan periode yang jelas, sehingga mudah mengidentifikasi laporan untuk periode tertentu.

#### Acceptance Criteria

1. THE System SHALL display "LAPORAN KEUANGAN RT" as report title
2. THE System SHALL display report period in format "DD Month YYYY – DD Month YYYY"
3. THE System SHALL center-align the title and period
4. THE System SHALL use formal Indonesian date format (contoh: "01 Januari 2026")

### Requirement 3: Ringkasan Keuangan

**User Story:** Sebagai Ketua RT, saya ingin melihat ringkasan keuangan dalam satu tabel, sehingga dapat dengan cepat memahami kondisi keuangan RT.

#### Acceptance Criteria

1. THE System SHALL display summary table with columns: Keterangan and Jumlah
2. THE System SHALL display Saldo Awal from previous period's ending balance
3. THE System SHALL calculate and display Total Pemasukan from all approved income transactions
4. THE System SHALL calculate and display Total Pengeluaran from all approved expense transactions
5. THE System SHALL calculate Saldo Akhir as: Saldo Awal + Total Pemasukan - Total Pengeluaran
6. THE System SHALL format all amounts with thousand separators (contoh: "1.500.000")
7. THE System SHALL prefix all amounts with "Rp" currency symbol
8. THE System SHALL display Saldo Akhir row in bold formatting

### Requirement 4: Rincian Pemasukan

**User Story:** Sebagai Bendahara RT, saya ingin melihat detail semua pemasukan, sehingga dapat melacak siapa saja yang sudah membayar iuran.

#### Acceptance Criteria

1. THE System SHALL display income detail table with columns: Tanggal, Nama Warga, Jenis Iuran, Periode, Metode Pembayaran, Nominal, Keterangan
2. WHEN displaying income transactions, THE System SHALL sort them by date in ascending order
3. THE System SHALL only include approved payment transactions (exclude draft status)
4. THE System SHALL only include non-deleted payment transactions
5. THE System SHALL display total income amount at the bottom of the table
6. THE System SHALL format dates in "DD/MM/YYYY" format
7. THE System SHALL format nominal amounts with thousand separators and "Rp" prefix

### Requirement 5: Rincian Pengeluaran

**User Story:** Sebagai Bendahara RT, saya ingin melihat detail semua pengeluaran, sehingga dapat mempertanggungjawabkan penggunaan dana RT.

#### Acceptance Criteria

1. THE System SHALL display expense detail table with columns: Tanggal, Jenis Pengeluaran, Kategori, Nominal, Keterangan, Disetujui Oleh
2. WHEN displaying expense transactions, THE System SHALL sort them by date in ascending order
3. THE System SHALL only include approved expense transactions (exclude draft status)
4. THE System SHALL only include non-deleted expense transactions
5. THE System SHALL display total expense amount at the bottom of the table
6. THE System SHALL format dates in "DD/MM/YYYY" format
7. THE System SHALL format nominal amounts with thousand separators and "Rp" prefix

### Requirement 6: Rekap Per Kategori

**User Story:** Sebagai Ketua RT, saya ingin melihat ringkasan pengeluaran per kategori, sehingga dapat menganalisis alokasi dana RT.

#### Acceptance Criteria

1. THE System SHALL group expenses by category
2. THE System SHALL display category recap table with columns: Kategori and Total
3. THE System SHALL calculate total amount for each expense category
4. THE System SHALL sort categories alphabetically
5. THE System SHALL format amounts with thousand separators and "Rp" prefix
6. THE System SHALL display grand total of all categories at the bottom

### Requirement 7: Tanda Tangan Pengurus

**User Story:** Sebagai Ketua RT, saya ingin laporan memiliki bagian tanda tangan pengurus, sehingga laporan memiliki validitas formal.

#### Acceptance Criteria

1. THE System SHALL display signature section with label "Mengetahui:"
2. THE System SHALL display three signature placeholders: Ketua RT, Sekretaris RT, Bendahara RT
3. THE System SHALL retrieve and display actual names of RT officials from system data
4. THE System SHALL display report generation location and date
5. THE System SHALL format generation info as "Dibuat di: [Kota], Tanggal: [DD Month YYYY]"
6. THE System SHALL use current date as report generation date

### Requirement 8: Format PDF Profesional

**User Story:** Sebagai Ketua RT, saya ingin laporan PDF yang profesional dan siap cetak, sehingga dapat langsung digunakan untuk rapat warga atau diserahkan ke kelurahan.

#### Acceptance Criteria

1. THE PDF_Generator SHALL use A4 paper size (210mm x 297mm)
2. THE PDF_Generator SHALL apply standard margins of 2-2.5 cm on all sides
3. THE PDF_Generator SHALL use professional fonts (Arial, Helvetica, or Times)
4. THE PDF_Generator SHALL add page numbers to all pages
5. WHEN table content exceeds one page, THE PDF_Generator SHALL automatically break pages
6. THE PDF_Generator SHALL maintain consistent header and footer across all pages
7. WHERE watermark is enabled, THE PDF_Generator SHALL add "WargaNet" watermark
8. THE PDF_Generator SHALL ensure all text is selectable and searchable

### Requirement 9: Format Excel Terstruktur

**User Story:** Sebagai Bendahara RT, saya ingin laporan Excel yang terstruktur, sehingga dapat melakukan analisis lebih lanjut dan menyimpan arsip digital.

#### Acceptance Criteria

1. THE Excel_Generator SHALL create workbook with four sheets: Ringkasan, Detail Pemasukan, Detail Pengeluaran, Rekap Kategori
2. THE Excel_Generator SHALL apply currency format to all amount columns
3. THE Excel_Generator SHALL auto-adjust column widths based on content
4. THE Excel_Generator SHALL freeze header row in all sheets
5. THE Excel_Generator SHALL apply bold formatting to header rows
6. THE Excel_Generator SHALL add borders to all table cells
7. THE Excel_Generator SHALL use Excel formulas for total calculations
8. WHERE sheet protection is enabled, THE Excel_Generator SHALL protect sheets from editing

### Requirement 10: Validasi Data Laporan

**User Story:** Sebagai Bendahara RT, saya ingin laporan hanya menampilkan data yang valid dan akurat, sehingga tidak ada kesalahan dalam pertanggungjawaban keuangan.

#### Acceptance Criteria

1. WHEN generating report, THE System SHALL use ending balance from previous period as starting balance
2. THE System SHALL verify that Saldo Akhir calculation is accurate (Saldo Awal + Pemasukan - Pengeluaran)
3. THE System SHALL exclude all transactions with draft status
4. THE System SHALL exclude all soft-deleted transactions
5. THE System SHALL validate that report period dates are valid and start date is before end date
6. IF no transactions exist in period, THE System SHALL generate report with zero amounts

### Requirement 11: Fitur Profesional Tambahan

**User Story:** Sebagai Ketua RT, saya ingin fitur tambahan yang meningkatkan kredibilitas laporan, sehingga laporan lebih terpercaya dan mudah diverifikasi.

#### Acceptance Criteria

1. WHERE QR code feature is enabled, THE System SHALL generate QR code for report verification
2. THE System SHALL assign unique document number to each report (format: "LKR-RT[XX]-[MMYYYY]")
3. THE System SHALL record report generation metadata (generated by, generated at)
4. WHERE digital stamp is enabled, THE System SHALL add digital stamp image to signature section
5. THE System SHALL allow marking report status as Draft or Final

### Requirement 12: API Endpoint untuk Generate Laporan

**User Story:** Sebagai Frontend Developer, saya ingin API endpoint yang jelas untuk generate laporan, sehingga dapat mengintegrasikan fitur ini ke dalam UI.

#### Acceptance Criteria

1. THE System SHALL provide POST endpoint for generating PDF report
2. THE System SHALL provide POST endpoint for generating Excel report
3. WHEN receiving report request, THE System SHALL validate user has permission to generate reports
4. WHEN receiving report request, THE System SHALL validate required parameters (start date, end date, RT ID)
5. THE System SHALL return generated file as downloadable response
6. THE System SHALL set appropriate Content-Type header (application/pdf or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
7. THE System SHALL set Content-Disposition header with suggested filename
8. IF report generation fails, THE System SHALL return appropriate error message

### Requirement 13: Parser dan Serializer untuk Data Laporan

**User Story:** Sebagai Backend Developer, saya ingin parser dan serializer yang robust untuk data laporan, sehingga data dapat diproses dengan benar untuk berbagai format output.

#### Acceptance Criteria

1. THE System SHALL parse financial data from database into report data structure
2. THE System SHALL serialize report data structure into PDF format
3. THE System SHALL serialize report data structure into Excel format
4. THE Pretty_Printer SHALL format report data structure back into readable JSON
5. FOR ALL valid report data structures, parsing then serializing then parsing SHALL produce equivalent data (round-trip property)
