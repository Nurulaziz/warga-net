import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  console.log('🔍 Testing date filtering for PDF report...\n');

  // Simulate what frontend sends
  const startDateStr = '2026-02-01';
  const endDateStr = '2026-02-14';

  // Convert to Date objects (what backend receives)
  const startDate = new Date(startDateStr);
  startDate.setUTCHours(0, 0, 0, 0); // Start of day in UTC
  
  const endDate = new Date(endDateStr);
  endDate.setUTCHours(23, 59, 59, 999); // End of day in UTC

  console.log('Frontend sends:');
  console.log(`  startDate: ${startDateStr}`);
  console.log(`  endDate: ${endDateStr}`);
  console.log('');

  console.log('Backend receives (Date objects):');
  console.log(`  startDate: ${startDate.toISOString()}`);
  console.log(`  endDate: ${endDate.toISOString()}`);
  console.log('');

  // Query payments with this date range
  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      isVoided: false,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
    },
  });

  console.log(`Found ${payments.length} payments with this filter\n`);

  if (payments.length > 0) {
    console.log('Sample payments:');
    payments.slice(0, 5).forEach((p) => {
      console.log(`  ${p.createdAt.toISOString()} - Rp ${Number(p.amount).toLocaleString('id-ID')}`);
    });
  } else {
    console.log('❌ No payments found!');
    console.log('\nLet\'s check what dates exist in database:');
    
    const allPayments = await prisma.payment.findMany({
      where: { isVoided: false },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    
    if (allPayments.length > 0) {
      console.log(`  First payment: ${allPayments[0].createdAt.toISOString()}`);
      console.log(`  Last payment: ${allPayments[allPayments.length - 1].createdAt.toISOString()}`);
    }
  }

  // Query expenses with this date range
  const expenses = await prisma.expense.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      isVoided: false,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
    },
  });

  console.log(`\n\nFound ${expenses.length} expenses with this filter\n`);

  if (expenses.length > 0) {
    console.log('Sample expenses:');
    expenses.slice(0, 5).forEach((e) => {
      console.log(`  ${e.createdAt.toISOString()} - Rp ${Number(e.amount).toLocaleString('id-ID')}`);
    });
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
