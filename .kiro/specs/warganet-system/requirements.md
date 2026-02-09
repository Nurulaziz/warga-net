# Dokumen Persyaratan: Sistem WargaNet

## Pendahuluan

WargaNet adalah sistem manajemen RT (Rukun Tetangga) digital yang dirancang untuk memodernisasi administrasi komunitas di Indonesia, khususnya untuk RT.04/010 Perumahan Satriamekar Raya Residence 2, Kelurahan Satriamekar, Kecamatan Tambun Utara, Kabupaten Bekasi, Jawa Barat. Sistem ini menyediakan akses berbasis peran yang aman ke data warga dan fitur manajemen komunitas melalui autentikasi OTP berbasis WhatsApp. Dibangun sebagai monorepo dengan backend NestJS dan frontend React, WargaNet menekankan keamanan, aksesibilitas, dan desain mobile-first untuk melayani beragam anggota komunitas termasuk warga lanjut usia.

## Glosarium

- **Sistem**: Aplikasi WargaNet (backend + frontend)
- **RT**: Rukun Tetangga (unit administratif lingkungan di Indonesia)
- **OTP**: One-Time Password / Kata Sandi Sekali Pakai (kode 6 digit)
- **RBAC**: Role-Based Access Control / Kontrol Akses Berbasis Peran
- **Warga**: Anggota komunitas/penduduk
- **WhatsApp_Gateway**: WhatsApp Business API atau layanan WhatsApp Gateway
- **Matriks_Izin**: Kumpulan lengkap izin yang diberikan kepada pengguna berdasarkan peran mereka
- **JWT**: JSON Web Token (token akses dan refresh)
- **Prisma**: TypeScript ORM untuk akses database
- **Nomor_Telepon**: Nomor telepon Indonesia dalam format E.164 (identifikasi utama pengguna)
- **Sesi**: Sesi pengguna terautentikasi yang dikelola melalui JWT token
- **Log_Audit**: Catatan sistem tentang kejadian terkait keamanan
- **TTL**: Time To Live / Waktu Hidup (periode kedaluwarsa)
- **Pembatas_Laju**: Komponen yang membatasi frekuensi permintaan

## Persyaratan

### Persyaratan 1: Autentikasi WhatsApp Berbasis OTP

**User Story:** Sebagai anggota komunitas terdaftar, saya ingin masuk hanya menggunakan nomor telepon dan OTP WhatsApp, sehingga saya dapat mengakses sistem dengan aman tanpa mengelola kata sandi.

#### Kriteria Penerimaan

1. KETIKA pengguna mengirimkan nomor telepon, MAKA Sistem HARUS memvalidasi format terhadap standar E.164
2. KETIKA nomor telepon yang valid dikirimkan, MAKA Sistem HARUS memeriksa apakah nomor tersebut ada dalam database pengguna terdaftar
3. JIKA nomor telepon tidak terdaftar, MAKA Sistem HARUS menolak upaya login dengan pesan kesalahan yang jelas
4. KETIKA nomor telepon terdaftar diverifikasi, MAKA Sistem HARUS menghasilkan OTP numerik 6 digit
5. KETIKA OTP dihasilkan, MAKA Sistem HARUS meng-hash OTP menggunakan bcrypt sebelum penyimpanan
6. KETIKA OTP disimpan, MAKA Sistem HARUS menetapkan TTL 5 menit
7. KETIKA OTP siap, MAKA WhatsApp_Gateway HARUS mengirim OTP ke nomor telepon pengguna
8. KETIKA pengguna mengirimkan OTP untuk verifikasi, MAKA Sistem HARUS membandingkan nilai hash
9. JIKA OTP valid dan belum kedaluwarsa, MAKA Sistem HARUS menandai OTP sebagai terpakai dan melanjutkan autentikasi
10. JIKA OTP tidak valid atau kedaluwarsa, MAKA Sistem HARUS menolak verifikasi dan menambah penghitung percobaan gagal
11. KETIKA pengguna berhasil memverifikasi OTP untuk pertama kali, MAKA Sistem HARUS mengaktifkan akun pengguna
12. KETIKA autentikasi berhasil, MAKA Sistem HARUS menghasilkan token akses (JWT) dan refresh token
13. KETIKA token dihasilkan, MAKA Sistem HARUS menyertakan Matriks_Izin pengguna dalam payload token akses
14. KETIKA autentikasi selesai, MAKA Sistem HARUS mencatat kejadian login berhasil dengan timestamp, alamat IP, dan user agent
15. KETIKA autentikasi selesai, MAKA Sistem HARUS mengarahkan pengguna ke dashboard sesuai peran mereka

