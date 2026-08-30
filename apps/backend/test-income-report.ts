import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function testIncomeReport() {
  try {
    console.log('=== Testing Income Report Generation ===\n');

    const startDate = new Date('2026-02-01');
    const endDate = new Date('2026-02-28');

    console.log('Date range:', { startDate, endDate });

    // Test 1: Direct payment query (what backend should do)
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
            user: {
              select: {
                fullName: true,
              },
            },
            billItems: {
              include: {
                feeType: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`\nFound ${payments.length} payments`);

    if (payments.length > 0) {
      // Calculate totals
      const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      console.log(`Total Income: Rp ${totalIncome.toLocaleString('id-ID')}`);

      // By method
      const byMethod = payments.reduce((acc, payment) => {
        acc[payment.method] = (acc[payment.method] || 0) + Number(payment.amount);
        return acc;
      }, {} as Record<string, number>);

      console.log('\nBy Method:');
      console.log(byMethod);

      // By fee type
      const byFeeType: Record<string, number> = {};
      payments.forEach((payment) => {
        payment.bill.billItems.forEach((item) => {
          const feeTypeName = item.feeType.name;
          const itemProportion = Number(item.amount) / Number(payment.bill.totalAmount);
          const allocatedAmount = Number(payment.amount) * itemProportion;
          byFeeType[feeTypeName] = (byFeeType[feeTypeName] || 0) + allocatedAmount;
        });
      });

      console.log('\nBy Fee Type:');
      console.log(byFeeType);

      // Sample payment
      console.log('\nSample payment:');
      console.log({
        date: payments[0].createdAt,
        resident: payments[0].bill.user.fullName,
        amount: Number(payments[0].amount),
        method: payments[0].method,
        billItems: payments[0].bill.billItems.map(item => ({
          feeType: item.feeType.name,
          amount: Number(item.amount),
        })),
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testIncomeReport();
