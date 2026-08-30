# Suara Warga — Implementation Plan

> **Catatan pengiriman:** Dokumen ini adalah hasil analisis repository WargaNet saat plan mode.
> Lokasi final yang diminta adalah `docs/implementation/suara-warga.md`.
> Karena plan mode menahan penulisan ke path tersebut, konten disimpan sementara di sini
> dan dapat disalin ke `docs/implementation/suara-warga.md` setelah keluar dari plan mode.

## 1. Executive Summary

WargaNet adalah monorepo pnpm (NestJS 10 + Prisma + PostgreSQL 15 + Redis backend, React 19 + Vite 8 + Tailwind 3 + React Router 7 frontend) untuk manajemen RT. Fitur **Suara Warga** menambahkan ruang sosial komunitas: feed posting, like/reaction, komentar balasan, share, save, report, moderasi admin, pin, hashtag, mention, poll.

Pendekatan: membangun modul baru yang **meniru pola Announcement** (modul sosial-serial paling dekat) dengan penambahan entity relasional baru. Memanfaatkan: RBAC existing (`Role`/`Permission`), audit log global, sanitize HTML, offset pagination, session Better Auth, upload statis. Tidak ada sistem notifikasi in-app — direkomendasikan notifikasi via WhatsApp (Fonnte) yang sudah tersedia.

**Estimasi kompleksitas: High** (banyak entity relasional baru + moderasi + media).

## 2. Current Architecture Analysis

