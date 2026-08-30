import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Cek apakah pembayaran dianggap sah (sama seperti di BillsService)
function isSettled(p: { method: string; transactionStatus: string | null }): boolean {
  if (p.method === 'cash' || p.method === 'transfer') return true;
  return p.transactionStatus === 'settlement' || p.transactionStatus === 'capture';
}

async function backfill() {
  console.log('🔄 Backfill pembayaran iuran lama ke Kas RT...');

  // Pastikan kategori "Iuran Warga" (income) ada
  const category = await prisma.cashCategory.upsert({
    where: { name_type: { name: 'Iuran Warga', type: 'income' } },
    update: {},
    create: { name: 'Iuran Warga', type: 'income', description: 'Pemasukan dari iuran warga' },
  });

  // Ambil semua payment yang belum punya entri kas
  const payments = await prisma.payment.findMany({
    where: { cashTransaction: null },
    include: { bill: { include: { billType: true, family: true } } },
  });

  let created = 0;
  let skipped = 0;

  for (const payment of payments) {
    if (!isSettled(payment)) {
      skipped++;
      continue;
    }

    const familyName = payment.bill.family?.headOfFamily || 'Warga';
    const billName = payment.bill.billType?.name || 'Iuran';
    const period = payment.bill.period;

    try {
      await prisma.cashTransaction.create({
        data: {
          categoryId: category.id,
          type: 'income',
          amount: payment.amount,
          description: `${billName} — ${familyName} — periode ${period}`,
          date: payment.paidAt,
          createdBy: payment.receivedBy || undefined,
          paymentId: payment.id,
        },
      });
      created++;
    } catch (error) {
      // Kemungkinan sudah ada (unique paymentId) — lewati
      skipped++;
      console.warn(`⚠️  Lewati payment ${payment.id}: ${error}`);
    }
  }

  console.log(`✅ Selesai. ${created} entri kas dibuat, ${skipped} dilewati (belum settled/sudah ada).`);
}

backfill()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
