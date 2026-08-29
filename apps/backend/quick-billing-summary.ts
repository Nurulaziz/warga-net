import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Quick summary untuk melihat status billing secara cepat
 */

async function main() {
  console.log('\n🏠 WargaNet - Quick Billing Summary\n');
  console.log('═'.repeat(60));

  const periods = ['2025-11', '2025-12', '2026-01', '2026-02'];

  for (const period of periods) {
    const [statusStats, financialStats] = await Promise.all([
      prisma.bill.groupBy({
        by: ['status'],
        where: { period },
        _count: true,
      }),
      prisma.bill.aggregate({
        where: { period },
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
        _count: true,
      }),
    ]);

    const statusMap = {
      BELUM_BAYAR: 0,
      SEBAGIAN: 0,
      LUNAS: 0,
      TERLAMBAT: 0,
    };

    statusStats.forEach((stat) => {
      statusMap[stat.status] = stat._count;
    });

    const totalWarga = financialStats._count;
    const belumBayar = statusMap.BELUM_BAYAR + statusMap.TERLAMBAT;
    const sudahBayar = statusMap.SEBAGIAN + statusMap.LUNAS;
    const totalAmount = Number(financialStats._sum.totalAmount || 0);
    const paidAmount = Number(financialStats._sum.paidAmount || 0);
    const percentage = totalAmount > 0 ? (paidAmount / totalAmount * 100).toFixed(1) : '0.0';

    // Determine emoji based on payment percentage
    let emoji = '🔴';
    if (parseFloat(percentage) >= 80) emoji = '🟢';
    else if (parseFloat(percentage) >= 50) emoji = '🟡';

    console.log(`\n${emoji} ${period}`);
    console.log('─'.repeat(60));
    console.log(`Warga: ${totalWarga} | Bayar: ${sudahBayar} | Belum: ${belumBayar} | Lunas: ${statusMap.LUNAS}`);
    console.log(`Tagihan: Rp ${totalAmount.toLocaleString('id-ID')}`);
    console.log(`Terbayar: Rp ${paidAmount.toLocaleString('id-ID')} (${percentage}%)`);
    console.log(`Sisa: Rp ${(totalAmount - paidAmount).toLocaleString('id-ID')}`);
  }

  console.log('\n' + '═'.repeat(60));

  // Overall summary
  const overallStats = await prisma.bill.aggregate({
    where: {
      period: {
        in: periods,
      },
    },
    _sum: {
      totalAmount: true,
      paidAmount: true,
    },
    _count: true,
  });

  const overallTotal = Number(overallStats._sum.totalAmount || 0);
  const overallPaid = Number(overallStats._sum.paidAmount || 0);
  const overallPercentage = overallTotal > 0 ? (overallPaid / overallTotal * 100).toFixed(1) : '0.0';

  console.log('\n💰 OVERALL (Nov 2025 - Feb 2026)');
  console.log('─'.repeat(60));
  console.log(`Total Bills: ${overallStats._count}`);
  console.log(`Total Amount: Rp ${overallTotal.toLocaleString('id-ID')}`);
  console.log(`Total Paid: Rp ${overallPaid.toLocaleString('id-ID')} (${overallPercentage}%)`);
  console.log(`Outstanding: Rp ${(overallTotal - overallPaid).toLocaleString('id-ID')}`);
  console.log('\n' + '═'.repeat(60) + '\n');

  // Legend
  console.log('Legend:');
  console.log('🟢 >= 80% terbayar');
  console.log('🟡 50-79% terbayar');
  console.log('🔴 < 50% terbayar\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
