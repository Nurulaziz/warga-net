# Session Management Strategy - WargaNet

## Overview

WargaNet menggunakan **OTP-based authentication dengan refresh token mechanism** untuk balance antara keamanan, user experience, dan cost efficiency.

## Authentication Pattern: Opsi 2 (Recommended)

### 🟡 OTP Saat Login Pertama & Device Baru

Sistem menggunakan pola hybrid:
- **OTP WhatsApp**: Untuk autentikasi awal dan device baru
- **JWT Access Token**: Untuk request authorization (15 menit)
- **JWT Refresh Token**: Untuk session persistence (30 hari)

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Login Pertama / Device Baru               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Input Nomor HP   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Kirim OTP        │
                    │ via WhatsApp     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Verifikasi OTP   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Generate Tokens: │
                    │ - Access (15m)   │
                    │ - Refresh (30d)  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Login Berhasil   │
                    └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Akses Berikutnya (Device Dikenal)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Access Token     │
                    │ Expired (15m)    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Auto Refresh     │
                    │ menggunakan      │
                    │ Refresh Token    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Generate Tokens  │
                    │ Baru (Rotation)  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Akses Berlanjut  │
                    │ (Tanpa OTP)      │
                    └──────────────────┘
```

## Token Configuration

### Access Token
- **Duration**: 15 menit
- **Purpose**: Authorization untuk API requests
- **Storage**: Memory (frontend state)
- **Contains**: User ID, role, permissions matrix

### Refresh Token
- **Duration**: 30 hari (updated dari 7 hari)
- **Purpose**: Session persistence tanpa OTP berulang
- **Storage**: Redis (backend) + HttpOnly cookie (frontend)
- **Rotation**: Ya, setiap kali digunakan

## Rationale: Kenapa 30 Hari?

### ✅ Keuntungan 30 Hari vs 7 Hari

#### 1. **Cost Efficiency**
```
Asumsi: 100 warga aktif

Dengan 7 hari:
- Login ulang: 4x per bulan
- Total OTP: 100 warga × 4 = 400 OTP/bulan
- Cost: 400 × Rp 300 = Rp 120,000/bulan

Dengan 30 hari:
- Login ulang: 1x per bulan
- Total OTP: 100 warga × 1 = 100 OTP/bulan
- Cost: 100 × Rp 300 = Rp 30,000/bulan

Penghematan: Rp 90,000/bulan (75% lebih murah!)
```

#### 2. **Better User Experience**
- Warga tidak perlu OTP berulang kali
- Cocok untuk pengguna yang akses tidak terlalu sering (1-2x seminggu)
- Mengurangi friction untuk warga lanjut usia

#### 3. **Sliding Session**
- Dengan sliding session, pengguna aktif tidak pernah perlu OTP lagi
- Refresh token di-rotate setiap digunakan
- Session otomatis diperpanjang 30 hari dari last activity

#### 4. **Industry Standard**
- Bank apps: 30-90 hari
- E-wallet: 30-60 hari
- Government apps: 30-90 hari

### ⚠️ Security Considerations

Meskipun 30 hari lebih lama, keamanan tetap terjaga karena:

1. **Token Rotation**: Refresh token berubah setiap kali digunakan
2. **Logout Capability**: User bisa logout manual kapan saja
3. **Logout All Devices**: Admin bisa force logout semua device
4. **IP & Device Tracking**: Semua login dicatat dengan IP dan user agent
5. **Audit Logging**: Semua aktivitas tercatat untuk investigasi

### 🔒 Mitigasi Risiko

Jika HP hilang/dicuri:

```
Skenario Terburuk:
- Pencuri punya akses maksimal 30 hari
- Tapi: User bisa logout all devices dari device lain
- Tapi: Admin RT bisa deactivate account
- Tapi: Semua aktivitas tercatat di audit log

