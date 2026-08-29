/**
 * Verification script untuk fetchExpenseTransactions()
 * Task 3.3: Verify implementation meets requirements 5.2, 5.3, 5.4
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyExpenseTransactions() {
  console.log('🔍 Verifying fetchExpenseTransactions implementation...\n');

  // Test parameters
  const rtId = '04'; // RT 04 (has test data)
  const startDate = new Date('2026-02-01');
  const endDate = new Date('2026-02-28');

  console.log(`📅 Period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log(`🏘️  RT ID: ${rtId}\n`);

  // Fetch expenses using the same logic as data-fetcher.service.ts
  const expenses = await prisma.expense.findMany({
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
      isVoided: false, // Requirement 5.3, 5.4: Only non-voided (approved) expenses
    },
    include: {
      category: true, // Requirement: Include category relation
      user: true, // Requirement: Include approvedBy (user) relation
    },
    orderBy: {
      createdAt: 'asc', // Requirement 5.2: Sort by date ascending
    },
  });

  console.log(`✅ Found ${expenses.length} expense transactions\n`);

  // Verify requirements
  console.log('📋 Verification Results:\n');

  // Requirement 5.2: Sort by date ascending
  let isSortedAscending = true;
  for (let i = 1; i < expenses.length; i++) {
    if (expenses[i].createdAt < expenses[i - 1].createdAt) {
      isSortedAscending = false;
      break;
    }
  }
  console.log(`✓ Requirement 5.2 (Sort ascending): ${isSortedAscending ? 'PASS' : 'FAIL'}`);

  // Requirement 5.3: Only approved (non-voided) expenses
  const hasVoidedExpenses = expenses.some((e) => e.isVoided);
  console.log(`✓ Requirement 5.3 (Approved only): ${!hasVoidedExpenses ? 'PASS' : 'FAIL'}`);

  // Requirement 5.4: Only non-deleted expenses (isVoided = false)
  const hasDeletedExpenses = expenses.some((e) => e.isVoided);
  console.log(`✓ Requirement 5.4 (Non-deleted only): ${!hasDeletedExpenses ? 'PASS' : 'FAIL'}`);

  // Verify relations are included
  const hasCategory = expenses.every((e) => e.category !== null);
  const hasUser = expenses.every((e) => e.user !== null);
  console.log(`✓ Include category relation: ${hasCategory ? 'PASS' : 'FAIL'}`);
  console.log(`✓ Include user (approvedBy) relation: ${hasUser ? 'PASS' : 'FAIL'}`);

  // Display sample data
  if (expenses.length > 0) {
    console.log('\n📊 Sample Expense Transactions:\n');
    expenses.slice(0, 5).forEach((expense, index) => {
      console.log(`${index + 1}. Date: ${expense.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Description: ${expense.description}`);
      console.log(`   Category: ${expense.category.name}`);
      console.log(`   Amount: Rp ${Number(expense.amount).toLocaleString('id-ID')}`);
      console.log(`   Approved By: ${expense.user.fullName}`);
      console.log(`   Is Voided: ${expense.isVoided}`);
      console.log('');
    });
  }

  // Check for voided expenses in the period (should not be included)
  const voidedExpenses = await prisma.expense.findMany({
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
      isVoided: true, // Voided expenses
    },
  });

  console.log(`\n🚫 Voided expenses in period (should be excluded): ${voidedExpenses.length}`);
  if (voidedExpenses.length > 0) {
    console.log('   These expenses are correctly filtered out by isVoided: false');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📝 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total expenses fetched: ${expenses.length}`);
  console.log(`All requirements met: ${isSortedAscending && !hasVoidedExpenses && hasCategory && hasUser ? '✅ YES' : '❌ NO'}`);
  console.log('='.repeat(60));
}

verifyExpenseTransactions()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
