import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MidtransService, MidtransNotification } from '../midtrans/midtrans.service';
import { SettingsService } from '../settings/settings.service';

// Cek apakah sebuah payment dianggap benar-benar lunas (bukan pending/gagal).
// Manual cash/transfer selalu dianggap sah; Midtrans hanya jika settlement/capture.
function isSettledPayment(payment: { method: string; transactionStatus: string | null }): boolean {
  if (payment.method === 'cash' || payment.method === 'transfer') return true;
  return payment.transactionStatus === 'settlement' || payment.transactionStatus === 'capture';
}

// Batasi tanggal ke rentang aman 1-28 (agar valid di semua bulan)
function clampDay(day: number): number {
  return Math.min(Math.max(Math.trunc(day) || 1, 1), 28);
}

@Injectable()
export class BillsService {
  private readonly logger = new Logger(BillsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly midtransService: MidtransService,
    private readonly settingsService: SettingsService,
  ) {}

  // === Bill Types ===

  async findAllBillTypes() {
    return this.prisma.billType.findMany({ orderBy: { name: 'asc' } });
  }

  async createBillType(data: {
    name: string;
    amount: number;
    period?: string;
    description?: string;
    autoGenerate?: boolean;
    generateDay?: number;
    dueDay?: number;
  }) {
    const existing = await this.prisma.billType.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Jenis iuran sudah ada');

    // Default dueDay dari setting global jika tidak diisi
    let dueDay = data.dueDay;
    if (dueDay == null) {
      const raw = await this.settingsService.get('bill_due_day');
      dueDay = parseInt(raw || '10', 10) || 10;
    }

    return this.prisma.billType.create({
      data: {
        ...data,
        generateDay: data.generateDay != null ? clampDay(data.generateDay) : undefined,
        dueDay: clampDay(dueDay),
      },
    });
  }

  async updateBillType(
    id: string,
    data: {
      name?: string;
      amount?: number;
      period?: string;
      description?: string;
      isActive?: boolean;
      autoGenerate?: boolean;
      generateDay?: number;
      dueDay?: number;
    },
  ) {
    const billType = await this.prisma.billType.findUnique({ where: { id } });
    if (!billType) throw new NotFoundException('Jenis iuran tidak ditemukan');
    return this.prisma.billType.update({
      where: { id },
      data: {
        ...data,
        generateDay: data.generateDay != null ? clampDay(data.generateDay) : undefined,
        dueDay: data.dueDay != null ? clampDay(data.dueDay) : undefined,
      },
    });
  }

  async deleteBillType(id: string) {
    const billType = await this.prisma.billType.findUnique({ where: { id } });
    if (!billType) throw new NotFoundException('Jenis iuran tidak ditemukan');
    return this.prisma.billType.update({ where: { id }, data: { isActive: false } });
  }

  // === Bills ===

