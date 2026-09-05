# Aturan Desain WargaNet — Soft Neo-Brutalism

Panduan ini adalah **aturan desain resmi** untuk tombol, garis/divider, dan bayangan
di seluruh tampilan WargaNet (landing, login, dan aplikasi). Tujuannya konsistensi:
tegas, editorial, dan mudah dipindai — bukan flat/lembut.

## Prinsip

1. **Garis = solid & gelap.** Ketegasan garis dibedakan lewat **ketebalan** (border-width),
   bukan opacity. Hindari border transparan lemah (mis. `rgba(0,0,0,0.2)`) karena samar.
2. **Tombol = border ink solid + hard-shadow offset.** Bayangan berupa kotak solid ber-offset
   (bukan blur), radius kecil, dan efek "ditekan" saat hover/active.
3. **Hemat penekanan.** Hard-shadow dipakai untuk aksi utama, bukan semua elemen.

## Token warna (tailwind.config.js)

| Token | Nilai | Pakai untuk |
|---|---|---|
| `warm.50` | `#FFF1DD` | Background utama landing |
| `warm.300` / `warm.border` | `#2B2A25` | **Garis/divider utama** (solid gelap) |
| `ink.strong` | `#171717` | Border tombol, garis paling tegas |
| `edge.subtle` | `rgba(20,20,20,0.20)` | Garis halus di dalam kartu terang |
| `edge.DEFAULT` / `edge.strong` | `#171717` | Border struktural & tombol (padukan `border-2`) |
| `divider.section` | `#171717` | Pembatas antar-section besar |
| `brand.500` / `brand.600` | `#2563EB` / `#1d4ed8` | Isi tombol primary + hover |

## Tombol — pakai utility class (index.css)

Gunakan class baku ini, **jangan** tulis ulang gaya tombol inline:

- `.btn-brutal` — dasar: `border-2 #171717`, `shadow 4px 4px 0 0 #171717`, radius 6px,
  hover geser `(2px,2px)` + shadow mengecil, active geser `(4px,4px)` + shadow hilang.
- `.btn-brutal-primary` — isi brand biru (di atas bg terang).
- `.btn-brutal-outline` — isi putih (di atas bg terang).
- `.btn-brutal-on-dark` — border & shadow **putih** (untuk section berlatar gelap).

Contoh:

```tsx
<button className="btn-brutal btn-brutal-primary">Masuk</button>
<button className="btn-brutal btn-brutal-outline">Lihat Roadmap</button>
<button className="btn-brutal btn-brutal-on-dark">Masuk ke WargaNet</button>
```

Untuk tombol dengan state disabled (mis. submit OTP), pertahankan struktur brutal:
`border-2 border-ink-strong`, `shadow-[4px_4px_0_0_#171717]`, hover `translate (2px,2px)`,
active `translate (4px,4px)` + `shadow-none`; state disabled: `shadow-none` +
`border-ink-strong/30` + `bg-brand-500/50`.

## Garis/divider

- Divider antar-baris / dalam kartu: `border-warm-300` (kini solid `#2B2A25`).
- Pembatas antar-section besar boleh `border-t-2` untuk lebih tegas.
- Jangan pakai border transparan lemah untuk pemisah struktural.

## Bayangan

- `.hard-shadow` = `3px 3px 0 0 #171717`, `.hard-shadow-sm` = `2px 2px 0 0 #171717`.
- Untuk latar gelap gunakan bayangan putih (lihat `.btn-brutal-on-dark`).
- Hormati `prefers-reduced-motion` (transisi dinonaktifkan otomatis via aturan global).

## Dark mode

Token warm/ink adalah palet mode terang. Di dark mode, gunakan border `gray-700/800`
dan bayangan gelap yang sesuai; jangan paksa `#171717` di atas latar gelap.
