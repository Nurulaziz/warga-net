/**
 * Test that voided expenses are correctly filtered out
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testVoidedExpenseFilter() {
  console.log('🧪 Testing voided expense filter...\n');

  const rtId = '04';
  const startDate = new Date('2026-02-01');
  const endDate = new Date('2026-02-28');

  // Get first expense
  const firstExpense = await prisma.expense.findFirst({
    where: {
      user: {
        family: {
          rt: rtId,
          deletedAt: null,
        },
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      isVoided: false,
    },
  });

  if (!firstExpense) {
    console.log('❌ No expenses found to test with');
    return;
  }

  console.log(`📝 Found expense to test: ${firstExpense.description}`);
  console.log(`   Amount: Rp ${Number(firstExpense.amount).toLocaleString('id-ID')}`);
  console.log(`   ID: ${firstExpense.id}\n`);

  // Count expenses before voiding
  const countBefore = await prisma.expense.count({
    where: {
      user: {
        family: {
          rt: rtId,
          deletedAt: null,
        },
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      isVoided: false,
    },
  });

  console.log(`📊 Non-voided expenses before: ${countBefore}`);

  // Void the expense
  await prisma.expense.update({
    where: { id: firstExpense.id },
    data: {
      isVoided: true,
      voidReason: 'Test void for verification',
      voidedAt: new Date(),
      voidedBy: firstExpense.userId,
    },
  });

  console.log('✓ Expense voided\n');

  // Count expenses after voiding
  const countAfter = await prisma.expense.count({
    where: {
      user: {
        family: {
          rt: rtId,
          deletedAt: null,
        },
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      isVoided: false,
    },
  });

  console.log(`📊 Non-voided expenses after: ${countAfter}`);

  // Verify the count decreased by 1
  const filterWorks = countAfter === countBefore - 1;
  console.log(`\n✓ Filter works correctly: ${filterWorks ? '✅ YES' : '❌ NO'}`);

  if (filterWorks) {
    console.log('  Voided expense is correctly excluded from results');
  }

  // Restore the expense
  await prisma.expense.update({
    where: { id: firstExpense.id },
    data: {
      isVoided: false,
      voidReason: null,
      voidedAt: null,
      voidedBy: null,
    },
  });

  console.log('\n✓ Expense restored to original state');
}

testVoidedExpenseFilter()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
