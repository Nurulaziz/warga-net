# Assets Management Guide - Laporan Keuangan RT

## Struktur Folder Assets

```
apps/backend/assets/
├── logos/
│   ├── default/
│   │   └── warganet-logo.png      # Logo default WargaNet (wajib ada)
│   └── rt/
│       ├── .gitkeep               # Keep folder in git
│       ├── rt-001.png             # Logo RT 001 (opsional)
│       ├── rt-002.png             # Logo RT 002 (opsional)
│       └── ...
├── stamps/
│   └── digital-stamp.png          # Cap stempel digital (future feature)
└── templates/
    └── report-template.pdf        # Template PDF (future feature)
```

## Penjelasan Struktur

### 1. `logos/default/`
- **Purpose**: Menyimpan logo default WargaNet yang digunakan jika RT tidak memiliki logo sendiri
- **File**: `warganet-logo.png`
- **Format**: PNG dengan background transparan
- **Ukuran**: Recommended 300x300px atau 400x400px
- **Git**: File ini di-commit ke repository (tidak di-ignore)

### 2. `logos/rt/`
- **Purpose**: Menyimpan logo per RT (user-uploaded)
- **Naming Convention**: `rt-{rtNumber}.png` (contoh: `rt-001.png`, `rt-002.png`)
- **Format**: PNG dengan background transparan
- **Ukuran**: Recommended 300x300px atau 400x400px
- **Git**: Folder ini di-ignore (kecuali `.gitkeep`), karena logo RT adalah user-generated content

### 3. `stamps/` (Future)
- **Purpose**: Menyimpan cap stempel digital untuk signature section
- **Usage**: Akan digunakan untuk fitur digital stamp di laporan

### 4. `templates/` (Future)
- **Purpose**: Menyimpan template PDF atau Excel untuk customization
- **Usage**: Akan digunakan untuk fitur custom report templates

## Cara Kerja Logo di Report

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. Fetch RT Info dari Database                          │
│    - rtInfo.logoFilename = "rt-001.png" (atau null)     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. PdfGeneratorService.addHeader()                      │
│    - Check if rtInfo.logoFilename exists                │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    [Ada logoFilename]      [Tidak ada logoFilename]
         │                       │
         ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐
│ Construct RT path:  │   │ Use default logo:   │
│ assets/logos/rt/    │   │ assets/logos/       │
│   rt-001.png        │   │   default/          │
└──────────┬──────────┘   │   warganet-logo.png │
           │              └──────────┬──────────┘
           ▼                         │
┌─────────────────────┐              │
│ Check if file exists│              │
│ using fs.existsSync │              │
└──────────┬──────────┘              │
           │                         │
    ┌──────┴──────┐                  │
    │             │                  │
    ▼             ▼                  │
[Exists]    [Not Exists]             │
    │             │                  │
    │             └──────────────────┘
    │                                │
    ▼                                ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Add logo to PDF                                      │
│    doc.image(logoPath, { width: 60, align: 'center' }) │
└─────────────────────────────────────────────────────────┘
```

### Implementasi di Code

```typescript
// PdfGeneratorService
private readonly ASSETS_PATH = path.join(process.cwd(), 'apps/backend/assets');
private readonly DEFAULT_LOGO = path.join(this.ASSETS_PATH, 'logos/default/warganet-logo.png');

private addHeader(doc: PDFDocument, rtInfo: RtInfo): void {
  // Tentukan logo path
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
  
  // ... rest of header
}
```

## Database Schema

### RT Table
```prisma
model RT {
  id           String   @id @default(uuid())
  name         String
  kelurahan    String
  kecamatan    String
  kota         String
  address      String
  phone        String?
  logoFilename String?  // Filename saja, bukan full path
  // ... other fields
}
```

### Contoh Data
```typescript
{
  id: "uuid-123",
  name: "RT 05 / RW 03",
  kelurahan: "Kelurahan ABC",
  kecamatan: "Kecamatan XYZ",
  kota: "Jakarta Selatan",
  address: "Jl. Contoh No. 123",
  phone: "021-12345678",
  logoFilename: "rt-005.png" // atau null jika tidak ada
}
```

## Upload Logo RT (Future Feature)

### API Endpoint (Planned)
```typescript
POST /api/rt/:rtId/logo
Content-Type: multipart/form-data

Body:
- file: logo.png (max 2MB)

