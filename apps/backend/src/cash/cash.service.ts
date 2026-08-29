import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashService {
  constructor(private readonly prisma: PrismaService) {}

  // === Categories ===

  async findAllCategories() {
    return this.prisma.cashCategory.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] });
  }

  async createCategory(data: { name: string; type: string; description?: string }) {
    const existing = await this.prisma.cashCategory.findUnique({
      where: { name_type: { name: data.name, type: data.type } },
    });
    if (existing) throw new ConflictException('Kategori sudah ada');
    return this.prisma.cashCategory.create({ data });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.cashCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Kategori tidak ditemukan');

    // Cek apakah masih ada transaksi
    const count = await this.prisma.cashTransaction.count({ where: { categoryId: id } });
    if (count > 0) throw new ConflictException('Kategori masih memiliki transaksi');

    return this.prisma.cashCategory.delete({ where: { id } });
  }

  // === Transactions ===

  async findAllTransactions(query: { page?: number; limit?: number; type?: string; categoryId?: string; startDate?: string; endDate?: string }) {
    const { page = 1, limit = 20, type, categoryId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.cashTransaction.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.cashTransaction.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createTransaction(data: { categoryId: string; type: string; amount: number; description: string; date?: string; createdBy?: string }) {
    return this.prisma.cashTransaction.create({
      data: {
        categoryId: data.categoryId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        createdBy: data.createdBy,
      },
      include: { category: true },
    });
  }

  async updateTransaction(id: string, data: { categoryId?: string; type?: string; amount?: number; description?: string; date?: string }) {
    const tx = await this.prisma.cashTransaction.findUnique({ where: { id } });
    if (!tx) throw new NotFoundException('Transaksi tidak ditemukan');

    const updateData: Record<string, unknown> = { ...data };
    if (data.date) updateData.date = new Date(data.date);

    return this.prisma.cashTransaction.update({ where: { id }, data: updateData, include: { category: true } });
  }

  async deleteTransaction(id: string) {
    const tx = await this.prisma.cashTransaction.findUnique({ where: { id } });
    if (!tx) throw new NotFoundException('Transaksi tidak ditemukan');
    return this.prisma.cashTransaction.delete({ where: { id } });
  }

  // === Summary ===

  async getSummary(month?: string) {
    const where: Record<string, unknown> = {};

    if (month) {
      // Format: "2025-01"
      const start = new Date(`${month}-01`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }

    const [incomeAgg, expenseAgg, totalIncomeAgg, totalExpenseAgg] = await Promise.all([
      this.prisma.cashTransaction.aggregate({ where: { ...where, type: 'income' }, _sum: { amount: true } }),
      this.prisma.cashTransaction.aggregate({ where: { ...where, type: 'expense' }, _sum: { amount: true } }),
      this.prisma.cashTransaction.aggregate({ where: { type: 'income' }, _sum: { amount: true } }),
      this.prisma.cashTransaction.aggregate({ where: { type: 'expense' }, _sum: { amount: true } }),
    ]);

    const totalIncome = totalIncomeAgg._sum.amount || 0;
    const totalExpense = totalExpenseAgg._sum.amount || 0;

    return {
      monthIncome: incomeAgg._sum.amount || 0,
      monthExpense: expenseAgg._sum.amount || 0,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }
}
