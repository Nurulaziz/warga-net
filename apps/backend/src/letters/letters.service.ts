import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { sanitizeHtml, escapeHtml } from '../common/sanitize';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LettersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly notifications: NotificationsService,
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
      gov_logo_url: map['gov_logo_url'] || '',
    };
  }

  private async getLetterNumberSettings() {
    const rows = await this.settingsService.findAll('letter');
    const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return {
      format: map.letter_number_format || '{seq}/RT{rt}/RW{rw}/{month}/{year}',
      padding: Math.min(6, Math.max(1, Number(map.letter_number_padding || 3))),
    };
  }

  // === Templates ===

  async findAllTemplates() {
    return this.prisma.letterTemplate.findMany({ orderBy: { name: 'asc' } });
  }

  async createTemplate(data: {
    name: string;
    type: string;
    content: string;
    description?: string;
  }) {
    return this.prisma.letterTemplate.create({
      data: { ...data, content: sanitizeHtml(data.content) },
    });
  }

  async updateTemplate(
    id: string,
    data: {
      name?: string;
      type?: string;
      content?: string;
      description?: string;
      isActive?: boolean;
    },
  ) {
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

  async findAllLetters(query: {
    page?: number;
    limit?: number;
    status?: string;
    templateId?: string;
    // Scoping: warga hanya melihat surat keluarganya sendiri / yang dibuat oleh dirinya
    familyId?: string;
    userId?: string;
  }) {
    const { page = 1, limit = 20, status, templateId, familyId, userId } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (templateId) where.templateId = templateId;

    if (familyId || userId) {
      const residentIds = familyId
        ? (
            await this.prisma.resident.findMany({
              where: { familyId, deletedAt: null },
              select: { id: true },
            })
          ).map((r) => r.id)
        : [];
      where.OR = [
        ...(residentIds.length > 0 ? [{ residentId: { in: residentIds } }] : []),
        ...(userId ? [{ createdBy: userId }] : []),
      ];
    }

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
    const letter = await this.prisma.letter.findUnique({
      where: { id },
      include: { template: true },
    });
    if (!letter) throw new NotFoundException('Surat tidak ditemukan');
    return letter;
  }

  // Ambil family dari seorang resident (untuk cek kepemilikan surat oleh warga)
  async getResidentFamilyId(residentId: string | null | undefined): Promise<string | null> {
    if (!residentId) return null;
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
      select: { familyId: true },
    });
    return resident?.familyId ?? null;
  }

  // Ambil data resident (untuk memaksa recipientName sesuai data warga / anti-tamper)
  async getResident(residentId: string) {
    return this.prisma.resident.findUnique({ where: { id: residentId } });
  }

  async generateLetter(data: {
    templateId: string;
    residentId?: string;
    recipientName: string;
    purpose?: string;
    letterDate?: string;
    variables?: Record<string, string>;
    createdBy?: string;
  }) {
    const template = await this.prisma.letterTemplate.findUnique({
      where: { id: data.templateId },
    });
    if (!template) throw new NotFoundException('Template tidak ditemukan');

    const rtInfo = await this.getRtInfo();
    const numberSettings = await this.getLetterNumberSettings();

    // Generate nomor surat: XXX/RT##/RW###/BULAN/TAHUN
    const now = new Date();
    const selectedDate = data.letterDate ? new Date(`${data.letterDate}T00:00:00`) : now;
    if (Number.isNaN(selectedDate.getTime())) {
      throw new BadRequestException('Tanggal surat tidak valid');
    }
    const count = await this.prisma.letter.count({
      where: {
        letterDate: {
          gte: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
          lt: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1),
        },
      },
    });
    const num = String(count + 1).padStart(numberSettings.padding, '0');
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const rtNum = rtInfo.rt_name.replace(/\D/g, '').padStart(2, '0');
    const rwNum = rtInfo.rw_name.replace(/\D/g, '').padStart(3, '0');
    const letterNumber = numberSettings.format
      .replace(/\{seq\}/g, num)
      .replace(/\{rt\}/g, rtNum)
      .replace(/\{rw\}/g, rwNum)
      .replace(/\{month\}/g, month)
      .replace(/\{year\}/g, String(selectedDate.getFullYear()));

    // Render content dari template
    let renderedContent = template.content;
    const vars = data.variables || {};
    vars.nama = vars.nama || data.recipientName;
    vars.tanggal =
      vars.tanggal ||
      selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    vars.nomor_surat = letterNumber;
    vars.keperluan = data.purpose || '-';

    // Replace semua placeholder {{key}} — escape values untuk mencegah XSS
    for (const [key, value] of Object.entries(vars)) {
      renderedContent = renderedContent.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        escapeHtml(value),
      );
    }

    const letter = await this.prisma.letter.create({
      data: {
        templateId: data.templateId,
        letterNumber,
        residentId: data.residentId,
        recipientName: data.recipientName,
        content: renderedContent,
        purpose: data.purpose,
        letterDate: selectedDate,
        status: 'draft',
        createdBy: data.createdBy,
      },
      include: { template: true },
    });
    const familyId = await this.getResidentFamilyId(letter.residentId);
    if (familyId) {
      try {
        await this.notifications.notifyFamily(familyId, {
          type: 'letter_created',
          title: 'Surat dibuat',
          message: `${template.name} untuk ${letter.recipientName} telah dibuat.`,
          referenceType: 'letter',
          referenceId: letter.id,
        });
      } catch {
        // Notifikasi tidak boleh menggagalkan pembuatan surat.
      }
    }
    return letter;
  }

  async updateLetterStatus(id: string, status: string) {
    const letter = await this.prisma.letter.findUnique({ where: { id } });
    if (!letter) throw new NotFoundException('Surat tidak ditemukan');

    const updateData: Record<string, unknown> = { status };
    if (status === 'signed') {
      updateData.issuedAt = new Date();
    }

    const updated = await this.prisma.letter.update({ where: { id }, data: updateData });
    if (status === 'signed') {
      const familyId = await this.getResidentFamilyId(updated.residentId);
      if (familyId) {
        try {
          await this.notifications.notifyFamily(familyId, {
            type: 'letter_signed',
            title: 'Surat siap digunakan',
            message: `Surat ${updated.letterNumber} telah ditandatangani.`,
            referenceType: 'letter',
            referenceId: updated.id,
          });
        } catch {
          // Notifikasi tidak boleh menggagalkan pembaruan surat.
        }
      }
    }
    return updated;
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
    const headerComplex = rtInfo.housing_complex
      ? `<h3>Perumahan ${escapeHtml(rtInfo.housing_complex)}</h3>`
      : '';
    const signerTitle = rtInfo.ketua_rt ? escapeHtml(rtInfo.ketua_rt) : `Ketua ${rtInfo.rt_name}`;
    const governmentLogo = rtInfo.gov_logo_url
      ? `<div class="header-logo"><img src="${escapeHtml(rtInfo.gov_logo_url)}" alt="Logo pemerintah atau lingkungan"></div>`
      : '<div class="header-logo"></div>';

    // Wrap content dalam HTML template untuk cetak
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 40px; }
    .header { display: grid; grid-template-columns: 72px 1fr 72px; align-items: center; text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
    .header-logo { width: 72px; display: flex; align-items: center; justify-content: center; }
    .header-logo img { display: block; max-width: 64px; max-height: 64px; object-fit: contain; }
    .header-copy { min-width: 0; }
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
    ${governmentLogo}
    <div class="header-copy">
      <h2>${headerTitle}</h2>
      <h3>${headerSubtitle}</h3>
      ${headerComplex}
    </div>
    <div class="header-logo"></div>
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
      <p>${escapeHtml(rtInfo.kabupaten)}, ${new Date(letter.letterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p>${signerTitle}</p>
      <br><br><br>
      <p>____________________</p>
    </div>
  </div>
</body>
</html>`;
  }
}
