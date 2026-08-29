import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPayments() {
  try {
    console.log('=== Checking Payments ===\n');

    // Count total payments
    const totalPayments = await prisma.payment.count({
      where: { isVoided: false },
    });
    console.log(`Total non-voided payments: ${totalPayments}\n`);

    // Get sample payments with full details
    const samplePayments = await prisma.payment.findMany({
      where: { isVoided: false },
      take: 3,
      include: {
        bill: {
          select: {
            userId: true,
            period: true,
            user: {
              select: {
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
        user: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Sample payments:');
    samplePayments.forEach((payment, index) => {
      console.log(`\n${index + 1}. Payment ID: ${payment.id}`);
      console.log(`   Bill ID: ${payment.billId}`);
      console.log(`   Bill Period: ${payment.bill.period}`);
      console.log(`   Bill User ID: ${payment.bill.userId}`);
      console.log(`   Bill User Name: ${payment.bill.user.fullName}`);
      console.log(`   Payment User ID: ${payment.userId}`);
      console.log(`   Payment User Name: ${payment.user.fullName}`);
      console.log(`   Amount: ${payment.amount}`);
      console.log(`   Method: ${payment.method}`);
      console.log(`   Created: ${payment.createdAt}`);
    });

    // Test the exact query from getPaymentHistory
    console.log('\n\n=== Testing getPaymentHistory Query ===\n');
    
    const where = {
      isVoided: false,
    };

    console.log('WHERE clause:', JSON.stringify(where, null, 2));

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          bill: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  phoneNumber: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 100,
      }),
      prisma.payment.count({ where }),
    ]);

    console.log(`\nQuery returned: ${payments.length} payments`);
    console.log(`Total count: ${total}`);

    if (payments.length > 0) {
      console.log('\nFirst payment sample:');
      console.log(JSON.stringify(payments[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPayments();
