import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

/**
 * Script untuk menampilkan tagihan bulan berjalan
 * Menampilkan statistik lengkap dan daftar warga
 */

async function main() {
  const currentPeriod = '2026-02'; // Februari 2026 (bulan berjalan)

  console.log('═══════════════════════════════════════════════════════');
  console.log(`📅 TAGIHAN BULAN BERJALAN: ${currentPeriod}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Get status breakdown
  console.log('📊 STATUS BREAKDOWN\n');
  
  const statusStats = await prisma.bill.groupBy({
    by: ['status'],
    where: { period: currentPeriod },
    _count: true,
  });

  const statusMap = {
    BELUM_BAYAR: 0,
    SEBAGIAN: 0,
    LUNAS: 0,
    TERLAMBAT: 0,
  };

  statusStats.forEach((stat) => {
    statusMap[stat.status] = stat._count;
  });

  const totalWarga = Object.values(statusMap).reduce((sum, count) => sum + count, 0);
  const belumBayar = statusMap.BELUM_BAYAR + statusMap.TERLAMBAT;
  const sudahBayar = statusMap.SEBAGIAN + statusMap.LUNAS;

  console.log(`Total Warga: ${totalWarga}`);
  console.log(`├─ ✅ Sudah Bayar: ${sudahBayar} (${(sudahBayar/totalWarga*100).toFixed(1)}%)`);
  console.log(`│  ├─ Lunas: ${statusMap.LUNAS}`);
  console.log(`│  └─ Sebagian: ${statusMap.SEBAGIAN}`);
  console.log(`└─ ❌ Belum Bayar: ${belumBayar} (${(belumBayar/totalWarga*100).toFixed(1)}%)`);
  console.log(`   ├─ Belum Bayar: ${statusMap.BELUM_BAYAR}`);
  console.log(`   └─ Terlambat: ${statusMap.TERLAMBAT}\n`);

  // 2. Financial summary
  console.log('💰 RINGKASAN KEUANGAN\n');

  const financialStats = await prisma.bill.aggregate({
    where: { period: currentPeriod },
    _sum: {
      totalAmount: true,
      paidAmount: true,
    },
  });

  const totalTagihan = Number(financialStats._sum.totalAmount || 0);
  const totalTerbayar = Number(financialStats._sum.paidAmount || 0);
  const totalSisa = totalTagihan - totalTerbayar;
  const persentaseTerbayar = totalTagihan > 0 ? (totalTerbayar / totalTagihan * 100).toFixed(1) : '0.0';

  console.log(`Total Tagihan: Rp ${totalTagihan.toLocaleString('id-ID')}`);
  console.log(`Total Terbayar: Rp ${totalTerbayar.toLocaleString('id-ID')} (${persentaseTerbayar}%)`);
  console.log(`Total Sisa: Rp ${totalSisa.toLocaleString('id-ID')}\n`);

  // 3. Daftar warga BELUM BAYAR
  console.log('═══════════════════════════════════════════════════════');
  console.log('❌ DAFTAR WARGA BELUM BAYAR');
  console.log('═══════════════════════════════════════════════════════\n');

  const unpaidBills = await prisma.bill.findMany({
    where: {
      period: currentPeriod,
      status: {
        in: ['BELUM_BAYAR', 'TERLAMBAT'],
      },
    },
    include: {
      user: {
        select: {
          fullName: true,
          phoneNumber: true,
          family: {
            select: {
              address: true,
            },
          },
        },
      },
    },
    orderBy: {
      user: { fullName: 'asc' },
    },
  });

  if (unpaidBills.length === 0) {
    console.log('✅ Semua warga sudah bayar!\n');
  } else {
    unpaidBills.forEach((bill, index) => {
      console.log(`${index + 1}. ${bill.user.fullName}`);
      console.log(`   HP: ${bill.user.phoneNumber}`);
      console.log(`   Alamat: ${bill.user.family?.address || '-'}`);
      console.log(`   Tagihan: Rp ${Number(bill.totalAmount).toLocaleString('id-ID')}`);
      console.log(`   Status: ${bill.status}`);
      console.log(`   Jatuh Tempo: ${bill.dueDate.toLocaleDateString('id-ID')}\n`);
    });
  }

  // 4. Daftar warga LUNAS
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ DAFTAR WARGA LUNAS');
  console.log('═══════════════════════════════════════════════════════\n');

  const paidBills = await prisma.bill.findMany({
    where: {
      period: currentPeriod,
      status: 'LUNAS',
    },
    include: {
      user: {
        select: {
          fullName: true,
          phoneNumber: true,
        },
      },
      payments: {
        where: { isVoided: false },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: {
      user: { fullName: 'asc' },
    },
    take: 10, // Tampilkan 10 pertama
  });

  if (paidBills.length === 0) {
    console.log('Belum ada warga yang lunas.\n');
  } else {
    paidBills.forEach((bill, index) => {
      const lastPayment = bill.payments[0];
      console.log(`${index + 1}. ${bill.user.fullName}`);
      console.log(`   HP: ${bill.user.phoneNumber}`);
      console.log(`   Tagihan: Rp ${Number(bill.totalAmount).toLocaleString('id-ID')}`);
      console.log(`   Dibayar: Rp ${Number(bill.paidAmount).toLocaleString('id-ID')}`);
      if (lastPayment) {
        console.log(`   Tanggal Bayar: ${lastPayment.createdAt.toLocaleDateString('id-ID')}`);
        console.log(`   Metode: ${lastPayment.method}`);
      }
      console.log();
    });

    if (statusMap.LUNAS > 10) {
      console.log(`... dan ${statusMap.LUNAS - 10} warga lainnya\n`);
    }
  }

  // 5. Daftar warga SEBAGIAN
  console.log('═══════════════════════════════════════════════════════');
  console.log('⚠️  DAFTAR WARGA BAYAR SEBAGIAN');
  console.log('═══════════════════════════════════════════════════════\n');

  const partialBills = await prisma.bill.findMany({
    where: {
      period: currentPeriod,
      status: 'SEBAGIAN',
    },
    include: {
      user: {
        select: {
          fullName: true,
          phoneNumber: true,
        },
      },
    },
    orderBy: {
      user: { fullName: 'asc' },
    },
  });

  if (partialBills.length === 0) {
    console.log('Tidak ada warga yang bayar sebagian.\n');
  } else {
    partialBills.forEach((bill, index) => {
      const sisa = Number(bill.totalAmount) - Number(bill.paidAmount);
      const persentase = (Number(bill.paidAmount) / Number(bill.totalAmount) * 100).toFixed(1);
      
      console.log(`${index + 1}. ${bill.user.fullName}`);
      console.log(`   HP: ${bill.user.phoneNumber}`);
      console.log(`   Total Tagihan: Rp ${Number(bill.totalAmount).toLocaleString('id-ID')}`);
      console.log(`   Sudah Dibayar: Rp ${Number(bill.paidAmount).toLocaleString('id-ID')} (${persentase}%)`);
      console.log(`   Sisa: Rp ${sisa.toLocaleString('id-ID')}\n`);
    });
  }

  // 6. Recent payments
  console.log('═══════════════════════════════════════════════════════');
  console.log('💳 PEMBAYARAN TERAKHIR (5 Terbaru)');
  console.log('═══════════════════════════════════════════════════════\n');

  const recentPayments = await prisma.payment.findMany({
    where: {
      bill: { period: currentPeriod },
      isVoided: false,
    },
    include: {
      user: {
        select: {
          fullName: true,
        },
      },
      bill: {
        select: {
          period: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  if (recentPayments.length === 0) {
    console.log('Belum ada pembayaran.\n');
  } else {
    recentPayments.forEach((payment, index) => {
      console.log(`${index + 1}. ${payment.user.fullName}`);
      console.log(`   Jumlah: Rp ${Number(payment.amount).toLocaleString('id-ID')}`);
      console.log(`   Metode: ${payment.method}`);
      console.log(`   Tanggal: ${payment.createdAt.toLocaleString('id-ID')}`);
      if (payment.notes) {
        console.log(`   Catatan: ${payment.notes}`);
      }
      console.log();
    });
  }

  // 7. Export data untuk admin
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 EXPORT DATA (Sample)');
  console.log('═══════════════════════════════════════════════════════\n');

  const allBills = await prisma.bill.findMany({
    where: { period: currentPeriod },
    include: {
      user: {
        select: {
          fullName: true,
          phoneNumber: true,
          family: {
            select: {
              address: true,
            },
          },
        },
      },
    },
    orderBy: {
      user: { fullName: 'asc' },
    },
    take: 5,
  });

  console.log('Nama Warga | No. HP | Alamat | Total | Dibayar | Sisa | Status');
  console.log('─'.repeat(80));
  
  allBills.forEach((bill) => {
    const sisa = Number(bill.totalAmount) - Number(bill.paidAmount);
    console.log(
      `${bill.user.fullName.padEnd(20)} | ` +
      `${bill.user.phoneNumber.padEnd(15)} | ` +
      `${(bill.user.family?.address || '-').substring(0, 15).padEnd(15)} | ` +
      `${Number(bill.totalAmount).toLocaleString('id-ID').padStart(10)} | ` +
      `${Number(bill.paidAmount).toLocaleString('id-ID').padStart(10)} | ` +
      `${sisa.toLocaleString('id-ID').padStart(10)} | ` +
      `${bill.status}`
    );
  });

  console.log('\n... dan seterusnya\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