### Persyaratan 2: Pembatasan Laju dan Kontrol Keamanan

**User Story:** Sebagai administrator sistem, saya ingin sistem mencegah penyalahgunaan mekanisme OTP, sehingga kami dapat melindungi dari serangan brute force dan kehabisan sumber daya.

#### Kriteria Penerimaan

1. Sistem HARUS membatasi permintaan OTP hingga 3 percobaan per nomor telepon per jendela 15 menit
2. Sistem HARUS membatasi permintaan OTP hingga 10 percobaan per alamat IP per jendela 15 menit
3. KETIKA batas laju terlampaui, MAKA Sistem HARUS memblokir permintaan OTP lebih lanjut untuk sisa periode jendela
4. KETIKA batas laju terlampaui, MAKA Sistem HARUS mencatat kejadian sebagai aktivitas mencurigakan
5. Sistem HARUS membatasi percobaan verifikasi OTP hingga 5 per token OTP
6. KETIKA verifikasi OTP gagal 5 kali, MAKA Sistem HARUS membatalkan OTP dan memerlukan permintaan baru
7. KETIKA pola mencurigakan terdeteksi (beberapa percobaan gagal dari IP yang sama), MAKA Sistem HARUS memblokir sementara alamat IP selama 1 jam
8. Sistem HARUS menerapkan exponential backoff untuk percobaan login gagal berulang dari nomor telepon yang sama
9. KETIKA nomor telepon diblokir karena aktivitas mencurigakan, MAKA Sistem HARUS memberi tahu ADMIN_RT melalui log audit

### Persyaratan 3: Pengiriman OTP dan Mekanisme Percobaan Ulang

**User Story:** Sebagai pengguna, saya ingin pengiriman OTP yang andal bahkan ketika masalah jaringan terjadi, sehingga saya selalu dapat mengakses sistem saat dibutuhkan.

#### Kriteria Penerimaan

1. KETIKA WhatsApp_Gateway gagal mengirim OTP, MAKA Sistem HARUS mencoba ulang hingga 3 kali dengan exponential backoff
2. KETIKA semua percobaan ulang gagal, MAKA Sistem HARUS mencatat kegagalan pengiriman dengan detail kesalahan
3. KETIKA pengiriman OTP gagal, MAKA Sistem HARUS mengembalikan pesan kesalahan yang ramah pengguna yang menyarankan percobaan ulang setelah beberapa menit
4. Sistem HARUS menggunakan template pesan OTP standar: "Kode OTP WargaNet Anda: {OTP}. Berlaku 5 menit. Jangan bagikan kode ini."
5. KETIKA WhatsApp_Gateway tidak dapat dijangkau, MAKA Sistem HARUS mengembalikan kesalahan layanan tidak tersedia
6. Sistem HARUS memvalidasi status nomor telepon (aktif/tidak aktif) sebelum mengirim OTP
7. JIKA nomor telepon ditandai sebagai tidak aktif oleh operator, MAKA Sistem HARUS menolak permintaan OTP dengan pesan kesalahan yang sesuai

### Persyaratan 4: Kontrol Akses Berbasis Peran (RBAC)

**User Story:** Sebagai administrator sistem, saya ingin kontrol granular atas apa yang dapat dilakukan setiap pengguna, sehingga saya dapat menegakkan batasan akses yang tepat berdasarkan peran komunitas.

#### Kriteria Penerimaan

