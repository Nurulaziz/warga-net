import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Financial Summary Data...\n');

  // Check payments for 2025
  console.log('📊 PAYMENTS DATA FOR 2025:');
  const payments2025 = await prisma.payment.findMany({
    where: {
      isVoided: false,
      createdAt: {
        gte: new Date('2025-01-01'),
        lte: new Date('2025-12-31T23:59:59'),
      },
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Total payments in 2025: ${payments2025.length}`);
  if (payments2025.length > 0) {
    console.log('\nFirst 5 payments:');
    payments2025.slice(0, 5).forEach((p) => {
      console.log(`  - ${p.createdAt.toISOString().split('T')[0]}: Rp ${p.amount.toLocaleString('id-ID')}`);
    });
    
    // Group by month
    const byMonth: Record<number, number> = {};
    payments2025.forEach((p) => {
      const month = p.createdAt.getMonth();
      byMonth[month] = (byMonth[month] || 0) + Number(p.amount);
    });
    
    console.log('\nPayments by month:');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    Object.keys(byMonth).forEach((monthIndex) => {
      console.log(`  ${monthNames[Number(monthIndex)]}: Rp ${byMonth[Number(monthIndex)].toLocaleString('id-ID')}`);
    });
  } else {
    console.log('  ❌ No payments found for 2025');
  }

  // Check expenses for 2025
  console.log('\n\n📊 EXPENSES DATA FOR 2025:');
  const expenses2025 = await prisma.expense.findMany({
    where: {
      isVoided: false,
      createdAt: {
        gte: new Date('2025-01-01'),
        lte: new Date('2025-12-31T23:59:59'),
      },
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      description: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Total expenses in 2025: ${expenses2025.length}`);
  if (expenses2025.length > 0) {
    console.log('\nFirst 5 expenses:');
    expenses2025.slice(0, 5).forEach((e) => {
      console.log(`  - ${e.createdAt.toISOString().split('T')[0]}: Rp ${e.amount.toLocaleString('id-ID')} - ${e.description}`);
    });
    
    // Group by month
    const byMonth: Record<number, number> = {};
    expenses2025.forEach((e) => {
      const month = e.createdAt.getMonth();
      byMonth[month] = (byMonth[month] || 0) + Number(e.amount);
    });
    
    console.log('\nExpenses by month:');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    Object.keys(byMonth).forEach((monthIndex) => {
      console.log(`  ${monthNames[Number(monthIndex)]}: Rp ${byMonth[Number(monthIndex)].toLocaleString('id-ID')}`);
    });
  } else {
    console.log('  ❌ No expenses found for 2025');
  }

  // Check payments for 2026
  console.log('\n\n📊 PAYMENTS DATA FOR 2026:');
  const payments2026 = await prisma.payment.findMany({
    where: {
      isVoided: false,
      createdAt: {
        gte: new Date('2026-01-01'),
        lte: new Date('2026-12-31T23:59:59'),
      },
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Total payments in 2026: ${payments2026.length}`);
  if (payments2026.length > 0) {
    console.log('\nAll payments:');
    payments2026.forEach((p) => {
      console.log(`  - ${p.createdAt.toISOString().split('T')[0]}: Rp ${p.amount.toLocaleString('id-ID')}`);
    });
  } else {
    console.log('  ❌ No payments found for 2026');
  }

  // Check expenses for 2026
  console.log('\n\n📊 EXPENSES DATA FOR 2026:');
  const expenses2026 = await prisma.expense.findMany({
    where: {
      isVoided: false,
      createdAt: {
        gte: new Date('2026-01-01'),
        lte: new Date('2026-12-31T23:59:59'),
      },
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      description: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Total expenses in 2026: ${expenses2026.length}`);
  if (expenses2026.length > 0) {
    console.log('\nAll expenses:');
    expenses2026.forEach((e) => {
      console.log(`  - ${e.createdAt.toISOString().split('T')[0]}: Rp ${e.amount.toLocaleString('id-ID')} - ${e.description}`);
    });
  } else {
    console.log('  ❌ No expenses found for 2026');
  }

  console.log('\n\n✅ Check complete!');
  console.log('\n💡 RECOMMENDATION:');
  if (payments2025.length > 0 || expenses2025.length > 0) {
    console.log('   → Change default year to 2025 in FinancialSummary component');
    console.log('   → Or add more data for 2026');
  } else {
    console.log('   → Need to seed financial data for 2025 or 2026');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