  async findAllBills(query: {
    page?: number;
    limit?: number;
    status?: string;
    period?: string;
    familyId?: string;
    billTypeId?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, period, familyId, billTypeId, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (period) where.period = period;
    if (familyId) where.familyId = familyId;
    if (billTypeId) where.billTypeId = billTypeId;
    // Cari berdasarkan nama kepala keluarga
    if (search) {
      where.family = { headOfFamily: { contains: search, mode: 'insensitive' } };
    }

    const [data, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        skip,
        take: limit,
        include: { billType: true, family: true, payments: true },
        orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.bill.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async generateBills(billTypeId: string, period: string, dueDate: string) {
    // Generate tagihan untuk semua keluarga aktif
    const billType = await this.prisma.billType.findUnique({ where: { id: billTypeId } });
    if (!billType) throw new NotFoundException('Jenis iuran tidak ditemukan');

    const families = await this.prisma.family.findMany({ where: { deletedAt: null } });

    let created = 0;
    let skipped = 0;

    for (const family of families) {
      try {
        await this.prisma.bill.create({
          data: {
            billTypeId,
            familyId: family.id,
            amount: billType.amount,
            dueDate: new Date(dueDate),
            period,
            status: 'unpaid',
          },
        });
        created++;
      } catch {
        // Skip jika tagihan sudah ada (unique constraint)
        skipped++;
      }
    }

    return { created, skipped, total: families.length };
  }

  // Hitung periode berjalan "YYYY-MM"
  private currentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Jalankan generate untuk sekumpulan jenis iuran, masing-masing pakai dueDay-nya sendiri.
  private async generateForTypes(
    types: { id: string; name: string; dueDay: number }[],
    period: string,
  ) {
    const [year, month] = period.split('-').map((v) => parseInt(v, 10));

    let totalCreated = 0;
    let totalSkipped = 0;
    const perType: { billTypeId: string; name: string; created: number; skipped: number }[] = [];

    for (const billType of types) {
      // month di period berbasis 1; Date bulan berbasis 0
      const dueDate = new Date(year, month - 1, clampDay(billType.dueDay));
      const result = await this.generateBills(billType.id, period, dueDate.toISOString());
      totalCreated += result.created;
      totalSkipped += result.skipped;
      perType.push({
        billTypeId: billType.id,
        name: billType.name,
        created: result.created,
        skipped: result.skipped,
      });
    }

    return { totalCreated, totalSkipped, perType };
  }

  // Generate tagihan untuk SEMUA jenis iuran bulanan aktif pada periode berjalan
  // (dipakai tombol manual "Generate Bulan Ini"). Idempoten.
  async generateMonthlyBills(targetPeriod?: string) {
    const period = targetPeriod || this.currentPeriod();

    const monthlyTypes = await this.prisma.billType.findMany({
      where: { period: 'monthly', isActive: true },
    });

    const { totalCreated, totalSkipped, perType } = await this.generateForTypes(
      monthlyTypes,
      period,
    );

    return {
      period,
      billTypes: monthlyTypes.length,
      totalCreated,
      totalSkipped,
      perType,
    };
  }

  // Generate hanya jenis iuran yang generateDay-nya == tanggal hari ini (dipakai cron harian).
  async generateDueBillsForToday(dayOfMonth: number) {
    const period = this.currentPeriod();

    const dueTypes = await this.prisma.billType.findMany({
      where: {
        period: 'monthly',
        isActive: true,
        autoGenerate: true,
        generateDay: dayOfMonth,
      },
    });

    if (dueTypes.length === 0) {
      return { period, billTypes: 0, totalCreated: 0, totalSkipped: 0, perType: [] };
    }

    const { totalCreated, totalSkipped, perType } = await this.generateForTypes(dueTypes, period);
    return { period, billTypes: dueTypes.length, totalCreated, totalSkipped, perType };
  }

  // === Payments ===

  async recordPayment(data: {
    billId: string;
    amount: number;
    paidBy?: string;
    method?: string;
    note?: string;
    receivedBy?: string;
  }) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: data.billId },
      include: { payments: true },
    });
    if (!bill) throw new NotFoundException('Tagihan tidak ditemukan');

