# Requirements: Dashboard Financial Chart Fix

## 1. Overview

Balok diagram ringkasan keuangan (bar chart) tidak muncul di halaman Dashboard. Komponen `FinancialSummary` yang berisi bar chart sudah diimplementasikan dengan benar, tetapi tidak ditampilkan untuk semua role yang seharusnya bisa melihatnya.

## 2. Problem Statement

### Current State
- Komponen `FinancialSummary.tsx` sudah ada dan berfungsi dengan baik
- Backend endpoint `/api/v1/dashboard/financial-summary` sudah mengembalikan data yang benar
- Bar chart tidak muncul di Dashboard untuk role ADMIN_RT, ADMIN_BENDAHARA, dan SUPER_ADMIN

### Expected State
- Bar chart ringkasan keuangan harus muncul di Dashboard untuk role yang memiliki akses financial
- Chart harus menampilkan perbandingan income vs expense per bulan
- Chart harus responsive dan mudah dibaca

## 3. User Stories

### 3.1 Sebagai ADMIN_RT
**Saya ingin** melihat bar chart ringkasan keuangan di Dashboard  
**Sehingga** saya dapat memantau kondisi keuangan RT secara visual

**Acceptance Criteria:**
- Bar chart muncul di Dashboard setelah FinancialSummaryCards
- Chart menampilkan data income dan expense per bulan
- Chart responsive di semua ukuran layar
- Data diambil dari endpoint `/api/v1/dashboard/financial-summary`

### 3.2 Sebagai ADMIN_BENDAHARA
**Saya ingin** melihat bar chart ringkasan keuangan di Dashboard  
**Sehingga** saya dapat menganalisis tren keuangan dengan mudah

**Acceptance Criteria:**
- Bar chart muncul di Dashboard dengan posisi prominent
- Chart menampilkan legend yang jelas (Total Pemasukan, Total Pengeluaran)
- Chart menampilkan saldo di bagian bawah
- User dapat memilih tahun untuk melihat data historis

### 3.3 Sebagai SUPER_ADMIN
**Saya ingin** melihat bar chart ringkasan keuangan di Dashboard  
**Sehingga** saya dapat memantau kesehatan finansial sistem

**Acceptance Criteria:**
- Bar chart muncul di Dashboard
- Chart menampilkan data yang sama dengan role lain
- Chart dapat di-refresh untuk mendapatkan data terbaru

## 4. Technical Requirements

### 4.1 Component Integration
- Komponen `FinancialSummary` harus ditampilkan di `Dashboard.tsx`
- Komponen harus ditampilkan untuk role: ADMIN_RT, ADMIN_BENDAHARA, SUPER_ADMIN
- Komponen harus ditampilkan setelah `FinancialSummaryCards`

### 4.2 Data Flow
- Data diambil dari endpoint `/api/v1/dashboard/financial-summary`
- Data di-cache di Redis dengan TTL 5 menit
- Data dapat di-refresh secara manual

### 4.3 UI/UX Requirements
- Chart harus responsive (mobile, tablet, desktop)
- Chart harus memiliki loading state
- Chart harus memiliki error state dengan retry button
- Chart harus menampilkan tooltip saat hover
- Chart harus memiliki year selector

### 4.4 Performance Requirements
- Chart harus load dalam < 2 detik
- Chart harus smooth saat resize window
- Chart tidak boleh block UI rendering

## 5. Non-Functional Requirements

### 5.1 Accessibility
- Chart harus memiliki alt text yang descriptive
- Chart harus dapat diakses dengan keyboard
- Chart harus memiliki color contrast yang baik (WCAG AA)

### 5.2 Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### 5.3 Responsive Design
- Mobile: Chart full width, bars lebih lebar
- Tablet: Chart full width atau 2 kolom
- Desktop: Chart dapat 1 atau 2 kolom tergantung layout

## 6. Out of Scope

- Menambah jenis chart baru (pie chart, line chart, dll)
- Export chart sebagai image
- Drill-down ke detail transaksi dari chart
- Real-time update chart
- Animasi chart yang kompleks

## 7. Dependencies

- Komponen `FinancialSummary.tsx` (sudah ada)
- Service `dashboardService.getFinancialSummary()` (sudah ada)
- Backend endpoint `/api/v1/dashboard/financial-summary` (sudah ada)
- Permission check `hasFinancialAccess` (sudah ada)

## 8. Success Metrics

- Bar chart muncul di Dashboard untuk role yang sesuai
- Chart load time < 2 detik
- Chart responsive di semua breakpoint
- Zero console errors terkait chart
- User dapat melihat data keuangan dengan jelas

## 9. Risks & Mitigations

### Risk 1: Performance issue dengan data banyak
**Mitigation:** Data sudah di-aggregate per bulan (max 12 data points)

### Risk 2: Chart tidak responsive di mobile
**Mitigation:** Test di berbagai device size, gunakan responsive design

### Risk 3: Data tidak muncul karena permission issue
**Mitigation:** Gunakan permission check yang sudah ada (`hasFinancialAccess`)

## 10. Timeline Estimate

- Requirements review: 30 menit
- Design review: 30 menit
- Implementation: 1 jam
- Testing: 30 menit
- Total: 2.5 jam
