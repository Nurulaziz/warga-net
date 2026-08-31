import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Data roles default
const DEFAULT_ROLES = [
  {
    name: 'SUPER_ADMIN',
    description: 'Super Administrator dengan akses penuh ke semua fitur sistem',
  },
  {
    name: 'ADMIN_RT',
    description: 'Ketua RT dengan akses manajemen users, families, dan residents',
  },
  {
    name: 'ADMIN_SEKRETARIS',
    description: 'Sekretaris RT dengan akses manajemen data warga',
  },
  {
    name: 'ADMIN_BENDAHARA',
    description: 'Bendahara RT dengan akses manajemen keuangan (future)',
  },
  {
    name: 'WARGA',
    description: 'Warga biasa dengan akses read-only ke data sendiri',
  },
];

// Data permissions default
const DEFAULT_PERMISSIONS = [
  // Users permissions
  { feature: 'users', action: 'create', description: 'Buat user baru' },
  { feature: 'users', action: 'read', description: 'Lihat data user' },
  { feature: 'users', action: 'update', description: 'Update data user' },
  { feature: 'users', action: 'delete', description: 'Hapus user' },

  // Roles permissions
  { feature: 'roles', action: 'create', description: 'Buat role baru' },
  { feature: 'roles', action: 'read', description: 'Lihat data role' },
  { feature: 'roles', action: 'update', description: 'Update data role' },
  { feature: 'roles', action: 'delete', description: 'Hapus role' },

  // Families permissions
  { feature: 'families', action: 'create', description: 'Buat family baru' },
  { feature: 'families', action: 'read', description: 'Lihat data family' },
  { feature: 'families', action: 'update', description: 'Update data family' },
  { feature: 'families', action: 'delete', description: 'Hapus family' },

  // Residents permissions
  { feature: 'residents', action: 'create', description: 'Buat resident baru' },
  { feature: 'residents', action: 'read', description: 'Lihat data resident' },
  { feature: 'residents', action: 'update', description: 'Update data resident' },
  { feature: 'residents', action: 'delete', description: 'Hapus resident' },

  // Audit logs permissions
  { feature: 'audit_logs', action: 'read', description: 'Lihat audit logs' },

  // Bills (iuran) permissions
  { feature: 'bills', action: 'create', description: 'Buat/generate tagihan iuran' },
  { feature: 'bills', action: 'read', description: 'Lihat data iuran' },
  { feature: 'bills', action: 'update', description: 'Update/catat pembayaran iuran' },
  { feature: 'bills', action: 'delete', description: 'Hapus data iuran' },

  // Cash (kas RT) permissions
  { feature: 'cash', action: 'create', description: 'Buat transaksi kas' },
  { feature: 'cash', action: 'read', description: 'Lihat data kas RT' },
  { feature: 'cash', action: 'update', description: 'Update transaksi kas' },
  { feature: 'cash', action: 'delete', description: 'Hapus transaksi kas' },

  // Announcements (pengumuman) permissions
  { feature: 'announcements', action: 'create', description: 'Buat pengumuman' },
  { feature: 'announcements', action: 'read', description: 'Lihat pengumuman' },
  { feature: 'announcements', action: 'update', description: 'Update pengumuman' },
  { feature: 'announcements', action: 'delete', description: 'Hapus pengumuman' },

  // Letters (surat) permissions
  { feature: 'letters', action: 'create', description: 'Buat surat' },
  { feature: 'letters', action: 'read', description: 'Lihat surat' },
  { feature: 'letters', action: 'update', description: 'Update surat' },
  { feature: 'letters', action: 'delete', description: 'Hapus surat' },

  // Suara Warga (posting) permissions
  { feature: 'posts', action: 'create', description: 'Buat posting suara warga' },
  { feature: 'posts', action: 'read', description: 'Lihat posting suara warga' },
  { feature: 'posts', action: 'update', description: 'Update posting suara warga' },
  { feature: 'posts', action: 'delete', description: 'Hapus posting suara warga' },
  { feature: 'posts', action: 'pin', description: 'Sematkan posting suara warga' },
  { feature: 'posts', action: 'moderate', description: 'Moderasi posting dan laporan warga' },
];

