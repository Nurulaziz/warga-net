import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuperAdminPermissions() {
  console.log('🔍 Checking SUPER_ADMIN permissions...\n');

  // Get SUPER_ADMIN role
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!superAdminRole) {
    console.log('❌ SUPER_ADMIN role not found!');
    return;
  }

  console.log(`✅ SUPER_ADMIN role found (ID: ${superAdminRole.id})\n`);
  console.log(`📊 Total permissions: ${superAdminRole.permissions.length}\n`);

  // Group permissions by feature
  const permissionsByFeature: Record<string, string[]> = {};
  
  for (const rp of superAdminRole.permissions) {
    const feature = rp.permission.feature;
    const action = rp.permission.action;
    
    if (!permissionsByFeature[feature]) {
      permissionsByFeature[feature] = [];
    }
    
    permissionsByFeature[feature].push(action);
  }

  // Display permissions by feature
  console.log('📋 Permissions by feature:\n');
  
  const features = Object.keys(permissionsByFeature).sort();
  
  for (const feature of features) {
    const actions = permissionsByFeature[feature].sort();
    const actionsStr = actions.join(', ');
    console.log(`   ${feature}: ${actionsStr}`);
  }

  // Check specific financial permissions
  console.log('\n💰 Financial permissions check:\n');
  
  const financialFeatures = ['payments', 'expenses', 'bills', 'fee_types', 'financial_reports'];
  
  for (const feature of financialFeatures) {
    const actions = permissionsByFeature[feature] || [];
    const hasAll = ['create', 'read', 'update', 'delete'].every(a => actions.includes(a));
    const status = hasAll ? '✅' : '❌';
    console.log(`   ${status} ${feature}: ${actions.join(', ') || 'NONE'}`);
  }

  // Get SUPER_ADMIN user
  console.log('\n👤 Checking SUPER_ADMIN user...\n');
  
  const superAdminUser = await prisma.user.findFirst({
    where: {
      role: {
        name: 'SUPER_ADMIN',
      },
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!superAdminUser) {
    console.log('❌ No SUPER_ADMIN user found!');
  } else {
    console.log(`✅ SUPER_ADMIN user found:`);
    console.log(`   Phone: ${superAdminUser.phoneNumber}`);
    console.log(`   Name: ${superAdminUser.fullName}`);
    console.log(`   Active: ${superAdminUser.isActive}`);
    console.log(`   Permissions: ${superAdminUser.role.permissions.length}`);
  }
}

checkSuperAdminPermissions()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
