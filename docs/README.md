# 📚 Dokumentasi WargaNet

Selamat datang di dokumentasi lengkap sistem WargaNet - Sistem Manajemen RT Digital.

## 📂 Struktur Dokumentasi

### 1. [Setup & Getting Started](./setup/README.md)
Panduan instalasi dan konfigurasi awal project.

- [Setup Monorepo](./setup/01-monorepo-setup.md) - Instalasi dan konfigurasi workspace
- [Setup Database](./setup/02-database-setup.md) - PostgreSQL, Prisma, dan seeding
- [Setup Testing](./setup/03-testing-setup.md) - Property-based testing dengan fast-check
- [Setup AWS S3](./setup/04-aws-s3-setup.md) - Konfigurasi AWS S3 bucket, IAM, lifecycle

### 2. [Architecture](./architecture/README.md)
Dokumentasi arsitektur sistem dan design decisions.

- [System Architecture](./architecture/system-architecture.md) - Overview arsitektur monorepo
- [Database Schema](./architecture/database-schema.md) - ERD dan relasi tabel
- [Security Design](./architecture/security-design.md) - Authentication, authorization, dan audit

### 3. [Development](./development/README.md)
Panduan development dan coding standards.

- [Coding Guidelines](./development/coding-guidelines.md) - Standar kode dan best practices
- [Git Workflow](./development/git-workflow.md) - Branching strategy dan commit conventions
- [Testing Strategy](./development/testing-strategy.md) - Unit, integration, dan property-based tests

### 4. [API Documentation](./api/README.md)
Dokumentasi API endpoints dan contracts.

- [Authentication API](./api/authentication.md) - OTP login dan token management
- [Users API](./api/users.md) - User management endpoints
- [Families & Residents API](./api/families-residents.md) - Data kependudukan

### 5. [Deployment](./deployment/README.md)
Panduan deployment dan operations.

- [Docker Deployment](./deployment/docker.md) - Containerization dan orchestration
- [Environment Configuration](./deployment/environment.md) - Environment variables
- [Database Migration](./deployment/migration.md) - Migration strategy

### 6. [Implementation](./implementation/)
Rencana implementasi fitur-fitur utama.

- [AWS S3 Storage](./implementation/aws-s3-storage.md) - Migrasi file storage ke AWS S3
- [Suara Warga](./implementation/suara-warga.md) - Fitur sosial komunitas RT

### 7. [Specifications](./specs/README.md)
Spesifikasi lengkap sistem (dari .kiro/specs).

- [Requirements](./specs/requirements.md) - Functional dan non-functional requirements
- [Design Document](./specs/design.md) - Detailed design dan correctness properties
- [Implementation Tasks](./specs/tasks.md) - Task breakdown dan progress tracking

## 🚀 Quick Links

- **[Project README](../README.md)** - Overview project dan quick start
- **[API Docs (Swagger)](http://localhost:3000/api/docs)** - Interactive API documentation
- **[Prisma Studio](http://localhost:5555)** - Database GUI

## 📝 Changelog

- **2026-02-10**: Setup dokumentasi structure
- **2026-02-09**: Database setup dan property-based testing
- **2026-02-09**: Initial monorepo setup

## 🤝 Contributing

Lihat [Development Guidelines](./development/coding-guidelines.md) untuk panduan kontribusi.

## 📧 Contact

Untuk pertanyaan atau feedback, silakan buka issue di repository.