1. Sistem HARUS mendukung lima peran default: SUPER_ADMIN, ADMIN_RT, ADMIN_SEKRETARIS, ADMIN_BENDAHARA, dan WARGA
2. Sistem HARUS menyimpan semua izin dalam database dengan atribut fitur dan aksi
3. Sistem HARUS mendukung empat aksi izin: create, read, update, dan delete
4. KETIKA peran dibuat, MAKA Sistem HARUS mengizinkan penugasan beberapa izin ke peran tersebut
5. KETIKA pengguna diberi peran, MAKA Sistem HARUS mewarisi semua izin dari peran tersebut
6. Sistem HARUS menegakkan pemeriksaan izin pada semua endpoint API backend menggunakan guards
7. KETIKA pengguna mencoba suatu aksi, MAKA Sistem HARUS memverifikasi pengguna memiliki izin yang diperlukan sebelum melanjutkan
8. JIKA pengguna tidak memiliki izin yang diperlukan, MAKA Sistem HARUS mengembalikan kesalahan HTTP 403 Forbidden
9. Sistem HARUS menyertakan Matriks_Izin lengkap dalam payload token akses JWT
10. KETIKA izin diperbarui untuk suatu peran, MAKA Sistem HARUS memerlukan pengguna untuk autentikasi ulang untuk menerima izin yang diperbarui
11. Sistem HARUS mencatat semua kegagalan pemeriksaan izin dalam Log_Audit

### Persyaratan 5: Manajemen Sesi dan Penanganan Token

**User Story:** Sebagai pengguna, saya ingin sesi saya tetap aman dan otomatis diperbarui, sehingga saya dapat bekerja tanpa gangguan sambil menjaga keamanan.

#### Kriteria Penerimaan

1. Sistem HARUS menghasilkan token akses dengan kedaluwarsa 15 menit
2. Sistem HARUS menghasilkan refresh token dengan kedaluwarsa 30 hari
3. KETIKA token akses kedaluwarsa, MAKA Sistem HARUS mengizinkan refresh menggunakan refresh token yang valid
4. KETIKA refresh token digunakan, MAKA Sistem HARUS merotasi refresh token (menerbitkan yang baru dan membatalkan yang lama)
5. Sistem HARUS menyimpan refresh token di Redis dengan kedaluwarsa otomatis
6. KETIKA pengguna logout, MAKA Sistem HARUS membatalkan token akses dan refresh token
7. Sistem HARUS menyediakan fitur "logout dari semua perangkat" yang membatalkan semua refresh token untuk pengguna
8. KETIKA refresh token digunakan setelah logout, MAKA Sistem HARUS menolak permintaan
9. Sistem HARUS menerapkan sliding session timeout: perpanjang sesi pada aktivitas pengguna
10. Sistem HARUS mengizinkan konfigurasi durasi timeout sesi melalui variabel lingkungan

### Persyaratan 6: Manajemen Perubahan Nomor Telepon

**User Story:** Sebagai pengguna, saya ingin mengubah nomor telepon terdaftar saya dengan aman, sehingga saya dapat mempertahankan akses jika nomor saya berubah.

#### Kriteria Penerimaan

1. KETIKA pengguna meminta perubahan nomor telepon, MAKA Sistem HARUS memerlukan verifikasi OTP dari nomor telepon saat ini
2. KETIKA telepon saat ini diverifikasi, MAKA Sistem HARUS mengirim OTP ke nomor telepon baru untuk verifikasi
3. KETIKA kedua OTP diverifikasi, MAKA Sistem HARUS membuat permintaan perubahan telepon dengan status pending
4. DI MANA peran pengguna adalah WARGA, Sistem HARUS memerlukan persetujuan ADMIN_RT untuk perubahan nomor telepon
5. DI MANA peran pengguna adalah ADMIN_RT atau lebih tinggi, Sistem HARUS menyetujui otomatis perubahan nomor telepon
6. KETIKA perubahan telepon disetujui, MAKA Sistem HARUS memperbarui nomor telepon pengguna
7. KETIKA perubahan telepon selesai, MAKA Sistem HARUS mencatat perubahan dalam phone_change_logs dengan nomor lama, nomor baru, timestamp, dan pemberi persetujuan
8. KETIKA perubahan telepon selesai, MAKA Sistem HARUS membatalkan semua sesi yang ada untuk pengguna tersebut
9. Sistem HARUS mencegah perubahan ke nomor telepon yang sudah terdaftar ke pengguna lain
10. Sistem HARUS mengirim notifikasi ke nomor telepon lama ketika perubahan selesai

