# 🚀 Setup & Getting Started

Panduan lengkap untuk setup dan menjalankan project WargaNet.

## Prerequisites

Sebelum memulai, pastikan Anda sudah install:

- **Node.js** v18+ dan **pnpm** v8+
- **PostgreSQL** 15+ (atau gunakan Docker)
- **Redis** 7+ (atau gunakan Docker)
- **Docker** dan **Docker Compose** (optional, untuk containerized setup)

## Setup Steps

### 1. [Monorepo Setup](./01-monorepo-setup.md)

Setup workspace, dependencies, dan konfigurasi dasar:

- Inisialisasi pnpm workspace
- Setup backend (NestJS)
- Setup frontend (React + Vite)
- Setup shared packages
- Konfigurasi TypeScript, ESLint, Prettier

**Status**: ✅ Complete

### 2. [Database Setup](./02-database-setup.md)

Setup PostgreSQL, Prisma ORM, dan seed data:

- Konfigurasi PostgreSQL dan Redis
- Implementasi Prisma schema
- Create migrations
- Seed roles, permissions, dan test data

**Status**: ✅ Complete

### 3. [Testing Setup](./03-testing-setup.md)

Setup testing framework dan property-based testing:

- Install fast-check
- Configure Jest
- Implement property tests untuk database constraints

**Status**: ✅ Complete

## Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd warga-net

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 4. Start database (jika menggunakan Docker)
docker-compose up -d

# 5. Run migrations dan seed
cd apps/backend
pnpm prisma migrate deploy
pnpm prisma db seed

# 6. Start development servers
cd ../..
pnpm dev
```

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Prisma Studio**: `pnpm prisma studio` (port 5555)

## Troubleshooting

Lihat [Troubleshooting Guide](./troubleshooting.md) untuk solusi masalah umum.

## Next Steps

Setelah setup selesai, lanjut ke:

- [Development Guidelines](../development/coding-guidelines.md)
- [API Documentation](../api/README.md)
- [Architecture Overview](../architecture/README.md)
