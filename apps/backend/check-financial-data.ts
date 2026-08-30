import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function checkFinancialData() {
  try {
    console.log('=== Checking Financial Data for February 2026 ===\n');

    const startDate = new Date('2026-02-01');
    const endDate = new Date('2026-02-28');

    // Check payments
    const payments = await prisma.payment.findMany({
      where: {
        isVoided: false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        bill: {
          include: {
            user: true,
            billItems: {
              include: {
                feeType: true,
              },
            },
          },
        },
      },
    });

    console.log(`Total payments in Feb 2026: ${payments.length}`);
    if (payments.length > 0) {
      const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      console.log(`Total income: Rp ${totalIncome.toLocaleString('id-ID')}`);
      console.log('\nSample payment:');
      console.log(JSON.stringify(payments[0], null, 2));
    }

    // Check expenses
    const expenses = await prisma.expense.findMany({
      where: {
        isVoided: false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    console.log(`\nTotal expenses in Feb 2026: ${expenses.length}`);
    if (expenses.length > 0) {
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      console.log(`Total expenses: Rp ${totalExpenses.toLocaleString('id-ID')}`);
      console.log('\nSample expense:');
      console.log(JSON.stringify(expenses[0], null, 2));
    }

    // Check bills for payment status report
    const bills = await prisma.bill.findMany({
      where: { period: '2026-02' },
      include: {
        user: true,
        payments: {
          where: { isVoided: false },
        },
      },
    });

    console.log(`\nTotal bills for period 2026-02: ${bills.length}`);
    if (bills.length > 0) {
      console.log('\nBill status summary:');
      const statusCounts = bills.reduce((acc, bill) => {
        acc[bill.status] = (acc[bill.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(statusCounts);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFinancialData();
