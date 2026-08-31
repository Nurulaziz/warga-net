import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportResidentsCsv(): Promise<string> {
    const residents = await this.prisma.resident.findMany({
      where: { deletedAt: null },
      include: { family: true },
      orderBy: [{ family: { headOfFamily: 'asc' } }, { fullName: 'asc' }],
    });

    const header =
      'No,Nama Lengkap,NIK,Tanggal Lahir,Jenis Kelamin,Hubungan,Kepala Keluarga,Alamat,RT,RW';
    const rows = residents.map((r, i) => {
      const dob = new Date(r.birthDate).toLocaleDateString('id-ID');
      return `${i + 1},"${r.fullName}","${r.idNumber}","${dob}","${r.gender}","${r.relationship}","${r.family.headOfFamily}","${r.family.address}","${r.family.rt}","${r.family.rw}"`;
    });

    return [header, ...rows].join('\n');
  }

  async exportFamiliesCsv(): Promise<string> {
    const families = await this.prisma.family.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { residents: true } } },
      orderBy: { headOfFamily: 'asc' },
    });

    const header = 'No,Kepala Keluarga,Alamat,Perumahan,RT,RW,Kelurahan,Kecamatan,Jumlah Anggota';
    const rows = families.map((f, i) => {
      return `${i + 1},"${f.headOfFamily}","${f.address}","${f.housingComplex}","${f.rt}","${f.rw}","${f.kelurahan}","${f.kecamatan}",${f._count.residents}`;
    });

    return [header, ...rows].join('\n');
  }

  async exportBillsCsv(period?: string): Promise<string> {
    const where: Record<string, unknown> = {};
    if (period) where.period = period;

    const bills = await this.prisma.bill.findMany({
      where,
      include: { family: true, billType: true, payments: true },
      orderBy: [{ period: 'desc' }, { family: { headOfFamily: 'asc' } }],
    });

    const header =
      'No,Periode,Jenis Iuran,Kepala Keluarga,Nominal,Status,Total Dibayar,Tanggal Bayar';
    const rows = bills.map((b, i) => {
      const totalPaid = b.payments.reduce((sum, p) => sum + p.amount, 0);
      const lastPaid =
        b.payments.length > 0
          ? new Date(b.payments[b.payments.length - 1].paidAt).toLocaleDateString('id-ID')
          : '-';
      const status =
        b.status === 'paid' ? 'Lunas' : b.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Bayar';
      return `${i + 1},"${b.period}","${b.billType.name}","${b.family.headOfFamily}",${b.amount},"${status}",${totalPaid},"${lastPaid}"`;
    });

    return [header, ...rows].join('\n');
  }

  async exportCashCsv(month?: string): Promise<string> {
    const where: Record<string, unknown> = {};
    if (month) {
      const start = new Date(`${month}-01`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }

    const transactions = await this.prisma.cashTransaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    const header = 'No,Tanggal,Tipe,Kategori,Deskripsi,Nominal';
    const rows = transactions.map((t, i) => {
      const date = new Date(t.date).toLocaleDateString('id-ID');
      const tipe = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      return `${i + 1},"${date}","${tipe}","${t.category.name}","${t.description}",${t.amount}`;
    });

    return [header, ...rows].join('\n');
  }
}
