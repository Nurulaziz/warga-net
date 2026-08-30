# WargaNet - Sistem Manajemen RT

Sistem manajemen RT berbasis web dengan autentikasi OTP WhatsApp, RBAC dinamis, dan desain mobile-first untuk RT.04/010 Perumahan Satriamekar Raya Residence 2, Kelurahan Satriamekar, Kecamatan Tambun Utara, Kabupaten Bekasi, Jawa Barat.

## 🚀 Teknologi

### Backend

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Relational database
- **Redis** - In-memory data store untuk caching dan session
- **JWT** - JSON Web Tokens untuk autentikasi

### Frontend

- **React** - UI library
- **Vite** - Next-generation frontend tooling
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Infrastructure

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy dan static file serving

## 📋 Prerequisites

Pastikan Anda telah menginstall:

- **Node.js** >= 22.12.0
- **pnpm** >= 11.0.0
- **Docker** dan **Docker Compose** (untuk development dengan database)
- **PostgreSQL** >= 14 (jika tidak menggunakan Docker)
- **Redis** >= 6 (jika tidak menggunakan Docker)

### Install pnpm

```bash
npm install -g pnpm
```

## 🛠️ Setup Development

### 1. Clone Repository

```bash
git clone <repository-url>
cd warganet-system
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment Variables

```bash
# Copy .env.example ke .env
cp .env.example .env

# Edit .env dan sesuaikan dengan konfigurasi Anda
```

**Penting:** Generate RSA keys untuk JWT:

```bash
# Buat folder keys
mkdir keys

# Generate private key
openssl genrsa -out keys/private.pem 2048

# Extract public key
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

### 4. Setup Database dengan Docker (Recommended)

```bash
# Start PostgreSQL dan Redis
docker-compose up -d postgres redis

# Tunggu beberapa detik untuk database siap
```

### 5. Setup Prisma

```bash
# Generate Prisma Client
cd apps/backend
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database dengan data default
pnpm prisma db seed
```

### 6. Start Development Servers

```bash
# Kembali ke root directory
cd ../..

# Start semua services (backend + frontend)
pnpm dev
```

Backend akan berjalan di: `http://localhost:3000`
Frontend akan berjalan di: `http://localhost:5173`
API Documentation: `http://localhost:3000/api/docs`

## 📁 Struktur Project

```
warganet-system/
├── apps/
│   ├── backend/              # NestJS Backend API
│   │   ├── src/
│   │   │   ├── main.ts       # Entry point
│   │   │   ├── app.module.ts # Root module
│   │   │   └── ...
│   │   ├── prisma/           # Database schema & migrations
│   │   └── package.json
│   │
│   └── frontend/             # React Frontend
│       ├── src/
│       │   ├── main.tsx      # Entry point
│       │   ├── App.tsx       # Root component
│       │   └── ...
│       └── package.json
│
├── packages/
│   └── shared-types/         # Shared TypeScript types
│       ├── src/
│       │   └── index.ts
│       └── package.json
│
├── .env.example              # Environment variables template
├── pnpm-workspace.yaml       # pnpm workspace configuration
├── package.json              # Root package.json
├── tsconfig.json             # Root TypeScript config
└── README.md                 # This file
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

## 🏗️ Build

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @warganet/backend build
pnpm --filter @warganet/frontend build
```

## 🎨 Code Quality

```bash
# Lint all code
pnpm lint

# Format all code
pnpm format

# Check formatting
pnpm format:check

# Type check
pnpm type-check
```

## 📦 Available Scripts

### Root Level

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all code
- `pnpm format` - Format all code
- `pnpm type-check` - Type check all code

### Backend (`apps/backend`)

- `pnpm dev` - Start backend in watch mode
- `pnpm build` - Build backend
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm prisma studio` - Open Prisma Studio (database GUI)

### Frontend (`apps/frontend`)

- `pnpm dev` - Start frontend dev server
- `pnpm build` - Build frontend for production
- `pnpm preview` - Preview production build

## 🔐 Default Roles

Sistem memiliki 5 role default:

1. **SUPER_ADMIN** - Full access ke semua fitur
2. **ADMIN_RT** - Ketua RT, manage users, families, residents
3. **ADMIN_SEKRETARIS** - Sekretaris RT, manage data warga
4. **ADMIN_BENDAHARA** - Bendahara RT, manage keuangan (future)
5. **WARGA** - Warga biasa, read-only access ke data sendiri

## 🔑 Authentication Flow

1. User memasukkan nomor telepon
2. Sistem validasi nomor telepon (format E.164)
3. Sistem cek apakah nomor terdaftar
4. Sistem generate OTP 6 digit dan kirim via WhatsApp
5. User memasukkan OTP
6. Sistem validasi OTP
7. Sistem generate JWT tokens (access + refresh)
8. User diarahkan ke dashboard sesuai role

## 🛡️ Security Features

- ✅ OTP-based authentication (no passwords)
- ✅ JWT with RS256 signing
- ✅ Rate limiting untuk OTP requests
- ✅ Refresh token rotation
- ✅ Role-Based Access Control (RBAC)
- ✅ Audit logging untuk semua aksi penting
- ✅ Input validation dan sanitization
- ✅ CORS protection
- ✅ Helmet security headers

## 📱 Mobile-First Design

Frontend didesain dengan pendekatan mobile-first:

- Responsive breakpoints (mobile, tablet, desktop)
- Touch-friendly UI (minimum 44x44px touch targets)
- Bottom navigation untuk mobile
- Sidebar navigation untuk desktop
- Optimized untuk koneksi lambat

## 🐳 Docker Deployment

```bash
# Build dan start semua services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 Documentation

Dokumentasi lengkap tersedia di folder **[`docs/`](./docs/README.md)**:

- **[Setup & Getting Started](./docs/setup/README.md)** - Installation dan configuration
- **[Architecture](./docs/architecture/README.md)** - System design dan architecture  
- **[Development Guide](./docs/development/README.md)** - Coding guidelines dan workflows
- **[Specifications](./docs/specs/README.md)** - Requirements, design, dan tasks
- **[API Documentation](http://localhost:3000/api/docs)** - Swagger/OpenAPI (saat running)
- **[Changelog](./CHANGELOG.md)** - Project history dan updates

### Quick Links

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:3000/api/docs
- **Prisma Studio**: `pnpm prisma studio` (port 5555)

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 👥 Team

RT.04/010 Perumahan Satriamekar Raya Residence 2
Kelurahan Satriamekar, Kecamatan Tambun Utara
Kabupaten Bekasi, Jawa Barat

## 🆘 Troubleshooting

### Database Connection Error

```bash
# Pastikan PostgreSQL berjalan
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Connection Error

```bash
# Pastikan Redis berjalan
docker-compose ps

# Restart Redis
docker-compose restart redis
```

### Port Already in Use

```bash
# Backend (port 3000)
lsof -ti:3000 | xargs kill -9

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

### pnpm Install Issues

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules dan reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

## 📞 Support

Untuk pertanyaan atau bantuan, hubungi tim development atau buat issue di repository.