// Matriks permission untuk setiap role
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    // Full access ke semua fitur
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'roles:create',
    'roles:read',
    'roles:update',
    'roles:delete',
    'families:create',
    'families:read',
    'families:update',
    'families:delete',
    'residents:create',
    'residents:read',
    'residents:update',
    'residents:delete',
    'audit_logs:read',
    'bills:create',
    'bills:read',
    'bills:update',
    'bills:delete',
    'cash:create',
    'cash:read',
    'cash:update',
    'cash:delete',
    'announcements:create',
    'announcements:read',
    'announcements:update',
    'announcements:delete',
    'letters:create',
    'letters:read',
    'letters:update',
    'letters:delete',
    'posts:create',
    'posts:read',
    'posts:update',
    'posts:delete',
    'posts:pin',
    'posts:moderate',
  ],
  ADMIN_RT: [
    // Manage users, families, residents + keuangan & komunikasi
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'roles:read',
    'families:create',
    'families:read',
    'families:update',
    'families:delete',
    'residents:create',
    'residents:read',
    'residents:update',
    'residents:delete',
    'audit_logs:read',
    'bills:create',
    'bills:read',
    'bills:update',
    'bills:delete',
    'cash:create',
    'cash:read',
    'cash:update',
    'cash:delete',
    'announcements:create',
    'announcements:read',
    'announcements:update',
    'announcements:delete',
    'letters:create',
    'letters:read',
    'letters:update',
    'letters:delete',
    'posts:create',
    'posts:read',
    'posts:update',
    'posts:delete',
    'posts:pin',
    'posts:moderate',
  ],
  ADMIN_SEKRETARIS: [
    // Manage families, residents, pengumuman & surat
    'users:read',
    'roles:read',
    'families:create',
    'families:read',
    'families:update',
    'residents:create',
    'residents:read',
    'residents:update',
    'bills:read',
    'announcements:create',
    'announcements:read',
    'announcements:update',
    'announcements:delete',
    'letters:create',
    'letters:read',
    'letters:update',
    'letters:delete',
    'posts:read',
    'posts:delete',
    'posts:moderate',
  ],
  ADMIN_BENDAHARA: [
    // Fokus keuangan: iuran & kas RT
    'users:read',
    'roles:read',
    'families:read',
    'residents:read',
    'bills:create',
    'bills:read',
    'bills:update',
    'bills:delete',
    'cash:create',
    'cash:read',
    'cash:update',
    'cash:delete',
    'announcements:read',
    'letters:read',
    'posts:read',
  ],
  WARGA: [
    // Akses ke data sendiri + baca info + ajukan surat
    'families:read',
    'residents:read',
    'bills:read',
    'announcements:read',
    'letters:read',
    'letters:create',
    'posts:create',
    'posts:read',
    'posts:update',
    'posts:delete',
  ],
};

