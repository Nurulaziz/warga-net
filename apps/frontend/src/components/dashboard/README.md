# Dashboard Components

Komponen-komponen dashboard WargaNet yang diambil dari Figma design dan disesuaikan dengan design system project.

## Komponen

### StatCard
Widget card untuk menampilkan statistik dengan icon.

**Props:**
- `icon`: ReactNode - Icon component
- `value`: string | number - Nilai statistik
- `label`: string - Label statistik
- `iconBgColor`: string (optional) - Warna background icon (default: 'bg-primary-500')

**Contoh:**
```tsx
<StatCard
  icon={<UsersIcon />}
  value="96"
  label="Warga"
  iconBgColor="bg-primary-500"
/>
```

### StatsGrid
Grid layout untuk menampilkan 6 stat cards dengan data WargaNet.

**Data yang ditampilkan:**
- Total Warga
- Total Keluarga
- Iuran Aktif
- Total Iuran
- Pending
- Lunas

### FinancialSummary
Card untuk menampilkan ringkasan keuangan dengan bar chart sederhana.

**Fitur:**
- Header dengan dropdown tahun
- Legend pemasukan & pengeluaran
- Visualisasi bar chart

### ProjectsOverview
Card untuk menampilkan ringkasan aktivitas dengan mini bar charts.

**Fitur:**
- Header dengan dropdown periode
- 2 stat cards dengan trend indicator
- Mini bar chart untuk setiap stat

## Adaptasi dari Figma

Komponen-komponen ini diadaptasi dari Figma design dengan perubahan:

1. **Tailwind classes** diganti dengan utility classes yang sesuai project
2. **Colors** menggunakan design tokens dari `tailwind.config.js`
3. **Dark mode** support ditambahkan
4. **Accessibility** standards dipertahankan (44px touch targets, ARIA)
5. **Icons** menggunakan Heroicons (SVG inline)
6. **Typography** disesuaikan dengan Inter font family
7. **Data** disesuaikan dengan konteks WargaNet

## Design System Compliance

✅ Menggunakan existing Card component
✅ Menggunakan color tokens (primary-500, gray-*, dll)
✅ Dark mode support dengan `dark:` prefix
✅ Responsive design dengan grid system
✅ Accessibility compliant
✅ Consistent spacing dengan Tailwind scale
