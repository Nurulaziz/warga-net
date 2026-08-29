/**
 * Check expense data in database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExpenseData() {
  console.log('🔍 Checking expense data in database...\n');

  // Check all expenses
  const allExpenses = await prisma.expense.findMany({
    include: {
      category: true,
      user: {
        include: {
          family: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  console.log(`📊 Total expenses in database: ${allExpenses.length}\n`);

  if (allExpenses.length > 0) {
    console.log('Sample expenses:');
    allExpenses.forEach((expense, index) => {
      console.log(`\n${index + 1}. ${expense.description}`);
      console.log(`   Date: ${expense.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Amount: Rp ${Number(expense.amount).toLocaleString('id-ID')}`);
      console.log(`   Category: ${expense.category.name}`);
      console.log(`   User: ${expense.user.fullName}`);
      console.log(`   User RT: ${expense.user.family?.rt || 'N/A'}`);
      console.log(`   Is Voided: ${expense.isVoided}`);
    });
  }

  // Check expenses by RT
  const rtExpenses = await prisma.expense.groupBy({
    by: ['userId'],
    _count: {
      id: true,
    },
  });

  console.log('\n\n📈 Expenses by User:');
  for (const group of rtExpenses) {
    const user = await prisma.user.findUnique({
      where: { id: group.userId },
      include: { family: true },
    });
    console.log(`  User: ${user?.fullName} (RT ${user?.family?.rt || 'N/A'}) - ${group._count.id} expenses`);
  }

  // Check available RTs
  const families = await prisma.family.findMany({
    where: { deletedAt: null },
    select: { rt: true },
    distinct: ['rt'],
  });

  console.log('\n\n🏘️  Available RTs in database:');
  families.forEach((family) => {
    console.log(`  - RT ${family.rt}`);
  });
}

checkExpenseData()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
