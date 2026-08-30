import { PrismaClient, Prisma } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Mimic exactly what the service does
async function testControllerFlow() {
  try {
    console.log('=== Mimicking Controller Flow ===\n');

    // Simulate controller parameters
    const page = 1;
    const limit = 100;
    const filters = {}; // Empty filters like SUPER_ADMIN with no userId filter

    console.log('Input params:', { page, limit, filters });

    // Simulate service method
    const skip = Math.max(0, (page - 1) * limit);

    const where: Prisma.PaymentWhereInput = {
      isVoided: false,
    };

    // No filters applied (like SUPER_ADMIN case)

    console.log('WHERE clause:', JSON.stringify(where, null, 2));
    console.log('Pagination:', { page, limit, skip });

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
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    console.log('\nQuery result:', {
      paymentsFound: payments.length,
      totalCount: total,
    });

    if (payments.length > 0) {
      console.log('\nFirst payment:');
      console.log(JSON.stringify(payments[0], null, 2));
    }

    // Simulate controller response
    const response = {
      payments: payments || [],
      total: total || 0,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    };

    console.log('\nController would return:');
    console.log(`- ${response.payments.length} payments`);
    console.log(`- Total: ${response.total}`);
    console.log(`- Total Pages: ${response.totalPages}`);

    // Test JSON serialization
    console.log('\n=== Testing JSON Serialization ===');
    const jsonString = JSON.stringify(response);
    console.log('JSON length:', jsonString.length);
    const parsed = JSON.parse(jsonString);
    console.log('Parsed payments count:', parsed.payments.length);

  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testControllerFlow();
