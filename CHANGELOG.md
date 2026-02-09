# Changelog

All notable changes to WargaNet project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Property-based testing dengan fast-check
- Database uniqueness constraint tests
- Comprehensive documentation structure in `docs/` folder
- Redis module dengan connection pooling dan health check
- Session management documentation dengan 30-day refresh token strategy

### Changed
- Reorganized documentation into structured folders
- Updated database setup to use local PostgreSQL instead of Docker
- **BREAKING**: Refresh token expiry extended from 7 days to 30 days for cost efficiency
- Updated all documentation to reflect 30-day refresh token duration

### Completed Tasks
- ✅ Task 3: Setup Redis dan caching layer
  - RedisModule dengan ConfigModule integration
  - RedisService dengan comprehensive methods
  - Connection pooling dan automatic reconnection
  - Error handling untuk connection failures
  - Health check untuk Redis connectivity
  - Unit tests (13 tests) dan integration tests (16 tests)

## [0.2.0] - 2026-02-10

### Added
- Complete Prisma schema with 9 models
- Database migrations (initial migration)
- Seed scripts for roles, permissions, and test data
- Property-based test for database uniqueness constraints
- PostgreSQL and Redis Docker containers
- 5 default roles with permission matrix
- 17 permissions with CRUD actions
- Test users, families, and residents

### Changed
- Updated Jest configuration to include prisma directory
- Configured database to use local PostgreSQL

### Completed Tasks
- ✅ Task 2.1: Konfigurasi PostgreSQL dan Redis
- ✅ Task 2.2: Implementasi Prisma schema lengkap
- ✅ Task 2.3: Buat migration dan seed script
- ✅ Task 2.4: Property test untuk database constraints

## [0.1.0] - 2026-02-09

### Added
- Initial monorepo setup with pnpm workspace
- Backend application with NestJS
- Frontend application with React + Vite + Tailwind CSS
- Shared types package
- TypeScript configuration for all workspaces
- ESLint and Prettier configuration
- Docker Compose for PostgreSQL and Redis
- Environment variables template (.env.example)
- Comprehensive README with setup instructions
- Coding guidelines in steering folder

### Completed Tasks
- ✅ Task 1.1: Inisialisasi pnpm workspace
- ✅ Task 1.2: Setup apps/backend dengan NestJS
- ✅ Task 1.3: Setup apps/frontend dengan React + Vite
- ✅ Task 1.4: Setup packages/shared-types
- ✅ Task 1.5: Konfigurasi TypeScript
- ✅ Task 1.6: Setup ESLint dan Prettier
- ✅ Task 1.7: Buat .env.example
- ✅ Task 1.8: Buat README.md

## Project Information

- **Project Name**: WargaNet
- **Description**: Sistem Manajemen RT Digital dengan OTP WhatsApp Authentication
- **Repository**: [GitHub URL]
- **License**: [License Type]

## Documentation

All documentation has been organized in the `docs/` folder:

- **Setup**: Installation and configuration guides
- **Architecture**: System design and architecture
- **Development**: Coding guidelines and workflows
- **API**: API documentation and contracts
- **Specs**: Requirements, design, and tasks (in `.kiro/specs/`)

For detailed documentation, see [docs/README.md](./docs/README.md).