### Persyaratan 7: Pra-Registrasi dan Manajemen Pengguna

**User Story:** Sebagai administrator RT, saya ingin melakukan pra-registrasi anggota komunitas, sehingga hanya warga yang berwenang yang dapat mengakses sistem.

#### Kriteria Penerimaan

1. Sistem TIDAK BOLEH menyediakan fungsionalitas registrasi mandiri publik
2. KETIKA ADMIN_RT membuat pengguna, MAKA Sistem HARUS memerlukan nomor telepon, nama lengkap, dan penugasan peran
3. KETIKA pengguna dibuat, MAKA Sistem HARUS menetapkan status akun menjadi tidak aktif
4. KETIKA pengguna login untuk pertama kali, MAKA Sistem HARUS mengaktifkan akun secara otomatis
5. Sistem HARUS memvalidasi keunikan nomor telepon di semua pengguna
6. Sistem HARUS mengizinkan ADMIN_RT untuk menugaskan pengguna ke keluarga
7. Sistem HARUS mengizinkan ADMIN_RT untuk memperbarui informasi pengguna kecuali nomor telepon (memerlukan alur perubahan telepon)
8. Sistem HARUS mengizinkan ADMIN_RT untuk menonaktifkan akun pengguna
9. KETIKA akun pengguna dinonaktifkan, MAKA Sistem HARUS membatalkan semua sesi aktif
10. Sistem HARUS mencegah penghapusan pengguna dengan entri log audit (soft delete saja)

### Persyaratan 8: Manajemen Data Keluarga dan Warga

**User Story:** Sebagai administrator RT, saya ingin mengelola unit keluarga dan informasi warga, sehingga saya dapat memelihara catatan komunitas yang akurat.

#### Kriteria Penerimaan

1. Sistem HARUS mengizinkan pembuatan catatan keluarga dengan penunjukan kepala keluarga
2. Sistem HARUS mengizinkan penugasan beberapa warga ke satu keluarga
3. Sistem HARUS menyimpan informasi warga termasuk nama, nomor KTP, tanggal lahir, dan hubungan dengan kepala keluarga
4. KETIKA warga dibuat, MAKA Sistem HARUS memvalidasi keunikan nomor KTP
5. Sistem HARUS mengizinkan ADMIN_RT dan ADMIN_SEKRETARIS untuk membuat, membaca, memperbarui informasi warga
6. Sistem HARUS mengizinkan WARGA untuk membaca hanya informasi keluarga mereka sendiri
7. Sistem HARUS mempertahankan integritas referensial antara keluarga dan warga
8. Sistem HARUS mendukung soft delete untuk keluarga dan warga
9. KETIKA keluarga dihapus, MAKA Sistem HARUS cascade soft delete ke semua warga terkait
10. Sistem HARUS menyediakan fungsionalitas pencarian untuk warga berdasarkan nama, nomor KTP, atau keluarga

### Persyaratan 9: Pencatatan Audit dan Pemantauan Keamanan

**User Story:** Sebagai administrator sistem, saya ingin log audit yang komprehensif, sehingga saya dapat melacak kejadian keamanan dan menyelidiki insiden.

#### Kriteria Penerimaan

1. Sistem HARUS mencatat semua upaya autentikasi (berhasil dan gagal) dengan timestamp, nomor telepon, alamat IP, dan user agent
2. Sistem HARUS mencatat semua kegagalan pemeriksaan izin dengan ID pengguna, aksi yang dicoba, dan sumber daya
3. Sistem HARUS mencatat semua perubahan nomor telepon dengan nomor lama, nomor baru, pemohon, dan pemberi persetujuan
4. Sistem HARUS mencatat semua pelanggaran pembatasan laju dengan nomor telepon atau alamat IP
5. Sistem HARUS mencatat semua kejadian pembuatan dan verifikasi OTP
6. Sistem HARUS mencatat semua perubahan status akun pengguna (aktivasi, penonaktifan)
7. Sistem HARUS mencatat semua modifikasi peran dan izin
8. Sistem HARUS menyimpan log audit dalam tabel audit_log khusus
9. Sistem HARUS menyimpan log audit minimal 1 tahun
10. Sistem HARUS menyediakan antarmuka query log audit untuk SUPER_ADMIN dan ADMIN_RT
11. Sistem HARUS mencegah modifikasi atau penghapusan entri log audit

