import { PrismaClient, BillStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function addInitialBalance() {
  try {
    console.log('🔍 Checking current balance...');

    // Get total income
    const totalIncome = await prisma.payment.aggregate({
      where: { isVoided: false },
      _sum: { amount: true },
    });

    // Get total expenses
    const totalExpenses = await prisma.expense.aggregate({
      where: { isVoided: false },
      _sum: { amount: true },
    });

    const income = Number(totalIncome._sum.amount || 0);
    const expenses = Number(totalExpenses._sum.amount || 0);
    const currentBalance = income - expenses;

    console.log(`💰 Total Pemasukan: Rp ${income.toLocaleString()}`);
    console.log(`💸 Total Pengeluaran: Rp ${expenses.toLocaleString()}`);
    console.log(`📊 Saldo Saat Ini: Rp ${currentBalance.toLocaleString()}`);

    if (currentBalance >= 0) {
      console.log('✅ Saldo sudah positif, tidak perlu menambah balance');
      return;
    }

    // Get first user (admin)
    const admin = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: { name: 'SUPER_ADMIN' } },
          { role: { name: 'ADMIN_RT' } },
        ]
      },
    });

    if (!admin) {
      console.error('❌ Admin user tidak ditemukan');
      return;
    }

    // Get first bill to associate payment
    const bill = await prisma.bill.findFirst();

    if (!bill) {
      console.error('❌ Bill tidak ditemukan');
      return;
    }

    // Add payment to make balance positive
    const amountNeeded = Math.abs(currentBalance) + 10000000; // Add 10 juta extra
    
    console.log(`\n💵 Menambahkan payment sebesar Rp ${amountNeeded.toLocaleString()}...`);

    const payment = await prisma.payment.create({
      data: {
        billId: bill.id,
        amount: amountNeeded,
        method: 'CASH',
        notes: 'Initial balance untuk development',
        userId: admin.id,
      },
    });

    console.log(`✅ Payment berhasil ditambahkan (ID: ${payment.id})`);

    // Calculate new paid amount
    const newPaidAmount = Number(bill.paidAmount) + amountNeeded;
    const billTotalAmount = Number(bill.totalAmount);

    // Determine status
    let newStatus: BillStatus = BillStatus.SEBAGIAN;
    if (newPaidAmount >= billTotalAmount) {
      newStatus = BillStatus.LUNAS;
    }

    // Update bill status
    await prisma.bill.update({
      where: { id: bill.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    const newBalance = currentBalance + amountNeeded;
    console.log(`\n📊 Saldo Baru: Rp ${newBalance.toLocaleString()}`);
    console.log('✅ Selesai!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addInitialBalance();
