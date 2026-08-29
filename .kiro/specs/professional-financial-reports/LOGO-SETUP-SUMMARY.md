# Summary: Setup Logo untuk Kop Surat Laporan RT

## ✅ Yang Sudah Dibuat

### 1. Struktur Folder Assets
```
apps/backend/assets/
├── logos/
│   ├── default/          # Logo WargaNet (wajib)
│   ├── bekasi/           # Logo Kabupaten Bekasi
│   ├── smr/              # Logo Perumahan SMR
│   └── rt/               # Logo per RT (user uploads)
├── stamps/               # Cap stempel digital (future)
└── templates/            # Template dokumen (future)
```

### 2. Dokumentasi Lengkap
- ✅ `HEADER-EXAMPLE.md` - Contoh implementasi kop surat dengan dual logo
- ✅ `ASSETS-GUIDE.md` - Panduan lengkap assets management
- ✅ `apps/backend/assets/README.md` - Overview struktur assets
- ✅ `apps/backend/assets/SETUP-LOGOS.md` - Instruksi setup logo files
- ✅ README per folder logo (default, bekasi, smr)

### 3. Git Configuration
- ✅ `.gitignore` updated untuk exclude RT-specific logos
- ✅ `.gitkeep` files untuk maintain folder structure
- ✅ Official logos (default, bekasi, smr) akan di-commit
- ✅ RT logos (user uploads) akan di-ignore

### 4. Spec Documents Updated
- ✅ `design.md` - Updated dengan logo handling logic
- ✅ `tasks.md` - Updated dengan assets setup instructions
- ✅ `RtInfo` interface - Changed `logoPath` → `logoFilename`

## 📋 Yang Perlu Dilakukan Selanjutnya

### Step 1: Dapatkan Logo Files (PENTING!)

Anda perlu mendapatkan 3 logo files:

#### 1. Logo WargaNet (WAJIB)
- **File**: `warganet-logo.png`
- **Lokasi**: `apps/backend/assets/logos/default/`
- **Status**: WAJIB - Aplikasi tidak akan berfungsi tanpa ini
- **Spesifikasi**: PNG transparan, 400x400px, < 500KB

#### 2. Logo Kabupaten Bekasi (OPSIONAL)
- **File**: `logo-bekasi.png`
- **Lokasi**: `apps/backend/assets/logos/bekasi/`
- **Cara Dapat**: 
  - Website resmi Pemkab Bekasi
  - Request ke Bagian Humas Pemkab Bekasi
  - Email: humas@bekasikab.go.id
- **Spesifikasi**: PNG transparan, 400x400px, < 500KB

#### 3. Logo Perumahan SMR (OPSIONAL)
- **File**: `logo-smr.png`
- **Lokasi**: `apps/backend/assets/logos/smr/`
- **Cara Dapat**:
  - Hubungi pengelola Perumahan SMR
  - Hubungi developer perumahan
  - Minta ke Pengurus RW 010 Satriamekar
- **Spesifikasi**: PNG transparan, 400x400px, < 500KB

### Step 2: Copy Logo Files

#### Windows (PowerShell)
```powershell
# Copy Logo WargaNet (WAJIB)
Copy-Item "C:\path\to\warganet-logo.png" "apps\backend\assets\logos\default\"

# Copy Logo Bekasi (OPSIONAL)
Copy-Item "C:\path\to\logo-bekasi.png" "apps\backend\assets\logos\bekasi\"

# Copy Logo SMR (OPSIONAL)
Copy-Item "C:\path\to\logo-smr.png" "apps\backend\assets\logos\smr\"
```

#### Linux/Mac (Bash)
```bash
# Copy Logo WargaNet (WAJIB)
cp /path/to/warganet-logo.png apps/backend/assets/logos/default/

# Copy Logo Bekasi (OPSIONAL)
cp /path/to/logo-bekasi.png apps/backend/assets/logos/bekasi/

# Copy Logo SMR (OPSIONAL)
cp /path/to/logo-smr.png apps/backend/assets/logos/smr/
```

### Step 3: Verifikasi Files

```bash
# Check files exist
ls -lh apps/backend/assets/logos/default/warganet-logo.png
ls -lh apps/backend/assets/logos/bekasi/logo-bekasi.png
ls -lh apps/backend/assets/logos/smr/logo-smr.png

# Check file type (should be PNG)
file apps/backend/assets/logos/default/warganet-logo.png
```