### Persyaratan 10: Ekspor Data dan Backup

**User Story:** Sebagai administrator RT, saya ingin mengekspor data warga dan memastikan backup ada, sehingga saya dapat mempertahankan kontinuitas data dan memenuhi persyaratan pelaporan.

#### Kriteria Penerimaan

1. Sistem HARUS menyediakan fungsionalitas ekspor untuk data warga dalam format CSV
2. Sistem HARUS menyediakan fungsionalitas ekspor untuk data keluarga dalam format CSV
3. KETIKA mengekspor data, MAKA Sistem HARUS menghormati izin pengguna (WARGA tidak dapat mengekspor)
4. Sistem HARUS menyertakan timestamp ekspor dan pengguna yang meminta dalam metadata ekspor
5. Sistem HARUS menerapkan backup database otomatis harian
6. Sistem HARUS menyimpan backup database minimal 30 hari
7. Sistem HARUS menyediakan dokumentasi prosedur pemulihan backup
8. Sistem HARUS mengenkripsi file backup saat disimpan
9. Sistem HARUS mencatat semua operasi ekspor dalam Log_Audit
10. Sistem HARUS mengizinkan SUPER_ADMIN untuk memicu operasi backup manual

### Persyaratan 11: Pemantauan Kesehatan dan Observabilitas

**User Story:** Sebagai operator sistem, saya ingin memantau kesehatan dan kinerja sistem, sehingga saya dapat memastikan keandalan dan dengan cepat mendiagnosis masalah.

#### Kriteria Penerimaan

1. Sistem HARUS menyediakan endpoint /health yang mengembalikan status sistem
2. Sistem HARUS memeriksa konektivitas database dalam pemeriksaan kesehatan
3. Sistem HARUS memeriksa konektivitas Redis dalam pemeriksaan kesehatan
4. Sistem HARUS memeriksa konektivitas WhatsApp_Gateway dalam pemeriksaan kesehatan
5. KETIKA ada dependensi yang tidak sehat, MAKA Sistem HARUS mengembalikan HTTP 503 Service Unavailable
6. Sistem HARUS menyediakan endpoint /metrics untuk metrik yang kompatibel dengan Prometheus
7. Sistem HARUS mengumpulkan metrik untuk jumlah permintaan, waktu respons, dan tingkat kesalahan
8. Sistem HARUS menerapkan logging terstruktur dengan correlation ID
9. Sistem HARUS mencatat semua kesalahan dengan stack trace ke sistem logging terpusat
10. Sistem HARUS terintegrasi dengan layanan pelacakan kesalahan (misalnya Sentry) untuk pemantauan exception

### Persyaratan 12: Desain Responsif Mobile-First Frontend

**User Story:** Sebagai anggota komunitas, saya ingin mengakses sistem dengan mudah di ponsel saya, sehingga saya dapat mengelola tugas komunitas saat bepergian.

#### Kriteria Penerimaan

1. Sistem HARUS merender semua komponen UI mobile-first dengan breakpoint responsif
2. KETIKA dilihat di perangkat mobile, MAKA Sistem HARUS menampilkan navigasi bawah
3. KETIKA dilihat di perangkat desktop, MAKA Sistem HARUS menampilkan navigasi sidebar
4. Sistem HARUS menggunakan ukuran target sentuh minimum 44x44 piksel untuk mobile
5. Sistem HARUS menggunakan ukuran font yang dapat dibaca (minimum 16px untuk teks body)
6. Sistem HARUS menyediakan rasio kontras tinggi untuk aksesibilitas (kepatuhan WCAG AA)
7. Sistem HARUS mendukung skema warna terang dan gelap
8. Sistem HARUS mengoptimalkan gambar dan aset untuk bandwidth mobile
9. Sistem HARUS menerapkan lazy loading untuk sumber daya non-kritis
10. Sistem HARUS mencapai skor kinerja mobile Lighthouse di atas 90

