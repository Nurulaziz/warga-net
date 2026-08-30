import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  console.log('🔍 Checking payment dates in database...\n');

  // Get all payments
  const payments = await prisma.payment.findMany({
    where: {
      isVoided: false,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      bill: {
        select: {
          period: true,
        },
      },
    },
  });

  console.log(`Total payments: ${payments.length}\n`);

  if (payments.length === 0) {
    console.log('❌ No payments found in database!');
    console.log('Run seed script: npm run seed:comprehensive');
    return;
  }

  // Group by month
  const byMonth: Record<string, number> = {};
  payments.forEach((payment) => {
    const month = payment.createdAt.toISOString().substring(0, 7); // YYYY-MM
    byMonth[month] = (byMonth[month] || 0) + 1;
  });

  console.log('📊 Payments by createdAt month:');
  Object.entries(byMonth)
    .sort()
    .forEach(([month, count]) => {
      console.log(`  ${month}: ${count} payments`);
    });

  console.log('\n📅 Date range:');
  console.log(`  First payment: ${payments[0].createdAt.toISOString()}`);
  console.log(`  Last payment: ${payments[payments.length - 1].createdAt.toISOString()}`);

  console.log('\n💰 Sample payments:');
  payments.slice(0, 5).forEach((payment) => {
    console.log(
      `  Period: ${payment.bill.period}, Amount: Rp ${Number(payment.amount).toLocaleString('id-ID')}, Date: ${payment.createdAt.toISOString()}`,
    );
  });

  // Get all expenses
  const expenses = await prisma.expense.findMany({
    where: {
      isVoided: false,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      description: true,
    },
  });

  console.log(`\n\n🔍 Checking expense dates...\n`);
  console.log(`Total expenses: ${expenses.length}\n`);

  if (expenses.length === 0) {
    console.log('❌ No expenses found in database!');
    return;
  }

  // Group by month
  const expensesByMonth: Record<string, number> = {};
  expenses.forEach((expense) => {
    const month = expense.createdAt.toISOString().substring(0, 7); // YYYY-MM
    expensesByMonth[month] = (expensesByMonth[month] || 0) + 1;
  });

  console.log('📊 Expenses by createdAt month:');
  Object.entries(expensesByMonth)
    .sort()
    .forEach(([month, count]) => {
      console.log(`  ${month}: ${count} expenses`);
    });

  console.log('\n📅 Date range:');
  console.log(`  First expense: ${expenses[0].createdAt.toISOString()}`);
  console.log(`  Last expense: ${expenses[expenses.length - 1].createdAt.toISOString()}`);

  console.log('\n💰 Sample expenses:');
  expenses.slice(0, 5).forEach((expense) => {
    console.log(
      `  Description: ${expense.description}, Amount: Rp ${Number(expense.amount).toLocaleString('id-ID')}, Date: ${expense.createdAt.toISOString()}`,
    );
  });
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
