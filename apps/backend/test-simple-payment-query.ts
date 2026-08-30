import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function testSimpleQuery() {
  try {
    console.log('=== Test 1: Simple count ===');
    const count = await prisma.payment.count({
      where: { isVoided: false },
    });
    console.log(`Count: ${count}\n`);

    console.log('=== Test 2: Find without includes ===');
    const paymentsNoInclude = await prisma.payment.findMany({
      where: { isVoided: false },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`Found: ${paymentsNoInclude.length} payments`);
    console.log('Sample:', paymentsNoInclude[0]);

    console.log('\n=== Test 3: Find with bill include ===');
    const paymentsWithBill = await prisma.payment.findMany({
      where: { isVoided: false },
      include: {
        bill: true,
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`Found: ${paymentsWithBill.length} payments`);
    console.log('Sample bill:', paymentsWithBill[0].bill);

    console.log('\n=== Test 4: Find with nested user include ===');
    const paymentsWithNestedUser = await prisma.payment.findMany({
      where: { isVoided: false },
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
      take: 3,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`Found: ${paymentsWithNestedUser.length} payments`);
    console.log('Sample:', {
      id: paymentsWithNestedUser[0].id,
      amount: paymentsWithNestedUser[0].amount,
      billUser: paymentsWithNestedUser[0].bill.user.fullName,
      paymentUser: paymentsWithNestedUser[0].user.fullName,
    });

    console.log('\n=== All tests passed! ===');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleQuery();
