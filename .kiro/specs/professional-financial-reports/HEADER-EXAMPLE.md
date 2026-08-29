# Contoh Kop Surat Laporan - RT 004/010 SMR

## Informasi RT

**Nama Perumahan**: Satriamekar Raya Residence 2 (SMR 2)  
**RT/RW**: RT 004 / RW 010  
**Alamat**: Satriamekar Raya Residence 2 RT. 004/010  
**Kelurahan**: Satriamekar  
**Kecamatan**: Tambun Utara  
**Kabupaten**: Bekasi  
**Provinsi**: Jawa Barat

## Layout Kop Surat

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   [Logo Bekasi]              [Logo SMR 2]                       │
│      (60x60)                   (60x60)                          │
│                                                                 │
│           SATRIAMEKAR RAYA RESIDENCE 2 (SMR 2)                  │
│                    RT 004 / RW 010                              │
│                                                                 │
│        Kelurahan Satriamekar, Kec. Tambun Utara                 │
│                  Kabupaten Bekasi                               │
│         Satriamekar Raya Residence 2 RT. 004/010                │
│                  Telp: 021-XXXXXXXX                             │
│                                                                 │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│              LAPORAN KEUANGAN RT                                │
│         Periode: 01 Januari 2026 – 31 Januari 2026             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementasi di PdfGeneratorService

### Dual Logo Layout

```typescript
private addHeader(doc: PDFDocument, rtInfo: RtInfo): void {
  const pageWidth = doc.page.width;
  const leftMargin = doc.page.margins.left;
  const rightMargin = doc.page.margins.right;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  
  // Logo configuration
  const logoSize = 60;
  const logoSpacing = 100; // Jarak antar logo
  
  // Calculate logo positions (centered, side by side)
  const totalLogoWidth = (logoSize * 2) + logoSpacing;
  const startX = leftMargin + (contentWidth - totalLogoWidth) / 2;
  
  // Logo Bekasi (kiri)
  const bekasiLogoPath = path.join(this.ASSETS_PATH, 'logos/bekasi/logo-bekasi.png');
  if (fs.existsSync(bekasi LogoPath)) {
    doc.image(bekasi LogoPath, startX, doc.y, { 
      width: logoSize, 
      height: logoSize 
    });
  }
  
  // Logo SMR (kanan)
  const smrLogoPath = path.join(this.ASSETS_PATH, 'logos/smr/logo-smr.png');
  if (fs.existsSync(smrLogoPath)) {
    doc.image(smrLogoPath, startX + logoSize + logoSpacing, doc.y, { 
      width: logoSize, 
      height: logoSize 
    });
  }
  
  // Move down after logos
  doc.moveDown(4);
  
  // Nama Perumahan (bold, size 16)
  doc.fontSize(16).font('Helvetica-Bold')
     .text('SATRIAMEKAR RAYA RESIDENCE 2 (SMR 2)', { align: 'center' });
  
  // RT/RW (bold, size 14)
  doc.fontSize(14).font('Helvetica-Bold')
     .text('RT 004 / RW 010', { align: 'center' });
  
  doc.moveDown(0.5);
  
  // Alamat lengkap (regular, size 10)
  doc.fontSize(10).font('Helvetica')
     .text('Kelurahan Satriamekar, Kec. Tambun Utara', { align: 'center' })
     .text('Kabupaten Bekasi', { align: 'center' })
     .text('Satriamekar Raya Residence 2 RT. 004/010', { align: 'center' });
  
  // Kontak (jika ada)
  if (rtInfo.phone) {
    doc.text(`Telp: ${rtInfo.phone}`, { align: 'center' });
  }
  
  // Horizontal line separator
  doc.moveDown(0.5);
  doc.moveTo(leftMargin, doc.y)
     .lineTo(pageWidth - rightMargin, doc.y)
     .lineWidth(1)
     .stroke();
  
  doc.moveDown(1);
}
```

## Struktur Folder Assets

```
apps/backend/assets/
├── logos/
│   ├── default/
│   │   └── warganet-logo.png          # Logo default WargaNet
│   ├── bekasi/
│   │   └── logo-bekasi.png            # Logo Kabupaten Bekasi
│   ├── smr/
│   │   └── logo-smr.png               # Logo Perumahan SMR
│   └── rt/
│       ├── rt-004-010.png             # Logo khusus RT (opsional)
│       └── ...
├── stamps/
└── templates/
```