Response:
{
  "logoFilename": "rt-005.png",
  "message": "Logo berhasil diupload"
}
```

### Upload Flow
1. User upload logo via frontend
2. Backend validate file (type, size)
3. Rename file to `rt-{rtNumber}.png`
4. Save to `assets/logos/rt/`
5. Update RT table: set logoFilename
6. Return success response

### Validation Rules
- **File Type**: PNG, JPG, JPEG only
- **File Size**: Max 2MB
- **Dimensions**: Recommended 300x300px - 500x500px
- **Background**: Transparent PNG recommended

## Git Configuration

### .gitignore
```gitignore
# Exclude RT-specific logos (user uploads)
apps/backend/assets/logos/rt/*
!apps/backend/assets/logos/rt/.gitkeep

# Keep default logo and folder structure
!apps/backend/assets/logos/default/
!apps/backend/assets/stamps/
!apps/backend/assets/templates/
```

### Reasoning
- **Default logo**: Di-commit karena bagian dari aplikasi
- **RT logos**: Di-ignore karena user-generated content
- **Folder structure**: Keep `.gitkeep` untuk maintain folder structure

## Setup Instructions

### 1. Initial Setup (Development)
```bash
# Create folder structure
mkdir -p apps/backend/assets/logos/default
mkdir -p apps/backend/assets/logos/rt
mkdir -p apps/backend/assets/stamps
mkdir -p apps/backend/assets/templates

# Create .gitkeep
touch apps/backend/assets/logos/rt/.gitkeep
touch apps/backend/assets/stamps/.gitkeep
touch apps/backend/assets/templates/.gitkeep

# Add default logo (manual)
# Copy warganet-logo.png to apps/backend/assets/logos/default/
```

### 2. Production Setup
```bash
# Same as development
# Ensure folder permissions allow write access for logo uploads
chmod 755 apps/backend/assets/logos/rt
```

### 3. Docker Setup (If using Docker)
```dockerfile
# Dockerfile
COPY apps/backend/assets/logos/default /app/apps/backend/assets/logos/default

# Create RT logos folder with write permission
RUN mkdir -p /app/apps/backend/assets/logos/rt && \
    chmod 755 /app/apps/backend/assets/logos/rt

# Volume for persistent RT logos
VOLUME ["/app/apps/backend/assets/logos/rt"]
```

## Testing

### Unit Test - Logo Handling
```typescript
describe('PdfGeneratorService - Logo Handling', () => {
  it('should use RT logo if exists', () => {
    const rtInfo = {
      logoFilename: 'rt-001.png',
      // ... other fields
    };
    
    // Mock fs.existsSync to return true for RT logo
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    
    const buffer = await pdfGenerator.generate({ rtInfo, ... });
    
    // Verify RT logo path was used
    expect(fs.existsSync).toHaveBeenCalledWith(
      expect.stringContaining('logos/rt/rt-001.png')
    );
  });
  
  it('should fallback to default logo if RT logo not found', () => {
    const rtInfo = {
      logoFilename: 'rt-999.png', // File tidak ada
      // ... other fields
    };
    
    // Mock fs.existsSync: false for RT logo, true for default
    jest.spyOn(fs, 'existsSync')
      .mockReturnValueOnce(false) // RT logo not found
      .mockReturnValueOnce(true);  // Default logo exists
    
    const buffer = await pdfGenerator.generate({ rtInfo, ... });
    
    // Verify default logo path was used
    expect(fs.existsSync).toHaveBeenCalledWith(
      expect.stringContaining('logos/default/warganet-logo.png')
    );
  });
  
  it('should use default logo if logoFilename is null', () => {
    const rtInfo = {
      logoFilename: null,
      // ... other fields
    };
    
    const buffer = await pdfGenerator.generate({ rtInfo, ... });
    
    // Verify default logo was used directly
    expect(fs.existsSync).toHaveBeenCalledWith(
      expect.stringContaining('logos/default/warganet-logo.png')
    );
  });
});
```

## Troubleshooting

### Issue: Logo tidak muncul di PDF
**Possible Causes:**
1. File path salah
2. File tidak ada
3. File corrupt
4. Permission issue

**Solution:**
```typescript
// Add logging untuk debugging
private addHeader(doc: PDFDocument, rtInfo: RtInfo): void {
  let logoPath = this.DEFAULT_LOGO;
  
  if (rtInfo.logoFilename) {
    const rtLogoPath = path.join(this.ASSETS_PATH, 'logos/rt', rtInfo.logoFilename);
    console.log('Checking RT logo:', rtLogoPath);
    
    if (fs.existsSync(rtLogoPath)) {
      logoPath = rtLogoPath;
      console.log('Using RT logo');
    } else {
      console.log('RT logo not found, using default');
    }
  }
  
  console.log('Final logo path:', logoPath);
  
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, { width: 60, align: 'center' });
  } else {
    console.error('Logo file not found:', logoPath);
  }
}
```

### Issue: Default logo tidak ter-commit ke git
**Solution:**
```bash
# Check .gitignore
cat .gitignore | grep assets

# Ensure default logo is not ignored
git add -f apps/backend/assets/logos/default/warganet-logo.png
git commit -m "Add default WargaNet logo"
```

### Issue: RT logo folder tidak ada di production
**Solution:**
```bash
# Create folder manually
mkdir -p apps/backend/assets/logos/rt

# Or add to deployment script
echo "mkdir -p apps/backend/assets/logos/rt" >> deploy.sh
```

## Best Practices

1. **Always have default logo**: Jangan pernah hapus default logo
2. **Validate uploads**: Selalu validate file type dan size saat upload
3. **Use consistent naming**: Gunakan format `rt-{number}.png` untuk RT logos
4. **Optimize images**: Compress logo files untuk performa
5. **Backup RT logos**: Include RT logos folder dalam backup strategy
6. **Monitor disk space**: RT logos bisa bertambah banyak seiring waktu
7. **Clean unused logos**: Hapus logo RT yang sudah tidak aktif

## Future Enhancements

1. **Logo Management UI**: Admin panel untuk upload/manage logos
2. **Image Optimization**: Auto-resize dan compress uploaded logos
3. **CDN Integration**: Serve logos dari CDN untuk performa
4. **Multiple Formats**: Support SVG untuk scalable logos
5. **Logo Versioning**: Track logo changes over time
6. **Bulk Upload**: Upload multiple RT logos sekaligus
