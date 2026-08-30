import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { mapAppRoleToBetterAuth } from './src/common/role-mapping';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Script untuk menyinkronkan ba_user.role dengan app role (tabel users)
// App role adalah sumber kebenaran
async function fixRoleSync() {
  console.log('🔧 Sinkronisasi ba_user.role dengan app role...\n');

  // Ambil semua app user beserta role-nya
  const appUsers = await prisma.user.findMany({
    where: { deletedAt: null },
    include: { role: true },
  });

  let synced = 0;
  let skipped = 0;
  let noBaUser = 0;

  for (const user of appUsers) {
    const targetRole = mapAppRoleToBetterAuth(user.role.name);

    // Cari ba_user berdasarkan phone number
    const baUser = await prisma.betterAuthUser.findFirst({
      where: { phoneNumber: user.phoneNumber },
    });

    if (!baUser) {
      console.log(`⏭️  ${user.phoneNumber} (${user.fullName}) - belum pernah login, ba_user tidak ada`);
      noBaUser++;
      continue;
    }

    if (baUser.role === targetRole) {
      console.log(`✓  ${user.phoneNumber} (${user.fullName}) - sudah sinkron [${targetRole}]`);
      skipped++;
      continue;
    }

    await prisma.betterAuthUser.update({
      where: { id: baUser.id },
      data: { role: targetRole },
    });

    console.log(`🔄 ${user.phoneNumber} (${user.fullName}) - ${user.role.name}: '${baUser.role || 'null'}' -> '${targetRole}'`);
    synced++;
  }

  console.log(`\n📊 Ringkasan:`);
  console.log(`   Disinkronkan : ${synced}`);
  console.log(`   Sudah sinkron: ${skipped}`);
  console.log(`   Belum login  : ${noBaUser}`);
  console.log(`   Total app user: ${appUsers.length}`);
  console.log('\n✅ Selesai.');
}

fixRoleSync()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
