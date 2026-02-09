# 🏗️ Architecture

Dokumentasi arsitektur sistem WargaNet.

## 📚 Contents

- [System Architecture](./system-architecture.md) - Overview arsitektur monorepo
- [Database Schema](./database-schema.md) - ERD dan relasi tabel
- [Security Design](./security-design.md) - Authentication, authorization, dan audit

## 🎯 Architecture Principles

### 1. Monorepo Structure

WargaNet menggunakan **monorepo** dengan workspace terpisah:

```
warga-net/
├── apps/
│   ├── backend/     # NestJS API
│   └── frontend/    # React SPA
└── packages/
    └── shared-types/ # Shared TypeScript types
```

**Benefits:**
- Code sharing via shared packages
- Consistent tooling dan dependencies
- Atomic commits across frontend/backend
- Easier refactoring

### 2. Separation of Concerns

- **Backend**: Single source of truth, business logic, data access
- **Frontend**: Presentation layer, UI/UX, client-side routing
- **Shared**: Type definitions, constants, utilities

### 3. Security by Default

- No authentication logic in frontend
- All data access via authenticated API
- RBAC enforced at backend
- Audit logging for all critical operations

### 4. Mobile-First Design

- Responsive UI dengan Tailwind CSS
- Touch-friendly interfaces
- Progressive enhancement
- Optimized for low-bandwidth

## 🔧 Technology Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: NestJS (Express)
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Authentication**: JWT (RS256)
- **Validation**: class-validator
- **Testing**: Jest + fast-check

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State**: React Context
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library

### Infrastructure

- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2 (production)

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React SPA (Vite + TypeScript + Tailwind CSS)        │   │
│  │  - Mobile-first responsive UI                        │   │
│  │  - Permission-based UI guards                        │   │
│  │  - JWT token management                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                         HTTPS/REST API
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Nginx Reverse Proxy                     │
│  - SSL/TLS termination                                       │
│  - Static file serving                                       │
│  - Request routing                                           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Backend Layer (NestJS)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Layer (Controllers + DTOs)                      │   │
│  │  ├─ Auth Module (OTP, JWT)                           │   │
│  │  ├─ Users Module                                     │   │
│  │  ├─ Roles & Permissions Module                       │   │
│  │  ├─ Families & Residents Module                      │   │
│  │  └─ Audit Log Module                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Business Logic Layer (Services)                     │   │
│  │  - OTP generation & validation                       │   │
│  │  - Permission checking                               │   │
│  │  - Data validation & transformation                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Security Layer (Guards + Interceptors)              │   │
│  │  - JWT authentication guard                          │   │
│  │  - Permission guard (RBAC)                           │   │
│  │  - Rate limiting                                     │   │
│  │  - Audit logging interceptor                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
┌───────────────────▼─────┐   ┌─────────▼──────────────┐
│   PostgreSQL Database    │   │   Redis Cache          │
│   - User data            │   │   - OTP tokens         │
│   - Roles & permissions  │   │   - Refresh tokens     │
│   - Families & residents │   │   - Rate limit data    │
│   - Audit logs           │   │   - Session data       │
└──────────────────────────┘   └────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  WhatsApp Business API / Gateway                     │   │
│  │  - OTP delivery                                      │   │
│  │  - Notifications                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Security Architecture

### Authentication Flow

1. User submits phone number
2. Backend validates phone is registered
3. Generate 6-digit OTP
4. Hash OTP with bcrypt
5. Store in Redis (TTL 5 minutes)
6. Send OTP via WhatsApp
7. User submits OTP
8. Backend verifies OTP
9. Generate JWT tokens (access + refresh)
10. Return tokens to client

### Authorization Flow

1. Client includes JWT in Authorization header
2. JwtAuthGuard validates token
3. PermissionsGuard checks required permission
4. Request proceeds if authorized
5. All actions logged to audit log

## 📈 Scalability Considerations

### Current Architecture

- Monolithic backend (single NestJS app)
- Stateless API (JWT-based)
- Redis for caching and sessions
- PostgreSQL for persistent data

### Future Scaling Options

- Horizontal scaling: Multiple backend instances behind load balancer
- Database replication: Read replicas for queries
- Microservices: Split modules into separate services
- Message queue: Async processing for heavy operations

## 🔗 Related Documentation

- [Database Schema](./database-schema.md) - Detailed database design
- [Security Design](./security-design.md) - Security implementation
- [Design Document](../../.kiro/specs/warganet-system/design.md) - Complete technical design