### Persyaratan 13: Guard UI Berbasis Izin Frontend

**User Story:** Sebagai pengguna, saya ingin melihat hanya fitur yang saya miliki izin untuk menggunakannya, sehingga antarmuka jelas dan tidak berantakan dengan opsi yang tidak dapat diakses.

#### Kriteria Penerimaan

1. Sistem HARUS menyembunyikan item menu navigasi untuk fitur yang tidak dapat diakses pengguna
2. Sistem HARUS menyembunyikan tombol aksi (buat, edit, hapus) berdasarkan izin pengguna
3. KETIKA pengguna tidak memiliki izin, MAKA Sistem TIDAK BOLEH merender komponen UI yang sesuai
4. Sistem HARUS mengambil Matriks_Izin dari token JWT untuk keputusan guard UI
5. Sistem HARUS menerapkan route guard yang mencegah navigasi ke halaman yang tidak diotorisasi
6. KETIKA pengguna mencoba mengakses route yang tidak diotorisasi, MAKA Sistem HARUS mengarahkan ke dashboard
7. Sistem HARUS menampilkan konten dashboard yang sesuai dengan peran berdasarkan peran pengguna
8. Sistem HARUS menampilkan tabel data berbasis izin (misalnya WARGA hanya melihat keluarga sendiri)
9. Sistem HARUS menerapkan guard frontend sebagai kontrol visibilitas saja (backend menegakkan keamanan)
10. KETIKA izin berubah, MAKA Sistem HARUS memerlukan pengguna untuk login ulang untuk memperbarui guard UI

### Persyaratan 14: Dokumentasi API dan Pengalaman Developer

**User Story:** Sebagai developer, saya ingin dokumentasi API yang komprehensif, sehingga saya dapat berintegrasi dengan dan memelihara sistem secara efektif.

#### Kriteria Penerimaan

1. Sistem HARUS menyediakan dokumentasi OpenAPI/Swagger untuk semua endpoint API
2. Sistem HARUS mendokumentasikan semua skema request dan response
3. Sistem HARUS mendokumentasikan semua persyaratan autentikasi per endpoint
4. Sistem HARUS mendokumentasikan semua izin yang diperlukan per endpoint
5. Sistem HARUS menyediakan contoh request dan response untuk setiap endpoint
6. Sistem HARUS mendokumentasikan semua kode kesalahan dan artinya
7. Sistem HARUS menyediakan UI dokumentasi API yang dapat diakses di /api/docs
8. Sistem HARUS menyertakan informasi pembatasan laju dalam dokumentasi API
9. Sistem HARUS memberi versi API dengan prefix /api/v1
10. Sistem HARUS memelihara changelog API yang mendokumentasikan perubahan breaking

### Persyaratan 15: Skema Database dan Integritas Data

**User Story:** Sebagai arsitek sistem, saya ingin skema database yang dirancang dengan baik dengan constraint yang tepat, sehingga integritas data dipelihara secara otomatis.

#### Kriteria Penerimaan

1. Sistem HARUS menerapkan semua tabel database menggunakan skema Prisma
2. Sistem HARUS menegakkan constraint foreign key untuk semua relasi
3. Sistem HARUS menerapkan constraint unique pada nomor telepon dan nomor KTP
4. Sistem HARUS menggunakan UUID untuk semua primary key
5. Sistem HARUS menerapkan timestamp created_at dan updated_at pada semua tabel
6. Sistem HARUS menerapkan soft delete menggunakan timestamp deleted_at
7. Sistem HARUS membuat indeks database pada kolom yang sering di-query (phone_number, email)
8. Sistem HARUS menerapkan migrasi database menggunakan Prisma migrate
9. Sistem HARUS menyediakan skrip seeding database untuk peran dan izin default
10. Sistem HARUS menegakkan constraint NOT NULL pada field yang diperlukan
11. Sistem HARUS menggunakan tipe data yang sesuai (misalnya TIMESTAMP WITH TIME ZONE untuk tanggal)