## Database Configuration

### RT Table Data Example

```sql
INSERT INTO "RT" (
  id,
  name,
  kelurahan,
  kecamatan,
  kota,
  address,
  phone,
  logoFilename,
  province
) VALUES (
  'uuid-rt-004-010',
  'RT 004 / RW 010',
  'Satriamekar',
  'Tambun Utara',
  'Bekasi',
  'Satriamekar Raya Residence 2 RT. 004/010',
  '021-XXXXXXXX',
  NULL, -- Atau 'rt-004-010.png' jika ada logo khusus RT
  'Jawa Barat'
);
```

### Extended RtInfo Interface

```typescript
export interface RtInfo {
  id: string;
  name: string;                    // "RT 004 / RW 010"
  kelurahan: string;               // "Satriamekar"
  kecamatan: string;               // "Tambun Utara"
  kota: string;                    // "Bekasi"
  province?: string;               // "Jawa Barat"
  address: string;                 // "Satriamekar Raya Residence 2 RT. 004/010"
  phone: string;                   // "021-XXXXXXXX"
  logoFilename?: string;           // Logo khusus RT (opsional)
  housingName?: string;            // "Satriamekar Raya Residence 2 (SMR 2)"
  ketuaName: string;
  sekretarisName: string;
  bendaharaName: string;
}
```

## Logo Specifications

### Logo Bekasi
- **File**: `logo-bekasi.png`
- **Format**: PNG dengan background transparan
- **Ukuran**: 300x300px (akan di-resize ke 60x60px di PDF)
- **Sumber**: Logo resmi Kabupaten Bekasi
- **Warna**: Sesuai logo resmi (biasanya kombinasi biru, kuning, hijau)

### Logo SMR (Satriamekar Raya Residence 2)
- **File**: `logo-smr.png`
- **Format**: PNG dengan background transparan
- **Ukuran**: 300x300px (akan di-resize ke 60x60px di PDF)
- **Sumber**: Logo perumahan SMR
- **Warna**: Sesuai branding perumahan

## Alternative Layouts

### Layout 1: Logo Horizontal (Side by Side)
```
[Logo Bekasi]  [Logo SMR]
     NAMA PERUMAHAN
        RT/RW
```

### Layout 2: Logo Vertikal (Stacked)
```
    [Logo Bekasi]
     [Logo SMR]
   NAMA PERUMAHAN
      RT/RW
```

### Layout 3: Logo dengan Teks di Samping
```
[Logo Bekasi]    SATRIAMEKAR RAYA RESIDENCE 2
[Logo SMR]              RT 004 / RW 010
                 Kelurahan Satriamekar...
```

## Implementation Notes

1. **Logo Placement**: Gunakan layout horizontal (side by side) untuk tampilan yang seimbang
2. **Logo Size**: 60x60px di PDF (optimal untuk A4)
3. **Spacing**: 100px jarak antar logo untuk proporsi yang baik
4. **Fallback**: Jika salah satu logo tidak ada, center logo yang tersedia
5. **Alignment**: Semua teks center-aligned untuk tampilan formal

## Testing Checklist

- [ ] Logo Bekasi muncul di posisi kiri
- [ ] Logo SMR muncul di posisi kanan
- [ ] Kedua logo sejajar horizontal
- [ ] Nama perumahan tampil dengan benar
- [ ] RT/RW tampil dengan format yang benar
- [ ] Alamat lengkap tampil (kelurahan, kecamatan, kabupaten)
- [ ] Garis separator tampil di bawah header
- [ ] Spacing antar elemen proporsional
- [ ] Fallback bekerja jika logo tidak ada

## Future Enhancements

1. **Dynamic Logo Selection**: Pilih logo berdasarkan wilayah (kabupaten/kota)
2. **Logo Repository**: Database logo untuk berbagai wilayah
3. **Custom Header Layout**: Admin bisa pilih layout header (horizontal/vertical)
4. **Watermark**: Tambahkan watermark logo di background laporan
5. **Digital Signature**: Integrasi dengan sistem tanda tangan digital
