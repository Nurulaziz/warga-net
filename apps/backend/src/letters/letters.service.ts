import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { sanitizeHtml, escapeHtml } from '../common/sanitize';

@Injectable()
export class LettersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  // Helper: ambil info RT/RW dari settings
  private async getRtInfo(): Promise<Record<string, string>> {
    const settings = await this.settingsService.findAll('rt_info');
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return {
      rt_name: map['rt_name'] || 'RT 04',
      rw_name: map['rw_name'] || 'RW 010',
      kelurahan: map['kelurahan'] || 'Satriamekar',
      kecamatan: map['kecamatan'] || 'Tambun Utara',
      kabupaten: map['kabupaten'] || 'Bekasi',
      provinsi: map['provinsi'] || 'Jawa Barat',
      housing_complex: map['housing_complex'] || '',
      ketua_rt: map['ketua_rt'] || '',
      app_name: map['app_name'] || 'WargaNet',
    };
  }

  // === Templates ===

  async findAllTemplates() {
    return this.prisma.letterTemplate.findMany({ orderBy: { name: 'asc' } });
  }

  async createTemplate(data: { name: string; type: string; content: string; description?: string }) {
    return this.prisma.letterTemplate.create({
      data: { ...data, content: sanitizeHtml(data.content) },
    });
  }

  async updateTemplate(id: string, data: { name?: string; type?: string; content?: string; description?: string; isActive?: boolean }) {
    const template = await this.prisma.letterTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template tidak ditemukan');
    const updateData = { ...data };
    if (data.content) updateData.content = sanitizeHtml(data.content);
    return this.prisma.letterTemplate.update({ where: { id }, data: updateData });
  }

  async deleteTemplate(id: string) {
    const template = await this.prisma.letterTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template tidak ditemukan');
    return this.prisma.letterTemplate.update({ where: { id }, data: { isActive: false } });
  }

  // === Letters ===

  async findAllLetters(query: { page?: number; limit?: number; status?: string; templateId?: string }) {
    const { page = 1, limit = 20, status, templateId } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (templateId) where.templateId = templateId;

    const [data, total] = await Promise.all([
      this.prisma.letter.findMany({
        where,
        skip,
        take: limit,
        include: { template: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.letter.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOneLetter(id: string) {
    const letter = await this.prisma.letter.findUnique({ where: { id }, include: { template: true } });
    if (!letter) throw new NotFoundException('Surat tidak ditemukan');
    return letter;
  }

  async generateLetter(data: { templateId: string; residentId?: string; recipientName: string; purpose?: string; variables?: Record<string, string>; createdBy?: string }) {
    const template = await this.prisma.letterTemplate.findUnique({ where: { id: data.templateId } });
    if (!template) throw new NotFoundException('Template tidak ditemukan');

    const rtInfo = await this.getRtInfo();

    // Generate nomor surat: XXX/RT##/RW###/BULAN/TAHUN
    const now = new Date();
    const count = await this.prisma.letter.count({
      where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
    });
    const num = String(count + 1).padStart(3, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const rtNum = rtInfo.rt_name.replace(/\D/g, '').padStart(2, '0');
    const rwNum = rtInfo.rw_name.replace(/\D/g, '').padStart(3, '0');
    const letterNumber = `${num}/RT${rtNum}/RW${rwNum}/${month}/${now.getFullYear()}`;

    // Render content dari template
    let renderedContent = template.content;
    const vars = data.variables || {};
    vars.nama = vars.nama || data.recipientName;
    vars.tanggal = vars.tanggal || now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    vars.nomor_surat = letterNumber;
    vars.keperluan = data.purpose || '-';

    // Replace semua placeholder {{key}} — escape values untuk mencegah XSS
    for (const [key, value] of Object.entries(vars)) {
      renderedContent = renderedContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), escapeHtml(value));
    }

    return this.prisma.letter.create({
      data: {
        templateId: data.templateId,
        letterNumber,
        residentId: data.residentId,
        recipientName: data.recipientName,
        content: renderedContent,
        purpose: data.purpose,
        status: 'draft',
        createdBy: data.createdBy,
      },
      include: { template: true },
    });
  }

  async updateLetterStatus(id: string, status: string) {
    const letter = await this.prisma.letter.findUnique({ where: { id } });
    if (!letter) throw new NotFoundException('Surat tidak ditemukan');

    const updateData: Record<string, unknown> = { status };
    if (status === 'signed') {
      updateData.issuedAt = new Date();
    }

    return this.prisma.letter.update({ where: { id }, data: updateData });
  }

  async deleteLetter(id: string) {
    const letter = await this.prisma.letter.findUnique({ where: { id } });
    if (!letter) throw new NotFoundException('Surat tidak ditemukan');
    return this.prisma.letter.delete({ where: { id } });
  }

  // === PDF HTML ===

  async getLetterHtml(id: string): Promise<string> {
    const letter = await this.findOneLetter(id);
    const rtInfo = await this.getRtInfo();

    const rtNum = rtInfo.rt_name.replace(/\D/g, '').padStart(2, '0');
    const rwNum = rtInfo.rw_name.replace(/\D/g, '').padStart(3, '0');
    const headerTitle = `RUKUN TETANGGA ${rtNum} / RUKUN WARGA ${rwNum}`;
    const headerSubtitle = `Kelurahan ${rtInfo.kelurahan}, Kec. ${rtInfo.kecamatan}, Kab. ${rtInfo.kabupaten}`;
    const headerComplex = rtInfo.housing_complex ? `<h3>Perumahan ${escapeHtml(rtInfo.housing_complex)}</h3>` : '';
    const signerTitle = rtInfo.ketua_rt ? escapeHtml(rtInfo.ketua_rt) : `Ketua ${rtInfo.rt_name}`;

    // Wrap content dalam HTML template untuk cetak
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 40px; }
    .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
    .header h2 { margin: 0; font-size: 14pt; }
    .header h3 { margin: 5px 0; font-size: 12pt; font-weight: normal; }
    .letter-number { text-align: center; margin: 20px 0; }
    .content { text-align: justify; }
    .footer { margin-top: 40px; }
    .signature { float: right; text-align: center; width: 200px; }
    @media print { body { margin: 20mm; } }
  </style>
</head>
<body>
  <div class="header">
    <h2>${headerTitle}</h2>
    <h3>${headerSubtitle}</h3>
    ${headerComplex}
  </div>
  <div class="letter-number">
    <strong>${letter.template.name.toUpperCase()}</strong><br>
    Nomor: ${letter.letterNumber}
  </div>
  <div class="content">
    ${letter.content}
  </div>
  <div class="footer">
    <div class="signature">
      <p>${escapeHtml(rtInfo.kabupaten)}, ${new Date(letter.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p>${signerTitle}</p>
      <br><br><br>
      <p>____________________</p>
    </div>
  </div>
</body>
</html>`;
  }
}