    const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0) + data.amount;

    // Buat payment
    const payment = await this.prisma.payment.create({ data });

    // Update status tagihan
    const newStatus = totalPaid >= bill.amount ? 'paid' : 'unpaid';
    await this.prisma.bill.update({ where: { id: data.billId }, data: { status: newStatus } });

    // Pembayaran manual (cash/transfer) langsung dianggap sah -> catat ke Kas RT
    await this.recordBillPaymentToCash(payment.id);

    return payment;
  }

  // Catat pembayaran iuran ke Kas RT sebagai pemasukan (kategori "Iuran Warga").
  // Idempoten: satu payment hanya menghasilkan satu CashTransaction (via paymentId unik).
  async recordBillPaymentToCash(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { bill: { include: { billType: true, family: true } } },
    });
    if (!payment) return;

    // Hanya pembayaran yang benar-benar sah yang masuk kas
    if (!isSettledPayment(payment)) return;

    // Sudah pernah dicatat? (anti-duplikat)
    const existing = await this.prisma.cashTransaction.findUnique({ where: { paymentId } });
    if (existing) return;

    // Pastikan kategori "Iuran Warga" (income) ada
    const category = await this.prisma.cashCategory.upsert({
      where: { name_type: { name: 'Iuran Warga', type: 'income' } },
      update: {},
      create: {
        name: 'Iuran Warga',
        type: 'income',
        description: 'Pemasukan dari iuran warga',
      },
    });

    const familyName = payment.bill.family?.headOfFamily || 'Warga';
    const billName = payment.bill.billType?.name || 'Iuran';
    const period = payment.bill.period;

    try {
      await this.prisma.cashTransaction.create({
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
    } catch (error) {
      // Race: entri sudah dibuat proses lain (unique paymentId) — aman diabaikan
      this.logger.warn(`Kas untuk payment ${paymentId} sudah ada / gagal dibuat: ${error}`);
    }
  }

  // Hapus pembayaran + entri kas terkait, lalu hitung ulang status tagihan.
  // Semua dalam satu transaksi agar konsisten.
  async deletePayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');

    const billId = payment.billId;

    await this.prisma.$transaction(async (tx) => {
      // Hapus entri kas yang tertaut (jika ada)
      await tx.cashTransaction.deleteMany({ where: { paymentId } });

      // Hapus pembayaran
      await tx.payment.delete({ where: { id: paymentId } });

      // Hitung ulang status tagihan berdasarkan pembayaran yang tersisa
      const bill = await tx.bill.findUnique({
        where: { id: billId },
        include: { payments: true },
      });
      if (bill) {
        const totalPaid = bill.payments
          .filter((p) => isSettledPayment(p))
          .reduce((sum, p) => sum + p.amount, 0);
        const newStatus = totalPaid >= bill.amount ? 'paid' : 'unpaid';
        await tx.bill.update({ where: { id: billId }, data: { status: newStatus } });
      }
    });

    return { success: true, billId };
  }

  async findPayments(query: { page?: number; limit?: number; billId?: string }) {
    const { page = 1, limit = 50, billId } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (billId) where.billId = billId;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: { bill: { include: { family: true, billType: true } } },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // === Summary ===

  // Ambil satu tagihan (untuk cek kepemilikan sebelum pembayaran)
  async findBillById(billId: string) {
    return this.prisma.bill.findUnique({ where: { id: billId } });
  }

  async getSummary(period?: string, familyId?: string) {
    const where: Record<string, unknown> = {};
    if (period) where.period = period;
    if (familyId) where.familyId = familyId;

    const [totalBills, paidBills, unpaidBills] = await Promise.all([
      this.prisma.bill.count({ where }),
      this.prisma.bill.count({ where: { ...where, status: 'paid' } }),
      this.prisma.bill.count({ where: { ...where, status: 'unpaid' } }),
    ]);

    const totalAmount = await this.prisma.bill.aggregate({ where, _sum: { amount: true } });
    const paidAmount = await this.prisma.bill.aggregate({
      where: { ...where, status: 'paid' },
      _sum: { amount: true },
    });

    return {
      totalBills,
      paidBills,
      unpaidBills,
      totalAmount: totalAmount._sum.amount || 0,
      paidAmount: paidAmount._sum.amount || 0,
      unpaidAmount: (totalAmount._sum.amount || 0) - (paidAmount._sum.amount || 0),
    };
  }

  // === Midtrans Payment ===

  // Buat Snap transaction untuk pembayaran online
  async createSnapTransaction(billId: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
      include: { billType: true, family: true, payments: true },
    });
    if (!bill) throw new NotFoundException('Tagihan tidak ditemukan');
    if (bill.status === 'paid') throw new BadRequestException('Tagihan sudah lunas');

    // Hitung sisa: hanya pembayaran yang benar-benar berhasil yang dihitung.
    // Payment 'pending' (Snap dibuat tapi belum dibayar) TIDAK dihitung.
    const totalPaid = bill.payments
      .filter((p) => isSettledPayment(p))
      .reduce((sum, p) => sum + p.amount, 0);
    const remaining = bill.amount - totalPaid;
    if (remaining <= 0) throw new BadRequestException('Tagihan sudah lunas');

    // Bersihkan payment pending lama untuk bill ini agar tidak menumpuk
    await this.prisma.payment.deleteMany({
      where: { billId: bill.id, method: 'midtrans', transactionStatus: 'pending' },
    });

    // Generate unique order ID
    const orderId = `WN-${bill.id.slice(0, 8)}-${Date.now()}`;

    // Buat Snap token via Midtrans
    const snap = await this.midtransService.createTransaction({
      orderId,
      grossAmount: remaining,
      customerName: bill.family.headOfFamily,
      itemName: `${bill.billType.name} - ${bill.period}`,
      itemId: bill.billType.id,
    });

    // Simpan payment record dengan status pending
    await this.prisma.payment.create({
      data: {
        billId: bill.id,
        amount: remaining,
        method: 'midtrans',
        orderId,
        snapToken: snap.token,
        transactionStatus: 'pending',
        paidBy: bill.family.headOfFamily,
      },
    });

    return {
      token: snap.token,
      redirectUrl: snap.redirect_url,
      orderId,
      amount: remaining,
      clientKey: this.midtransService.getClientKey(),
      isProduction: this.midtransService.getIsProduction(),
    };
  }

  // Handle notification dari Midtrans (webhook)
  async handleMidtransNotification(notification: MidtransNotification) {
    // Verifikasi signature
    const isValid = this.midtransService.verifyNotificationSignature(notification);
    if (!isValid) {
      this.logger.warn(`Invalid Midtrans signature for order ${notification.order_id}`);
      throw new BadRequestException('Invalid notification signature');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { orderId: notification.order_id },
    });
    if (!payment) {
      this.logger.warn(`Payment not found for order ${notification.order_id}`);
      return { status: 'ignored', message: 'Payment not found' };
    }

    await this.applyNotification(notification);
    return { status: 'ok', transaction_status: notification.transaction_status };
  }

  // Terapkan status transaksi Midtrans ke payment + bill (dipakai webhook & verifyPayment)
  private async applyNotification(notification: MidtransNotification) {
    const { order_id, transaction_status, payment_type, transaction_id } = notification;

    const payment = await this.prisma.payment.findUnique({ where: { orderId: order_id } });
    if (!payment) return;

    const isSuccess = this.midtransService.isTransactionSuccess(notification);
    await this.prisma.payment.update({
      where: { orderId: order_id },
      data: {
        transactionId: transaction_id,
        paymentType: payment_type,
        transactionStatus: transaction_status,
        referenceNo: order_id,
        paidAt: isSuccess ? new Date() : payment.paidAt,
      },
    });

    if (isSuccess) {
      const bill = await this.prisma.bill.findUnique({
        where: { id: payment.billId },
        include: { payments: true },
      });

      if (bill) {
        // Hitung total terbayar; payment yang baru sukses ini ikut dihitung
        const totalPaid = bill.payments.reduce((sum, p) => {
          if (p.id === payment.id) return sum + p.amount;
          if (isSettledPayment(p)) return sum + p.amount;
          return sum;
        }, 0);

        const newStatus = totalPaid >= bill.amount ? 'paid' : 'unpaid';
        await this.prisma.bill.update({ where: { id: bill.id }, data: { status: newStatus } });
      }
      // Pembayaran online sukses -> catat ke Kas RT (idempoten)
      await this.recordBillPaymentToCash(payment.id);
      this.logger.log(`Payment settled: ${order_id} via ${payment_type}`);
    } else if (this.midtransService.isTransactionFailed(notification)) {
      this.logger.log(`Payment failed/expired: ${order_id} (${transaction_status})`);
    }
  }

  // Verifikasi pembayaran sebuah bill langsung ke Midtrans (fallback tanpa webhook).
  // Mengecek payment pending terbaru untuk bill, tanya status ke Midtrans, lalu update.
  async verifyPayment(billId: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id: billId } });
    if (!bill) throw new NotFoundException('Tagihan tidak ditemukan');

    // Ambil payment Midtrans terbaru untuk bill ini
    const payment = await this.prisma.payment.findFirst({
      where: { billId, method: 'midtrans', orderId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment?.orderId) {
      return { status: bill.status, message: 'Tidak ada transaksi online untuk tagihan ini' };
    }

    const notification = await this.midtransService.getTransactionStatus(payment.orderId);
    if (!notification) {
      return { status: bill.status, message: 'Transaksi belum ditemukan di Midtrans' };
    }

    await this.applyNotification(notification);

    const updated = await this.prisma.bill.findUnique({ where: { id: billId } });
    return {
      status: updated?.status || bill.status,
      transactionStatus: notification.transaction_status,
    };
  }

  // Get Midtrans config (untuk frontend)
  getMidtransConfig() {
    return {
      clientKey: this.midtransService.getClientKey(),
      isProduction: this.midtransService.getIsProduction(),
    };
  }
}