Skenario Realistis:
- User lapor HP hilang → Admin deactivate account
- Semua session invalidated immediately
- Pencuri tidak bisa akses
```

## User Scenarios

### Scenario 1: Warga Aktif (Pakai Setiap Hari)
```
Hari 1: Login dengan OTP
Hari 2-30: Buka app → auto refresh → tidak perlu OTP
Hari 31-60: Buka app → auto refresh → tidak perlu OTP
...
Hari 365: Masih bisa akses tanpa OTP (selama aktif)
```

**Result**: Tidak pernah perlu OTP lagi setelah login pertama!

### Scenario 2: Warga Jarang Akses (1x Sebulan)
```
Hari 1: Login dengan OTP
Hari 30: Buka app → auto refresh → tidak perlu OTP
Hari 60: Buka app → auto refresh → tidak perlu OTP
```

**Result**: Cukup 1x OTP per bulan

### Scenario 3: Warga Tidak Aktif (>30 Hari)
```
Hari 1: Login dengan OTP
Hari 2-30: Tidak buka app
Hari 31: Buka app → refresh token expired → perlu OTP lagi
```

**Result**: Perlu OTP lagi setelah 30 hari tidak aktif

### Scenario 4: Admin RT (Pakai Setiap Hari)
```
Hari 1: Login dengan OTP
Hari 2-365: Buka app setiap hari → auto refresh → tidak perlu OTP
```

**Result**: Hanya 1x OTP per tahun (atau sampai logout manual)

## Implementation Details

### Environment Variables

```env
# Access token: 15 menit
JWT_ACCESS_TOKEN_EXPIRY=15m

# Refresh token: 30 hari
JWT_REFRESH_TOKEN_EXPIRY=30d
```

### Redis Storage

```typescript
// Refresh token disimpan di Redis dengan TTL 30 hari
const key = `refresh:${userId}:${tokenId}`;
const ttl = 2592000; // 30 days in seconds

await redisService.setex(key, ttl, tokenData);
```

### Token Rotation

```typescript
// Setiap refresh, token lama di-invalidate dan generate token baru
async refreshToken(oldRefreshToken: string): Promise<AuthTokens> {
  // 1. Verify old token
  const payload = await this.verifyRefreshToken(oldRefreshToken);
  
  // 2. Invalidate old token
  await this.invalidateRefreshToken(oldRefreshToken);
  
  // 3. Generate new tokens
  const newAccessToken = this.generateAccessToken(payload);
  const newRefreshToken = this.generateRefreshToken(payload.userId);
  
  // 4. Store new refresh token (30 hari dari sekarang)
  await this.storeRefreshToken(payload.userId, newRefreshToken);
  
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

## Monitoring & Analytics

Track metrics untuk optimize session management:

1. **OTP Usage**
   - Total OTP sent per month
   - Cost per month
   - OTP success rate

2. **Session Duration**
   - Average session length
   - Percentage of users reaching 30 days
   - Percentage of users needing re-authentication

3. **Security Events**
   - Failed login attempts
   - Suspicious activity (multiple devices)
   - Forced logouts

## Future Considerations

Jika diperlukan, bisa adjust berdasarkan data:

### Option A: Perpanjang Lagi (60-90 Hari)
Jika cost masih tinggi dan tidak ada security issues

### Option B: Persingkat (14 Hari)
Jika ada security concerns atau abuse

### Option C: Role-Based Duration
```
SUPER_ADMIN: 7 hari (lebih strict)
ADMIN_RT: 14 hari
WARGA: 30 hari (lebih nyaman)
```

## Conclusion

Konfigurasi 30 hari untuk refresh token adalah sweet spot yang:
- ✅ Menghemat cost WhatsApp OTP hingga 75%
- ✅ Memberikan UX yang nyaman untuk warga
- ✅ Tetap menjaga keamanan dengan token rotation
- ✅ Sesuai dengan industry standard

Dengan sliding session, pengguna aktif praktis tidak pernah perlu OTP lagi setelah login pertama, sementara pengguna tidak aktif tetap aman dengan automatic expiration.