- **Stack**: Monorepo pnpm — `apps/backend` (NestJS 10, Prisma 7, class-validator, Swagger, Throttler, AuditLogInterceptor), `apps/frontend` (React 19, Vite 8, Tailwind 3, React Router 7, TipTap, axios), `packages/shared-types`.
- **Auth**: Better Auth via `@thallesp/nestjs-better-auth`, login OTP WhatsApp (Fonnte), cookie session, prefix `/api/v1/auth`. Controllers inject `@Session() userSession`; helper `getSessionPhoneNumber()`.
- **Authorization**: RBAC dinamis — `Role`/`Permission`/`RolePermission` seeded. `resolveAuthContext(phoneNumber)` → `{ userId, roleName, familyId, isAdmin }`. Frontend `useAuth().hasPermission(feature, action)`.
- **User/Warga**: `User` (phoneNumber, fullName, roleId, familyId), `Resident` (data demografi), `Family` (alamat/RT/RW/housingComplex). Scope akses berbasis `familyId`/`rt` via `Family.rt`.
- **DB/ORM**: PostgreSQL + Prisma. Pattern pagination offset `{ data, meta }`. Soft delete via `deletedAt` pada beberapa model.
- **API**: Global prefix `api/v1`; controller/service/DTO per modul; global `ValidationPipe` (whitelist + forbidNonWhitelisted).
- **State mgmt**: Tanpa Redux; custom hooks (`usePaginatedApi`, `useAuth`/AuthContext, `useSettings`).
- **Notification**: Tidak ada push in-app. Hanya WhatsApp (Fonnte) untuk OTP. Dashboard ada `AnnouncementPopup`.
- **Upload**: `multer` disk storage ke `uploads/<feature>/`, diserve di `/uploads/`, 5MB, whitelist extension.
- **UI/Design**: Custom Tailwind `components/ui/*` (Button, Card, Modal, Pagination, Skeleton, Toast, ConfirmDialog, FilterBar, MobileCard, RichTextEditor). Palet `primary` (#0054A6), dark mode, touch-target 44px.
- **Testing**: Backend Jest (incl. fast-check property test `uniqueness-constraints.spec.ts`). Frontend Vitest (`Button.test.tsx`).
- **Migrations**: Prisma migration files di `apps/backend/prisma/migrations/`.

## 3. Existing Components That Can Be Reused

| Item | File/Path | Reuse |
|---|---|---|
| CRUD module pattern | `apps/backend/src/announcements/*` | Template modul Suara Warga |
| RBAC | `prisma/seed.ts`, `users.service.ts` resolveAuthContext | Authorization |
| HTML sanitize | `apps/backend/src/common/sanitize.ts` | XSS pada konten post/comment |
| Audit log | global `AuditLogInterceptor` | Otomatis utk posts.* actions |
| Upload | Announcement `FileInterceptor` pattern | Upload image post |
| Rate limit | global `ThrottlerGuard` (short/medium) | Post/comment/like/report |
| Pagination | `usePaginatedApi` + `usePaginatedApi` meta pattern | Feed list |
| UI kit | `components/ui/*` (Card, Modal, Button, Skeleton, ConfirmDialog, Toast, Pagination) | Seluruh UI |
| Auth context | `useAuth()` (hasPermission, isAdmin) | Guarding UI |
| Rich content | `RichTextEditor` (TipTap) | Post composer (opsional) |
| Role-permission frontend | `ProtectedRoute requirePermission` | Route guard |

## 4. Functional Requirements

- **FR-1 Feed**: terbaru, populer, pinned, scope RT.
- **FR-2 Create post**: text / image / poll.
- **FR-3 Like/Unlike** + reaction count.
- **FR-4 Comment, reply** (1 level), edit/delete.
- **FR-5 Share** internal + copy link.
- **FR-6 Save post** + saved list.
- **FR-7 Report** post/comment.
- **FR-8 Admin moderation** (hide/unhide/delete/pin/lock).
- **FR-9 Profile posting** (pagination).
- **FR-10 Trending** (score sederhana).
- **FR-11 Hashtag + mention + search** hashtag.
- **FR-12 Notifikasi** (like/comment/reply/mention).

## 5. Non-Functional Requirements

- Mobile-first responsive, cepat, aksesibel, dark mode konsisten.
- Loading/empty/error/skeleton states.
- Auth wajib semua endpoint. Authorization diverifikasi backend.
- Anti-XSS, anti-spam (rate limit), upload aman.
- N+1 dihindari (eager load).
- Query feed diindeks.

## 6. User Roles & Permissions

Gunakan RBAC existing. Tambah permission `posts:create/read/update/delete/pin/moderate`, `comments:create/delete`, dsb. Mapping pada seed `ROLE_PERMISSIONS`:

- **SUPER_ADMIN / ADMIN_RT**: semua + pin + moderate + report resolve.
- **ADMIN_SEKRETARIS**: moderate (read/resolve report), delete comment.
- **ADMIN_BENDAHARA**: read only.
- **WARGA**: create/read post, like, comment, report.

Backend cek ownership + `resolveAuthContext().isAdmin`.

## 7. User Flow

```
Login → Suara Warga (feed) → Create post → muncul di feed
  → warga lain like/comment/reply/share/save
  → mention/hashtag → notifikasi
  → report konten → admin moderasi → hide/delete/pin
```

## 8. UX/UI Plan

Sesuai struktur §28–31 (prompt): FeedHeader, PostComposer, FeedFilter, PinnedPosts, PostCard (header/content/media/poll/actions), CommentList, CommentComposer, ReportDialog, ShareDialog, LoadingState. Default tab "Terbaru", optional "Sedang Ramai". Empty state dan composer mobile-first menggunakan pattern `MobileCard`/`ResponsiveDataView`.

## 9. Database Design

Tambah model berikut ke `schema.prisma` (semua PK uuid, `createdAt`/`updatedAt`, soft-delete opsional). **Skema dimodelkan meniru Announcement + relasional.**

```prisma
model Post {
  id              String    @id @default(uuid())
  authorId        String    @map("author_id")            // FK -> User
  type            String    @default("TEXT")             // TEXT|IMAGE|POLL|ANNOUNCEMENT
  content         String?                                // teks utama (sanitized)
  visibility      String    @default("RT")               // RT (MVP) | RW | PERUMAHAN | PUBLIC (future)
  status          String    @default("published")        // published|hidden|deleted
  isPinned        Boolean   @default(false) @map("is_pinned")
  pinnedAt        DateTime? @map("pinned_at")
  pinOrder        Int       @default(0) @map("pin_order")
  commentsLocked  Boolean   @default(false) @map("comments_locked")
  likeCount       Int       @default(0) @map("like_count")       // denormalized
  commentCount    Int       @default(0) @map("comment_count")
  shareCount      Int       @default(0) @map("share_count")
  viewCount       Int       @default(0) @map("view_count")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  author          User          @relation(fields: [authorId], references: [id])
  media           PostMedia[]
  reactions       PostReaction[]
  comments        Comment[]
  shares          PostShare[]
  savedBy         SavedPost[]
  hashtags        PostHashtag[]
  mentions        Mention[]
  reports         Report[]
  pin             PostPin?

  @@map("posts")
  @@index([visibility, status, createdAt])
  @@index([status, isPinned, pinOrder])
  @@index([authorId])
}

model PostMedia {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")   // FK -> Post
  url       String
  mediaType String   @default("IMAGE") // IMAGE|VIDEO
  width     Int?
  height    Int?
  size      Int?
  order     Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@map("post_media")
  @@index([postId])
}

model PostReaction {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")   // FK
  userId    String   @map("user_id")   // FK
  type      String   @default("LIKE")  // LIKE|LOVE|HAHA|SAD|ANGRY (future)
  createdAt DateTime @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@map("post_reactions")
  @@index([postId])
  @@index([userId])
}

model Comment {
  id        String    @id @default(uuid())
  postId    String    @map("post_id")     // FK
  authorId  String    @map("author_id")   // FK
  parentId  String?   @map("parent_id")   // FK -> Comment (reply, max depth 1)
  content   String                        // sanitized
  status    String    @default("visible") // visible|hidden|deleted
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  post    Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  author  User      @relation(fields: [authorId], references: [id])
  parent  Comment?  @relation("commentReplies", fields: [parentId], references: [id])
  replies Comment[] @relation("commentReplies")

  @@map("comments")
  @@index([postId, createdAt])
  @@index([parentId])
  @@index([authorId])
}

model PostShare {
  id          String   @id @default(uuid())
  postId      String   @map("post_id")     // FK
  sharedById  String   @map("shared_by_id") // FK
  createdAt   DateTime @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([postId, sharedById])
  @@map("post_shares")
  @@index([postId])
}

model SavedPost {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")   // FK
  userId    String   @map("user_id")   // FK
  createdAt DateTime @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@map("saved_posts")
  @@index([userId])
}

model Hashtag {
  id         String   @id @default(uuid())
  name       String   @unique // normalized lowercase
  usageCount Int      @default(0)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  posts PostHashtag[]

  @@map("hashtags")
  @@index([name])
}

model PostHashtag {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  hashtagId String   @map("hashtag_id")

  post    Post    @relation(fields: [postId], references: [id], onDelete: Cascade)
  hashtag Hashtag @relation(fields: [hashtagId], references: [id], onDelete: Cascade)

  @@unique([postId, hashtagId])
  @@map("post_hashtags")
  @@index([hashtagId])
}

model Mention {
  id              String   @id @default(uuid())
  postId          String?  @map("post_id")        // salah satu required
  commentId       String?  @map("comment_id")
  mentionedUserId String   @map("mentioned_user_id")
  createdAt       DateTime @default(now()) @map("created_at")

  mentionedUser User @relation("mentions", fields: [mentionedUserId], references: [id])

  @@map("mentions")
  @@index([mentionedUserId])
}

model Report {
  id           String    @id @default(uuid())
  reporterId   String    @map("reporter_id")
  targetType   String    @map("target_type")  // POST|COMMENT
  targetId     String    @map("target_id")
  reason       String    // SPAM|HARASSMENT|INAPPROPRIATE|MISINFORMATION|FRAUD|OTHER
  description  String?
  status       String    @default("PENDING")  // PENDING|REVIEWING|RESOLVED|DISMISSED
  resolvedById String?   @map("resolved_by_id")
  resolvedAt   DateTime? @map("resolved_at")
  createdAt    DateTime  @default(now()) @map("created_at")

  @@map("reports")
  @@index([status, createdAt])
  @@index([targetType, targetId])
}

model PostPin {
  id        String   @id @default(uuid())
  postId    String   @unique @map("post_id")  // FK
  pinnedBy  String   @map("pinned_by")
  createdAt DateTime @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@map("post_pins")
  @@index([postId])
}
```

> Catatan DB: announcements memakai `createdBy` non-FK. Untuk Suara Warga, relasi yang butuh anti-N+1 dan ownership check memakai **FK sungguhan** (`authorId`, `userId`, dst). Counter **denormalized** (rekomendasi §33). Visibility default `RT` sesuai MVP.

## 10. API Design

Prefix `api/v1`. Semua endpoint butuh session (`@Session()`). List mengembalikan `{ data, meta }`. Gunakan **class-validator DTO** (pattern families), bukan inline interface (karena lebih kompleks dari announcements).

| Method | URL | Auth | Role | Deskripsi |
|---|---|---|---|---|
| GET | `/posts` | ✓ | semua | Feed list (`sort=latest|trending`, `filter=pinned`, pagination) |
| POST | `/posts` | ✓ | semua aktif | Create post (`type`, `content`, `mediaIds`, `poll`, `hashtags`, `mentions`) |
| GET | `/posts/:id` | ✓ | akses RT | Detail post + author + counts + saved/reaction state |
| PATCH | `/posts/:id` | ✓ | owner/admin | Edit post |
| DELETE | `/posts/:id` | ✓ | owner/admin | Delete post |
| POST | `/posts/:id/reactions` | ✓ | semua | Like/reaction (upsert, unique) |
| DELETE | `/posts/:id/reactions` | ✓ | pemilik reaction | Unlike |
| GET | `/posts/:id/comments` | ✓ | akses RT | Comments (+ replies 1 level) |
| POST | `/posts/:id/comments` | ✓ | semua | Create comment (`content`, `parentId?`, `mentions`) |
| PATCH | `/comments/:id` | ✓ | owner | Edit comment |
| DELETE | `/comments/:id` | ✓ | owner/admin | Delete comment |
| POST | `/posts/:id/share` | ✓ | semua | Share internal (or `external` w/ link) |
| POST | `/posts/:id/save` | ✓ | semua | Save (upsert) |
| DELETE | `/posts/:id/save` | ✓ | semua | Unsave |
| GET | `/posts/saved` | ✓ | semua | Saved posts list |
| POST | `/posts/:id/report` | ✓ | semua | Report post |
| POST | `/comments/:id/report` | ✓ | semua | Report comment |
| POST | `/posts/:id/pin` | ✓ | admin (pin perm) | Pin post |
| DELETE | `/posts/:id/pin` | ✓ | admin | Unpin |
| POST | `/posts/:id/lock` | ✓ | admin | Lock comments |
| DELETE | `/posts/:id/lock` | ✓ | admin | Unlock |
| GET | `/reports` | ✓ | admin (moderate) | List reports (pending) |
| PATCH | `/reports/:id/resolve` | ✓ | admin | Resolve/dismiss |
| GET | `/posts/hashtags/:tag` | ✓ | akses RT | Posts by hashtag |
| GET | `/mentions/autocomplete?q=` | ✓ | semua | Warga autocomplete (scope RT) |
| POST | `/posts/media` | ✓ | semua | Upload image (multer) |
| GET | `/users/:id/posts` | ✓ | akses | Profile posts (pagination) |

Error umum: `400` validation, `401` unauthenticated, `403` unauthorized/ownership, `404` not found, `429` rate limit. Pesan error memakai Bahasa Indonesia.

## 11. Frontend Architecture

Route `/suara-warga`. Path: `apps/frontend/src/routes/SuaraWargaPage.tsx` (halaman), `apps/frontend/src/components/posts/*` (komponen), `apps/frontend/src/services/posts.ts`, `apps/frontend/src/types/posts.ts`.

```
SuaraWargaPage
├── FeedHeader
├── PostComposer (Foto/Polling/#Tag toolbar)
├── FeedFilter (Terbaru | Sedang Ramai)
├── PinnedPosts
├── PostCardList (usePaginatedApi '/posts')
│   └── PostCard
│       ├── PostHeader (avatar, nama, waktu, menu ⋮)
│       ├── PostContent (sanitized → render aman)
│       ├── PostMedia (lazy-load img)
│       ├── PostPoll
│       ├── PostActions (Like/Comment/Share/Save)
│       └── CommentPreview
├── CommentList + CommentComposer
├── ReportDialog, ShareDialog, PinControl
└── LoadingState / EmptyState / ErrorState
```

Juga: `SavedPostsPage`, `PostDetailPage`, `ProfilePostsSection`, `ModerationQueuePage` (admin). Tambah item navigasi di `DesktopNavigation` (section KOMUNIKASI) & `MobileNavigation`.

## 12. Backend Architecture

Module baru `apps/backend/src/suara-warga/` (satu modul dengan sub-service), didaftarkan di `app.module.ts`. Impor `UsersModule` untuk `resolveAuthContext`. Batasi permission di service (ownership ± admin) — ditulis manual karena tak ada `RolesGuard` global.

```
apps/backend/src/suara-warga/
├── suara-warga.module.ts
├── posts/
│   ├── posts.controller.ts
│   ├── posts.service.ts
│   ├── dto/{create-post,update-post,query-post,reaction,share}.dto.ts
│   └── media.controller.ts
├── comments/
│   ├── comments.controller.ts
│   ├── comments.service.ts
│   └── dto/
├── reports/
│   ├── reports.controller.ts
│   └── reports.service.ts
├── hashtags/
│   └── hashtags.service.ts
├── mentions/
│   └── mentions.service.ts
└── common/ (media config, permission helper)
```

## 13. Security

- **Auth**: semua endpoint wajib session Better Auth (`getSessionPhoneNumber`).
- **Authorization**: `resolveAuthContext().isAdmin` + ownership check (`authorId === userId`). Post visibility `RT` — filter berdasarkan `Family.rt`/community.
- **Input sanitization**: `sanitizeHtml()` pada `content` post dan comment (util existing `common/sanitize.ts`).
- **XSS**: render konten harus disanitize; jangan `dangerouslySetInnerHTML` tanpa sanitasi backend.
- **Upload**: whitelist MIME + extension + 5MB + dimensi; jangan percaya client filename (pakai random suffix seperti announcements).
- **Rate limit**: gunakan `ThrottlerGuard` global + `@Throttle` per-endpoint:
  - Create post: 10/menit; Create comment: 20/menit; Like: 60/menit; Report: 5/menit; Upload: 10/menit.

## 14. Moderation

Pipeline MVP: `User Post → Validation → published` (status `published`/`hidden`). Future: tambah moderation engine hook sebelum publish (interface `ModerationEngine`). Admin actions via permission `posts:moderate` + `comments:delete`. Hidden post tidak muncul di feed (query `status`). Report lifecycle `PENDING → REVIEWING → RESOLVED/DISMISSED`, catat `resolvedById`/`resolvedAt`. Audit via interceptor otomatis.

## 15. Notification

Tidak ada sistem notifikasi in-app existing → **rekomendasi: gunakan WhatsApp (Fonnte)** yang sudah ada di `whatsapp/fonnte.sender.ts` untuk trigger:
- Like / comment / reply / mention → kirim pesan WhatsApp ke pemilik konten.
- Poll post: notifikasi saat user disebut.

Dependency pada modul `whatsapp` (reuse). Tidak membuat sistem notifikasi baru. (Opsional fase lanjut: tabel `Notification` jika ingin in-app.)

## 16. Performance

- Eager load author + counts + media dgn `include` Prisma (hapus N+1).
- Counter **denormalized** (`like_count`, `comment_count`, `share_count`) di-increment dalam transaction, dengan `@@unique` guard mencegah duplikat.
- Feed query diindeks (`visibility, status, createdAt`; `status, isPinned, pinOrder`).
- Image lazy loading (`loading="lazy"`), dimuat via `/uploads` static.
- **Pagination**: WargaNet existing memakai offset. **MVP gunakan offset** (`createdAt desc` + id tiebreaker) konsisten dengan existing; sediakan hook untuk migrasi cursor pada feed di fase lanjut.
- Caching opsional via Redis (module `redis` tersedia) untuk feed populer.

## 17. Testing Strategy

- **Unit (Jest)**: validasi DTO post/comment, permission/ownership service, reaction unique, mention parse, hashtag normalisasi, report status.
- **Integration (Jest + supertest)**: create post, feed scope, like/unlike counter, comment+reply, share unique, save unique, report, admin pin/lock/hide/delete, ownership check.
- **Property (fast-check)**: unique constraint relasional (mirip `uniqueness-constraints.spec.ts`) untuk post_reaction, saved_post, share.
- **E2E flow**: login → buka Suara Warga → create post → muncul di feed → user kedua like/comment → owner terima notifikasi.

## 18. Migration Plan

- 1 migration baru: `2026xxxx_add_suara_warga` menambah semua tabel Suara Warga (non-destructive, add-only).
- Update `schema.prisma` → `prisma generate` → `prisma migrate deploy` (alur sama dgn existing).
- Seed: tambah permission `posts:*` ke `DEFAULT_PERMISSIONS` + `ROLE_PERMISSIONS` (upsert idempotent).
- Backward compatible: tabel baru terpisah; tidak mengubah tabel existing.
- Rollback: `prisma migrate resolve` / drop tabel baru; aman karena tak ada relasi ke tabel lama yang diubah.

## 19. File Change Plan

**Create (backend)**
```
apps/backend/prisma/migrations/<timestamp>_add_suara_warga/migration.sql
apps/backend/src/suara-warga/suara-warga.module.ts
apps/backend/src/suara-warga/posts/posts.controller.ts
apps/backend/src/suara-warga/posts/posts.service.ts
apps/backend/src/suara-warga/posts/media.controller.ts
apps/backend/src/suara-warga/posts/dto/create-post.dto.ts
apps/backend/src/suara-warga/posts/dto/update-post.dto.ts
apps/backend/src/suara-warga/posts/dto/query-post.dto.ts
apps/backend/src/suara-warga/posts/dto/reaction.dto.ts
apps/backend/src/suara-warga/comments/comments.controller.ts
apps/backend/src/suara-warga/comments/comments.service.ts
apps/backend/src/suara-warga/comments/dto/create-comment.dto.ts
apps/backend/src/suara-warga/reports/reports.controller.ts
apps/backend/src/suara-warga/reports/reports.service.ts
apps/backend/src/suara-warga/reports/dto/query-report.dto.ts
apps/backend/src/suara-warga/hashtags/hashtags.service.ts
apps/backend/src/suara-warga/mentions/mentions.service.ts
apps/backend/src/suara-warga/common/permission.helper.ts
apps/backend/src/suara-warga/common/media.config.ts
```

**Create (frontend)**
```
apps/frontend/src/routes/SuaraWargaPage.tsx
apps/frontend/src/routes/SavedPostsPage.tsx
apps/frontend/src/routes/PostDetailPage.tsx
apps/frontend/src/routes/ModerationQueuePage.tsx
apps/frontend/src/components/posts/PostCard.tsx
apps/frontend/src/components/posts/PostComposer.tsx
apps/frontend/src/components/posts/PostActions.tsx
apps/frontend/src/components/posts/PostMedia.tsx
apps/frontend/src/components/posts/PostPoll.tsx
apps/frontend/src/components/posts/CommentList.tsx
apps/frontend/src/components/posts/CommentComposer.tsx
apps/frontend/src/components/posts/ReportDialog.tsx
apps/frontend/src/components/posts/ShareDialog.tsx
apps/frontend/src/components/posts/EmptyState.tsx
apps/frontend/src/services/posts.ts
apps/frontend/src/types/posts.ts
```

**Create (test)**
```
apps/backend/src/suara-warga/**/*.spec.ts
apps/backend/test/**/*.integration-spec.ts
apps/frontend/src/test/**/*.test.tsx
```

**Modify**
```
apps/backend/prisma/schema.prisma
apps/backend/prisma/seed.ts
apps/backend/src/app.module.ts            (register SuaraWargaModule)
apps/frontend/src/routes/index.tsx        (tambah route /suara-warga, saved, moderation)
apps/frontend/src/components/layout/DesktopNavigation.tsx  (section KOMUNIKASI)
apps/frontend/src/components/layout/MobileNavigation.tsx
apps/frontend/src/routes/ProfilePage.tsx  (tab Postingan / Saved)
packages/shared-types/src/index.ts        (tambah Post/Comment/Report types)
```

## 20. Implementation Phases

**Phase 1 — Foundation**: schema + migration + seed permissions; `posts` CRUD; authz; feed list + pagination; route + navigation + PostCard list + empty state.

**Phase 2 — Social**: like/unlike, comment+reply+edit+delete, share, save (+SavedPostsPage).

**Phase 3 — Media & Discovery**: image upload, hashtag, mention+autocomplete, search hashtag.

**Phase 4 — Moderation**: report + moderation queue + pin + lock comments.

**Phase 5 — Notification**: WhatsApp trigger (like/comment/reply/mention).

**Phase 6 — Advanced**: trending formula, poll post, analytics, advanced moderation hook.

## 21. Acceptance Criteria

- **Create post**: authed & aktif dapat create; text tak boleh kosong; muncul di feed; hanya terlihat akses RT; owner dapat delete.
- **Reaction**: dapat like; sekali per user (unique); dapat unlike; counter akurat (transaction).
- **Comment**: create/reply; owner delete; admin moderasi; count akurat.
- **Moderation**: admin lihat report; admin delete/hide post; post terhapus tak muncul di feed; aksi tercatat di audit log.
- **Security**: non-owner tak bisa edit/delete; warga tak bisa pin; pos hidden tak keluar feed; sanitize aktif.

## 22. Risk Analysis

| Risk | Impact | Prob | Mitigation |
|---|---|---|---|
| Spam/abuse | Medium | High | Rate limit + report + permission |
| Toxic comments | Medium | High | Report + lock comments + admin delete |
| Privacy (post leak cross-RT) | High | Medium | Visibility scope filter wajib server-side |
| Query performance / N+1 | High | Medium | eager load + denorm counters + index |
| Storage growth (upload) | Medium | High | 5MB limit + media pruning policy |
| Notification overload | Low | Medium | batasi / toggle notifikasi |
| Unauthorized access | High | Low | ownership + admin checks backend |
| Race condition (like/pin) | Medium | Medium | transaction + unique constraint |
| Data consistency counters | Medium | Medium | increment dalam transaction yang sama |

## 23. Dependency Analysis

| Dependency | Existing? | Reuse? | Action |
|---|---|---|---|
| Authentication | Ya | Ya | Session Better Auth |
| User/Warga | Ya | Ya | User/Resident/Family |
| Community/RT | Ya (`Family.rt`) | Ya | Scope via Family |
| Role & Permission | Ya | Ya | Seed `posts:*` perms |
| Notification | Tidak (hanya WhatsApp OTP) | Reuse Fonnte | Tambah trigger WhatsApp |
| Storage | Ya (multer static) | Ya | Reuse uploads pattern |
| Polling | Tidak | — | Buat entity Poll |
| Search | Tidak (hanya LIKE) | ILIKE cukup | MVP hashtag pakai ILIKE |
| Audit log | Ya | Ya | Gratis via interceptor |

## 24. MVP Scope

**WAJIB**: 1. Feed, 2. Create text post, 3. Image post, 4. Like, 5. Comment, 6. Reply, 7. Delete own post, 8. Report, 9. Admin moderation, 10. Pin post.

## 25. Future Enhancement

Hashtag, Mention, Save, Share, Notification (Phase 2); Poll, Trending, Search, Advanced moderation, Analytics (Phase 3); visibility RW/PERUMAHAN/PUBLIC; multi-reaction types; cursor pagination; tabel notifikasi in-app.

## 26. Final Recommendation

Mulai dari **Phase 1 (Foundation)** memanfaatkan pola Announcement eksisting untuk kecepatan, lalu Phase 2 social interaction. Konten teks di-render dengan sanitasi; counter denormalized; permission via RBAC existing; notifikasi via WhatsApp yang sudah terpasang, alih-alih membangun sistem baru.

---

## Summary

**MVP:**
- Feed + pagination (offset, reuse `usePaginatedApi`)
- Create text & image post (multer, 5MB, whitelist)
- Like/Unlike (unique constraint + denorm counter)
- Comment + Reply (1 level) + edit/delete own
- Delete own post
- Report + Admin moderation queue (hide/delete/pin/lock)
- RBAC posts:* + audit log otomatis

**Estimated complexity:** High

**Main dependencies:**
- RBAC existing (`Role`/`Permission`/`resolveAuthContext`)
- Session Better Auth (`@Session`)
- `sanitizeHtml`, global `AuditLogInterceptor`, `ThrottlerGuard`
- Statis upload (multer) + WhatsApp (Fonnte) untuk notifikasi
- `usePaginatedApi` + UI kit untuk frontend

**Main risks:**
- Kebocoran privacy lintas-RT (perlu scope filter server-side ketat)
- N+1 / kinerja feed (eager load + index + denorm counter)
- Spam & toxic content (rate limit + report + lock comments)
- Konsistensi counter (transaction + unique constraint)

**Recommended implementation order:**
1. Schema + migration + seed permissions, lalu `posts` CRUD + feed (Phase 1)
2. Like/comment/reply/share/save (Phase 2)
3. Upload image + hashtag + mention + search (Phase 3)
4. Report + moderation + pin + lock (Phase 4)
5. WhatsApp notification (Phase 5)
6. Poll + trending + analytics (Phase 6)
