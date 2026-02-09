# 💻 Development Guide

Panduan development untuk kontributor WargaNet.

## 📚 Contents

- [Coding Guidelines](./coding-guidelines.md) - Standar kode dan best practices
- [Testing Strategy](./testing-strategy.md) - Unit, integration, dan property-based tests
- [Git Workflow](./git-workflow.md) - Branching strategy dan commit conventions

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- pnpm v8+
- PostgreSQL 15+
- Redis 7+
- Git

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd warga-net

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env

# Start database
docker-compose up -d

# Run migrations
cd apps/backend
pnpm prisma migrate deploy
pnpm prisma db seed

# Start development servers
cd ../..
pnpm dev
```

## 📝 Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feat/feature-name
```

### 2. Make Changes

Follow [Coding Guidelines](./coding-guidelines.md) untuk konsistensi kode.

### 3. Write Tests

- Unit tests untuk business logic
- Integration tests untuk API endpoints
- Property-based tests untuk critical properties

### 4. Run Quality Checks

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Formatting
pnpm format

# Tests
pnpm test
```

### 5. Commit Changes

Follow [Git Workflow](./git-workflow.md) untuk commit conventions.

```bash
git add .
git commit -m "feat(auth): implement OTP authentication"
```

### 6. Push and Create PR

```bash
git push origin feat/feature-name
```

## 🧪 Testing

### Run Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# Specific file
pnpm test auth.service.spec.ts
```

### Property-Based Tests

```bash
# Run PBT tests
pnpm test uniqueness-constraints.spec.ts
```

## 🔍 Code Quality

### Linting

```bash
# Check
pnpm lint

# Fix
pnpm lint:fix
```

### Formatting

```bash
# Check
pnpm format:check

# Fix
pnpm format
```

### Type Checking

```bash
pnpm type-check
```

## 🐛 Debugging

### Backend

```bash
# Debug mode
cd apps/backend
pnpm dev:debug
```

### Frontend

```bash
# Debug mode
cd apps/frontend
pnpm dev
```

### Database

```bash
# Prisma Studio
cd apps/backend
pnpm prisma studio

# Direct access
docker exec -it warganet-postgres psql -U postgres -d warganet_db
```

## 📦 Building

### Development Build

```bash
pnpm build
```

### Production Build

```bash
pnpm build:prod
```

## 🔧 Useful Commands

```bash
# Install dependency
pnpm add <package> --filter @warganet/backend

# Remove dependency
pnpm remove <package> --filter @warganet/backend

# Update dependencies
pnpm update

# Clean install
pnpm clean:install
```

## 📖 Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [fast-check Documentation](https://fast-check.dev/)

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Write tests
5. Submit PR

## 📧 Support

Untuk pertanyaan atau bantuan, buka issue di repository.