### Step 4: Commit ke Git

```bash
# Add logo files
git add apps/backend/assets/logos/default/warganet-logo.png
git add apps/backend/assets/logos/bekasi/logo-bekasi.png
git add apps/backend/assets/logos/smr/logo-smr.png

# Commit
git commit -m "Add logo files for RT report header"

# Push
git push origin main
```

### Step 5: Update Database (Jika Perlu)

Jika database schema belum memiliki field untuk logo, tambahkan:

```sql
-- Add logoFilename column to RT table
ALTER TABLE "RT" ADD COLUMN "logoFilename" VARCHAR(255);

-- Add housingName column (optional)
ALTER TABLE "RT" ADD COLUMN "housingName" VARCHAR(255);

-- Add province column (optional)
ALTER TABLE "RT" ADD COLUMN "province" VARCHAR(100);

-- Update data untuk RT 004/010
UPDATE "RT" 
SET 
  "housingName" = 'Satriamekar Raya Residence 2 (SMR 2)',
  "province" = 'Jawa Barat',
  "logoFilename" = NULL  -- Atau 'rt-004-010.png' jika ada logo khusus
WHERE 
  name = 'RT 004 / RW 010' 
  AND kelurahan = 'Satriamekar';
```

## 🎨 Contoh Kop Surat yang Akan Dihasilkan

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

## 📚 Dokumentasi Referensi

Untuk detail lengkap, lihat:

1. **HEADER-EXAMPLE.md** - Contoh implementasi kop surat
2. **ASSETS-GUIDE.md** - Panduan lengkap assets management
3. **SETUP-LOGOS.md** - Instruksi setup logo files
4. **design.md** - Design document dengan logo handling logic
5. **tasks.md** - Implementation tasks dengan assets setup

## ⚠️ Catatan Penting

### Logo WargaNet (WAJIB)
- Tanpa logo ini, aplikasi tidak akan berfungsi
- Harus di-commit ke repository
- Digunakan sebagai fallback untuk semua RT

### Logo Regional (OPSIONAL)
- Logo Bekasi dan SMR bersifat opsional
- Jika tidak ada, sistem akan fallback ke logo WargaNet
- Recommended untuk tampilan lebih profesional

### Logo Per RT (USER UPLOADS)
- Logo khusus per RT bisa diupload nanti
- Disimpan di `logos/rt/` folder
- Tidak di-commit ke git (user-generated content)

## 🔧 Troubleshooting

### Logo tidak muncul di PDF?
1. Check file exists: `ls apps/backend/assets/logos/default/warganet-logo.png`
2. Check file format: `file apps/backend/assets/logos/default/warganet-logo.png`
3. Check file permissions: `chmod 644 apps/backend/assets/logos/default/warganet-logo.png`
4. Check code path di PdfGeneratorService

### Logo terlalu besar/kecil?
- Adjust width parameter di code (recommended: 60px)
- Range: 40px - 80px untuk A4 paper

### Logo tidak transparan?
- Convert to PNG dengan transparency
- Use tools: Photoshop, GIMP, atau online converter

## 📞 Contact

Jika ada pertanyaan atau butuh bantuan:
- Lihat dokumentasi lengkap di folder `.kiro/specs/professional-financial-reports/`
- Lihat setup guide di `apps/backend/assets/SETUP-LOGOS.md`

## ✅ Checklist Setup

Sebelum mulai implementasi, pastikan:

- [ ] Folder structure sudah dibuat (✅ sudah dibuat)
- [ ] Dokumentasi sudah dibaca
- [ ] Logo WargaNet sudah didapat
- [ ] Logo Bekasi sudah didapat (opsional)
- [ ] Logo SMR sudah didapat (opsional)
- [ ] Logo files sudah di-copy ke folder yang benar
- [ ] Logo files sudah di-commit ke git
- [ ] Database schema sudah diupdate (jika perlu)
- [ ] Ready untuk mulai implementasi Task 1

---

**Next Step**: Dapatkan logo files dan copy ke folder yang sudah dibuat, kemudian commit ke git. Setelah itu, siap untuk mulai implementasi tasks! 🚀
