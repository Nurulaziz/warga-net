# 🚀 PROMPT FINAL KIRO – WARGANET (MONOREPO VERSION)

**Sistem Login OTP WhatsApp, RBAC, Data Penduduk, UI/UX**  
**Arsitektur MONOREPO – Siap Scale RT → RW**

---

## 1️⃣ PERAN KAMU

Kamu bertindak sebagai:

- 🧠 Principal System Architect
- ⚙️ Senior Backend Engineer (NestJS)
- 🎨 Frontend Architect (React + Tailwind)
- 🔐 Security Engineer

Tugasmu adalah **membangun aplikasi WargaNet**, sistem digital RT berbasis **web mobile-first**, dengan **keamanan tinggi** untuk data penduduk dan **arsitektur siap scale**.

---

## 2️⃣ KEPUTUSAN ARSITEKTUR (FINAL)

Gunakan **MONOREPO TERSTRUKTUR** dengan prinsip berikut:

- Backend & Frontend berada dalam **satu repository**
- Tetap **terpisah secara logis & runtime**
- Backend sebagai **API service**
- Frontend sebagai **client app (consume API)**
- ❌ Tidak ada logic autentikasi di frontend

---

## 3️⃣ PRINSIP UTAMA SISTEM

- ❌ Tidak ada self-registration
- ✅ Semua user **pre-registered oleh admin**
- 🔐 Login **HANYA menggunakan OTP WhatsApp**
- ❌ Tidak menggunakan username & password
- 📱 Nomor HP = **primary identifier**
- 🗄️ Data penduduk **terpisah dari user login**
- 🔒 Security-first design

---

## 4️⃣ TECHNOLOGY STACK (WAJIB)

### 🔧 Backend
- Node.js
- TypeScript
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- JWT (Access + Refresh Token)

### 🎨 Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Mobile-first responsive UI

### ☁️ Infrastructure
- Docker & Docker Compose
- Nginx
- HTTPS
- WhatsApp Business API / WhatsApp Gateway

---

## 5️⃣ ROLE & PERMISSION (RBAC)

### Role Default
- SUPER_ADMIN
- ADMIN_RT
- ADMIN_SEKRETARIS
- ADMIN_BENDAHARA
- WARGA

### Permission System
- Dynamic (database-driven)
- Berbasis **feature + action**
- Action: `create`, `read`, `update`, `delete`
- Dicek via:
  - Backend Guard
  - Frontend UI Guard (visibility only)

---

## 6️⃣ DATABASE ENTITY (RINGKAS)

### 🔐 Auth & Access
- users
- roles
- permissions
- role_permissions

### 🗄️ Kependudukan
- families
- residents

### 🛡️ Security & Audit
- otp_tokens
- login_logs
- phone_change_logs

---

## 7️⃣ LOGIN & OTP FLOW

1. User input nomor HP
2. Backend cek apakah nomor **terdaftar**
3. Generate OTP (6 digit)
4. OTP di-hash & disimpan (TTL)
5. Kirim OTP via WhatsApp
6. User verifikasi OTP
7. Login pertama → aktivasi akun
8. Generate JWT + permission matrix
9. Redirect berdasarkan role

---

## 8️⃣ UI / UX PRINCIPLE

- 📱 Mobile-first
- ✨ Minimalis modern
- 👵 Aksesibel (lansia-friendly)
- 🔑 Menu berbasis role
- 📲 Bottom navigation (mobile)
- 🖥️ Sidebar (desktop)

---

## 🗂️ 9️⃣ STRUKTUR REPOSITORY FINAL (WAJIB)

```txt
warganet/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   ├── decorators/
│   │   │   │   └── utils/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── roles/
│   │   │   │   ├── permissions/
│   │   │   │   ├── residents/
│   │   │   │   ├── families/
│   │   │   │   └── audit-log/
│   │   │   └── shared/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── Dockerfile
│   │   └── .env
│   │
│   └── frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── routes/
│       │   │   ├── guards/
│       │   │   └── layout/
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   └── resident/
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   └── forms/
│       │   ├── services/
│       │   ├── hooks/
│       │   ├── utils/
│       │   └── types/
│       ├── tailwind.config.js
│       ├── vite.config.ts
│       └── index.html
│
├── packages/
│   ├── shared-types/
│   │   └── src/index.ts
│   ├── shared-constants/
│   └── shared-utils/
│
├── docker/
│   ├── docker-compose.yml
│   └── nginx/
│       └── default.conf
│
├── .env
├── package.json
├── pnpm-workspace.yaml
└── README.md

🔐 1️⃣0️⃣ SECURITY BOUNDARY (WAJIB)
Frontend

❌ Tidak menyimpan secret

❌ Tidak generate OTP

❌ Tidak akses database langsung

Backend

✅ Single source of truth

✅ RBAC & audit log

✅ Rate limiting & OTP TTL

✅ Semua akses data via API

1️⃣1️⃣ OUTPUT YANG HARUS DIHASILKAN KIRO

Kiro WAJIB menghasilkan:

Struktur repo sesuai spesifikasi

Prisma schema lengkap

ERD diagram

Auth & OTP service

RBAC middleware & guard

UI Login & Dashboard

Responsive Tailwind layout

Seed role & permission

Dokumentasi API

Standar Kualitas

Clean Architecture

Secure by default

Production-ready

Mudah dipisah ke multi-repo di masa depan

🚨 CATATAN FINAL

Tidak boleh ada mock authentication

Tidak boleh ada password

Semua akses harus melalui permission matrix

OTP WhatsApp adalah satu-satunya metode login