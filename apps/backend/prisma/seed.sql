-- Seed Roles
INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
  (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrator dengan akses penuh ke semua fitur sistem', NOW(), NOW()),
  (gen_random_uuid(), 'ADMIN_RT', 'Ketua RT dengan akses manajemen users, families, dan residents', NOW(), NOW()),
  (gen_random_uuid(), 'ADMIN_SEKRETARIS', 'Sekretaris RT dengan akses manajemen data warga', NOW(), NOW()),
  (gen_random_uuid(), 'ADMIN_BENDAHARA', 'Bendahara RT dengan akses manajemen keuangan (future)', NOW(), NOW()),
  (gen_random_uuid(), 'WARGA', 'Warga biasa dengan akses read-only ke data sendiri', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Seed Permissions
INSERT INTO permissions (id, feature, action, description, created_at, updated_at) VALUES
  -- Users permissions
  (gen_random_uuid(), 'users', 'create', 'Buat user baru', NOW(), NOW()),
  (gen_random_uuid(), 'users', 'read', 'Lihat data user', NOW(), NOW()),
  (gen_random_uuid(), 'users', 'update', 'Update data user', NOW(), NOW()),
  (gen_random_uuid(), 'users', 'delete', 'Hapus user', NOW(), NOW()),
  -- Roles permissions
  (gen_random_uuid(), 'roles', 'create', 'Buat role baru', NOW(), NOW()),
  (gen_random_uuid(), 'roles', 'read', 'Lihat data role', NOW(), NOW()),
  (gen_random_uuid(), 'roles', 'update', 'Update data role', NOW(), NOW()),
  (gen_random_uuid(), 'roles', 'delete', 'Hapus role', NOW(), NOW()),
  -- Families permissions
  (gen_random_uuid(), 'families', 'create', 'Buat family baru', NOW(), NOW()),
  (gen_random_uuid(), 'families', 'read', 'Lihat data family', NOW(), NOW()),
  (gen_random_uuid(), 'families', 'update', 'Update data family', NOW(), NOW()),
  (gen_random_uuid(), 'families', 'delete', 'Hapus family', NOW(), NOW()),
  -- Residents permissions
  (gen_random_uuid(), 'residents', 'create', 'Buat resident baru', NOW(), NOW()),
  (gen_random_uuid(), 'residents', 'read', 'Lihat data resident', NOW(), NOW()),
  (gen_random_uuid(), 'residents', 'update', 'Update data resident', NOW(), NOW()),
  (gen_random_uuid(), 'residents', 'delete', 'Hapus resident', NOW(), NOW()),
  -- Audit logs permissions
  (gen_random_uuid(), 'audit_logs', 'read', 'Lihat audit logs', NOW(), NOW())
ON CONFLICT (feature, action) DO NOTHING;

-- Seed Role-Permission assignments untuk SUPER_ADMIN
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Seed Role-Permission assignments untuk ADMIN_RT
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN_RT'
  AND (
    (p.feature = 'users' AND p.action IN ('create', 'read', 'update', 'delete'))
    OR (p.feature = 'roles' AND p.action = 'read')
    OR (p.feature = 'families' AND p.action IN ('create', 'read', 'update', 'delete'))
    OR (p.feature = 'residents' AND p.action IN ('create', 'read', 'update', 'delete'))
    OR (p.feature = 'audit_logs' AND p.action = 'read')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Seed Role-Permission assignments untuk ADMIN_SEKRETARIS
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN_SEKRETARIS'
  AND (
    (p.feature = 'users' AND p.action = 'read')
    OR (p.feature = 'roles' AND p.action = 'read')
    OR (p.feature = 'families' AND p.action IN ('create', 'read', 'update'))
    OR (p.feature = 'residents' AND p.action IN ('create', 'read', 'update'))
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Seed Role-Permission assignments untuk ADMIN_BENDAHARA
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN_BENDAHARA'
  AND (
    (p.feature = 'users' AND p.action = 'read')
    OR (p.feature = 'roles' AND p.action = 'read')
    OR (p.feature = 'families' AND p.action = 'read')
    OR (p.feature = 'residents' AND p.action = 'read')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Seed Role-Permission assignments untuk WARGA
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'WARGA'
  AND (
    (p.feature = 'families' AND p.action = 'read')
    OR (p.feature = 'residents' AND p.action = 'read')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Seed Test Families
INSERT INTO families (id, head_of_family, address, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Budi Santoso', 'Jl. Satriamekar Raya Blok A No. 1', NOW(), NOW()),
  (gen_random_uuid(), 'Ahmad Hidayat', 'Jl. Satriamekar Raya Blok B No. 5', NOW(), NOW()),
  (gen_random_uuid(), 'Siti Nurhaliza', 'Jl. Satriamekar Raya Blok C No. 10', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Seed Test Residents
INSERT INTO residents (id, family_id, full_name, id_number, birth_date, gender, relationship, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  f.id,
  'Budi Santoso',
  '3216010101800001',
  '1980-01-01'::date,
  'L',
  'Kepala Keluarga',
  NOW(),
  NOW()
FROM families f WHERE f.head_of_family = 'Budi Santoso'
ON CONFLICT (id_number) DO NOTHING;

INSERT INTO residents (id, family_id, full_name, id_number, birth_date, gender, relationship, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  f.id,
  'Ani Santoso',
  '3216010202850001',
  '1985-02-02'::date,
  'P',
  'Istri',
  NOW(),
  NOW()
FROM families f WHERE f.head_of_family = 'Budi Santoso'
ON CONFLICT (id_number) DO NOTHING;

INSERT INTO residents (id, family_id, full_name, id_number, birth_date, gender, relationship, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  f.id,
  'Ahmad Hidayat',
  '3216010303750001',
  '1975-03-03'::date,
  'L',
  'Kepala Keluarga',
  NOW(),
  NOW()
FROM families f WHERE f.head_of_family = 'Ahmad Hidayat'
ON CONFLICT (id_number) DO NOTHING;

INSERT INTO residents (id, family_id, full_name, id_number, birth_date, gender, relationship, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  f.id,
  'Siti Nurhaliza',
  '3216010404820001',
  '1982-04-04'::date,
  'P',
  'Kepala Keluarga',
  NOW(),
  NOW()
FROM families f WHERE f.head_of_family = 'Siti Nurhaliza'
ON CONFLICT (id_number) DO NOTHING;

-- Seed Test Users
INSERT INTO users (id, phone_number, full_name, role_id, family_id, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  '+628123456789',
  'Super Admin',
  r.id,
  NULL,
  true,
  NOW(),
  NOW()
FROM roles r WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT (phone_number) DO NOTHING;

INSERT INTO users (id, phone_number, full_name, role_id, family_id, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  '+628234567890',
  'Admin RT',
  r.id,
  f.id,
  true,
  NOW(),
  NOW()
FROM roles r, families f 
WHERE r.name = 'ADMIN_RT' AND f.head_of_family = 'Budi Santoso'
ON CONFLICT (phone_number) DO NOTHING;

INSERT INTO users (id, phone_number, full_name, role_id, family_id, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  '+628345678901',
  'Budi Santoso',
  r.id,
  f.id,
  false,
  NOW(),
  NOW()
FROM roles r, families f 
WHERE r.name = 'WARGA' AND f.head_of_family = 'Budi Santoso'
ON CONFLICT (phone_number) DO NOTHING;