### Persyaratan 16: Testing dan Quality Assurance

**User Story:** Sebagai developer, saya ingin tes otomatis yang komprehensif, sehingga saya dapat dengan percaya diri membuat perubahan tanpa merusak fungsionalitas yang ada.

#### Kriteria Penerimaan

1. Sistem HARUS mencapai cakupan kode minimum 80% untuk layanan backend
2. Sistem HARUS menerapkan unit test untuk semua metode service
3. Sistem HARUS menerapkan integration test untuk semua endpoint API
4. Sistem HARUS menerapkan E2E test untuk alur pengguna kritis (login, verifikasi OTP)
5. Sistem HARUS melakukan mock dependensi eksternal (WhatsApp_Gateway) dalam tes
6. Sistem HARUS menggunakan database tes terpisah dari database development
7. Sistem HARUS menerapkan property-based test untuk pembuatan dan validasi OTP
8. Sistem HARUS menerapkan component test frontend menggunakan React Testing Library
9. Sistem HARUS menjalankan semua tes dalam pipeline CI/CD sebelum deployment
10. Sistem HARUS gagal build ketika tes gagal atau cakupan turun di bawah threshold

### Persyaratan 17: Deployment dan Infrastruktur

**User Story:** Sebagai DevOps engineer, saya ingin deployment yang ter-containerized dengan orkestrasi yang tepat, sehingga saya dapat men-deploy dan menskalakan sistem dengan andal.

#### Kriteria Penerimaan

1. Sistem HARUS menyediakan Dockerfile untuk aplikasi backend
2. Sistem HARUS menyediakan Dockerfile untuk aplikasi frontend
3. Sistem HARUS menyediakan docker-compose.yml untuk development lokal
4. Sistem HARUS mengkonfigurasi Nginx sebagai reverse proxy untuk frontend dan backend
5. Sistem HARUS menegakkan HTTPS untuk semua koneksi di production
6. Sistem HARUS mengkonfigurasi CORS dengan benar untuk mengizinkan komunikasi frontend-backend
7. Sistem HARUS menggunakan variabel lingkungan untuk semua konfigurasi (tidak ada secret yang di-hardcode)
8. Sistem HARUS menyediakan file .env.example yang mendokumentasikan semua variabel lingkungan yang diperlukan
9. Sistem HARUS menerapkan connection pooling database untuk performa
10. Sistem HARUS mengkonfigurasi Redis untuk penyimpanan sesi dan caching
11. Sistem HARUS menyediakan dokumentasi deployment dengan instruksi langkah demi langkah

### Persyaratan 18: Penguatan Keamanan

**User Story:** Sebagai petugas keamanan, saya ingin sistem mengikuti praktik terbaik keamanan, sehingga data komunitas dilindungi dari ancaman.

#### Kriteria Penerimaan

1. Sistem HARUS meng-hash semua OTP menggunakan bcrypt dengan salt rounds 10
2. Sistem HARUS menandatangani token JWT menggunakan algoritma RS256 dengan private key
3. Sistem HARUS menyimpan private key JWT dengan aman (tidak di repository kode)
4. Sistem HARUS menerapkan perlindungan CSRF untuk operasi yang mengubah state
5. Sistem HARUS membersihkan semua input pengguna untuk mencegah SQL injection
6. Sistem HARUS memvalidasi semua input pengguna terhadap format yang diharapkan
7. Sistem HARUS menerapkan header Content Security Policy
8. Sistem HARUS menetapkan header HTTP yang aman (X-Frame-Options, X-Content-Type-Options)
9. Sistem HARUS menerapkan batas ukuran request untuk mencegah serangan DoS
10. Sistem HARUS menonaktifkan pesan kesalahan detail di production (tidak ada stack trace ke pengguna)
11. Sistem HARUS menerapkan atribut cookie sesi yang aman (HttpOnly, Secure, SameSite)
12. Sistem HARUS secara teratur memperbarui dependensi untuk menambal kerentanan keamanan