async function main() {
  console.log('🌱 Mulai seeding database...');

  // Seed Roles
  console.log('📝 Seeding roles...');
  const roles = await Promise.all(
    DEFAULT_ROLES.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      }),
    ),
  );
  console.log(`✅ ${roles.length} roles berhasil di-seed`);

  // Seed Permissions
  console.log('📝 Seeding permissions...');
  const permissions = await Promise.all(
    DEFAULT_PERMISSIONS.map((permission) =>
      prisma.permission.upsert({
        where: {
          feature_action: {
            feature: permission.feature,
            action: permission.action,
          },
        },
        update: {},
        create: permission,
      }),
    ),
  );
  console.log(`✅ ${permissions.length} permissions berhasil di-seed`);

  // Seed Role-Permission assignments
  console.log('📝 Seeding role-permission assignments...');
  let assignmentCount = 0;

  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = roles.find((r) => r.name === roleName);
    if (!role) continue;

    for (const permKey of permissionKeys) {
      const [feature, action] = permKey.split(':');
      const permission = permissions.find((p) => p.feature === feature && p.action === action);

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
        assignmentCount++;
      }
    }
  }
  console.log(`✅ ${assignmentCount} role-permission assignments berhasil di-seed`);

  // Seed Test Families
  console.log('📝 Seeding test families...');
  const testFamilies = [
    {
      headOfFamily: 'Budi Santoso',
      address: 'Jl. Satriamekar Raya Blok A No. 1',
    },
    {
      headOfFamily: 'Ahmad Hidayat',
      address: 'Jl. Satriamekar Raya Blok B No. 5',
    },
    {
      headOfFamily: 'Siti Nurhaliza',
      address: 'Jl. Satriamekar Raya Blok C No. 10',
    },
  ];

  const families = [];
  for (const family of testFamilies) {
    const existing = await prisma.family.findFirst({
      where: { headOfFamily: family.headOfFamily },
    });

    if (existing) {
      families.push(existing);
    } else {
      const created = await prisma.family.create({ data: family });
      families.push(created);
    }
  }
  console.log(`✅ ${families.length} test families berhasil di-seed`);

  // Seed Test Residents
  console.log('📝 Seeding test residents...');
  const testResidents = [
    {
      familyId: families[0].id,
      fullName: 'Budi Santoso',
      idNumber: '3216010101800001',
      birthDate: new Date('1980-01-01'),
      gender: 'L',
      relationship: 'Kepala Keluarga',
    },
    {
      familyId: families[0].id,
      fullName: 'Ani Santoso',
      idNumber: '3216010202850001',
      birthDate: new Date('1985-02-02'),
      gender: 'P',
      relationship: 'Istri',
    },
    {
      familyId: families[1].id,
      fullName: 'Ahmad Hidayat',
      idNumber: '3216010303750001',
      birthDate: new Date('1975-03-03'),
      gender: 'L',
      relationship: 'Kepala Keluarga',
    },
    {
      familyId: families[2].id,
      fullName: 'Siti Nurhaliza',
      idNumber: '3216010404820001',
      birthDate: new Date('1982-04-04'),
      gender: 'P',
      relationship: 'Kepala Keluarga',
    },
  ];

  const residents = await Promise.all(
    testResidents.map((resident) =>
      prisma.resident.upsert({
        where: { idNumber: resident.idNumber },
        update: {},
        create: resident,
      }),
    ),
  );
  console.log(`✅ ${residents.length} test residents berhasil di-seed`);

  // Seed Test Users
  console.log('📝 Seeding test users...');
  const superAdminRole = roles.find((r) => r.name === 'SUPER_ADMIN');
  const adminRtRole = roles.find((r) => r.name === 'ADMIN_RT');
  const wargaRole = roles.find((r) => r.name === 'WARGA');

  const testUsers = [
    {
      phoneNumber: '+628123456789',
      fullName: 'Super Admin',
      roleId: superAdminRole!.id,
      isActive: true,
    },
    {
      phoneNumber: '+628234567890',
      fullName: 'Admin RT',
      roleId: adminRtRole!.id,
      familyId: families[0].id,
      isActive: true,
    },
    {
      phoneNumber: '+628345678901',
      fullName: 'Budi Santoso',
      roleId: wargaRole!.id,
      familyId: families[0].id,
      isActive: true,
    },
  ];

  const users = await Promise.all(
    testUsers.map((user) =>
      prisma.user.upsert({
        where: { phoneNumber: user.phoneNumber },
        update: {},
        create: user,
      }),
    ),
  );
  console.log(`✅ ${users.length} test users berhasil di-seed`);

  // Seed Bill Types
  console.log('📝 Seeding bill types...');
  const billTypes = [
    {
      name: 'Iuran Bulanan',
      amount: 50000,
      period: 'monthly',
      description: 'Iuran wajib bulanan warga',
    },
    {
      name: 'Iuran Kebersihan',
      amount: 25000,
      period: 'monthly',
      description: 'Iuran kebersihan lingkungan',
    },
    {
      name: 'Iuran Keamanan',
      amount: 30000,
      period: 'monthly',
      description: 'Iuran keamanan (satpam)',
    },
  ];
  for (const bt of billTypes) {
    await prisma.billType.upsert({ where: { name: bt.name }, update: {}, create: bt });
  }
  console.log(`✅ ${billTypes.length} bill types berhasil di-seed`);

  // Seed Cash Categories
  console.log('📝 Seeding cash categories...');
  const cashCategories = [
    { name: 'Iuran Warga', type: 'income', description: 'Pemasukan dari iuran warga' },
    { name: 'Sumbangan', type: 'income', description: 'Sumbangan sukarela' },
    { name: 'Lain-lain (Masuk)', type: 'income', description: 'Pemasukan lainnya' },
    { name: 'Kebersihan', type: 'expense', description: 'Biaya kebersihan lingkungan' },
    { name: 'Keamanan', type: 'expense', description: 'Biaya keamanan' },
    { name: 'Kegiatan', type: 'expense', description: 'Biaya kegiatan warga' },
    { name: 'Pemeliharaan', type: 'expense', description: 'Biaya pemeliharaan fasilitas' },
    { name: 'Lain-lain (Keluar)', type: 'expense', description: 'Pengeluaran lainnya' },
  ];
  for (const cc of cashCategories) {
    await prisma.cashCategory.upsert({
      where: { name_type: { name: cc.name, type: cc.type } },
      update: {},
      create: cc,
    });
  }
  console.log(`✅ ${cashCategories.length} cash categories berhasil di-seed`);

  // Seed Letter Templates
  console.log('📝 Seeding letter templates...');
  const letterTemplates = [
    {
      name: 'Surat Pengantar',
      type: 'pengantar',
      description: 'Surat pengantar umum',
      content:
        'Yang bertanda tangan di bawah ini menerangkan bahwa:\n\nNama: {{nama}}\nAlamat: {{alamat}}\n\nAdalah benar warga RT 04 / RW 010.\n\nSurat ini dibuat untuk keperluan: {{keperluan}}.\n\nDemikian surat ini dibuat dengan sebenarnya.',
    },
    {
      name: 'Surat Keterangan Domisili',
      type: 'domisili',
      description: 'Surat keterangan tempat tinggal',
      content:
        'Yang bertanda tangan di bawah ini menerangkan bahwa:\n\nNama: {{nama}}\nNIK: {{nik}}\nAlamat: {{alamat}}\n\nAdalah benar berdomisili di alamat tersebut.\n\nSurat ini dibuat untuk keperluan: {{keperluan}}.\n\nDemikian surat ini dibuat dengan sebenarnya.',
    },
  ];
  for (const lt of letterTemplates) {
    const existing = await prisma.letterTemplate.findUnique({ where: { name: lt.name } });
    if (!existing) await prisma.letterTemplate.create({ data: lt });
  }
  console.log(`✅ ${letterTemplates.length} letter templates berhasil di-seed`);

  // Seed System Settings
  console.log('📝 Seeding system settings...');
  const defaultSettings = [
    { key: 'rt_name', value: 'RT 04', label: 'Nama RT', group: 'rt_info' },
    { key: 'rw_name', value: 'RW 010', label: 'Nama RW', group: 'rt_info' },
    { key: 'kelurahan', value: 'Satriamekar', label: 'Kelurahan', group: 'rt_info' },
    { key: 'kecamatan', value: 'Tambun Utara', label: 'Kecamatan', group: 'rt_info' },
    { key: 'kabupaten', value: 'Bekasi', label: 'Kabupaten/Kota', group: 'rt_info' },
    { key: 'provinsi', value: 'Jawa Barat', label: 'Provinsi', group: 'rt_info' },
    {
      key: 'housing_complex',
      value: 'Satriamekar Raya Residence 2',
      label: 'Perumahan',
      group: 'rt_info',
    },
  ];
  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log(`✅ ${defaultSettings.length} system settings berhasil di-seed`);

  console.log('');
  console.log('🎉 Seeding selesai!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - ${roles.length} roles`);
  console.log(`   - ${permissions.length} permissions`);
  console.log(`   - ${assignmentCount} role-permission assignments`);
  console.log(`   - ${families.length} families`);
  console.log(`   - ${residents.length} residents`);
  console.log(`   - ${users.length} users`);
  console.log('');
  console.log('🔑 Test Users:');
  console.log('   - Super Admin: +628123456789');
  console.log('   - Admin RT: +628234567890');
  console.log('   - Warga: +628345678901');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
