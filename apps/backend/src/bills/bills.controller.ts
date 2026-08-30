import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AllowAnonymous, Session, UserSession } from '@thallesp/nestjs-better-auth';
import { BillsService } from './bills.service';
import { UsersService } from '../users/users.service';
import { getSessionPhoneNumber } from '../common/session.util';

// Folder upload bukti bayar
const PROOF_UPLOAD_DIR = join(process.cwd(), 'uploads', 'payments');

// Pastikan folder ada
if (!existsSync(PROOF_UPLOAD_DIR)) {
  mkdirSync(PROOF_UPLOAD_DIR, { recursive: true });
}

@ApiTags('Bills & Payments')
@ApiBearerAuth()
@Controller('bills')
export class BillsController {
  constructor(
    private readonly billsService: BillsService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveScope(session: UserSession) {
    const phoneNumber = getSessionPhoneNumber(session);
    return this.usersService.resolveAuthContext(phoneNumber);
  }

  // === Bill Types (admin only) ===

  @Get('types')
  @ApiOperation({ summary: 'Get all bill types' })
  findAllBillTypes() {
    return this.billsService.findAllBillTypes();
  }

  @Post('types')
  @ApiOperation({ summary: 'Create bill type' })
  async createBillType(
    @Body()
    body: {
      name: string;
      amount: number;
      period?: string;
      description?: string;
      autoGenerate?: boolean;
      generateDay?: number;
      dueDay?: number;
    },
    @Session() session: UserSession,
  ) {
    await this.assertAdmin(session);
    return this.billsService.createBillType(body);
  }

  @Put('types/:id')
  @ApiOperation({ summary: 'Update bill type' })
  async updateBillType(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      amount?: number;
      period?: string;
      description?: string;
      isActive?: boolean;
      autoGenerate?: boolean;
      generateDay?: number;
      dueDay?: number;
    },
    @Session() session: UserSession,
  ) {
    await this.assertAdmin(session);
    return this.billsService.updateBillType(id, body);
  }

  @Delete('types/:id')
  @ApiOperation({ summary: 'Deactivate bill type' })
  async deleteBillType(@Param('id') id: string, @Session() session: UserSession) {
    await this.assertAdmin(session);
    return this.billsService.deleteBillType(id);
  }

  // === Bills ===

  @Get()
  @ApiOperation({ summary: 'Get all bills with filters' })
  async findAllBills(
    @Session() session: UserSession,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('period') period?: string,
    @Query('familyId') familyId?: string,
    @Query('billTypeId') billTypeId?: string,
    @Query('search') search?: string,
  ) {
    const scope = await this.resolveScope(session);
    // Warga hanya melihat tagihan keluarganya sendiri
    const effectiveFamilyId = scope.isAdmin ? familyId : scope.familyId || '__none__';

    return this.billsService.findAllBills({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      period,
      familyId: effectiveFamilyId,
      billTypeId,
      // Pencarian nama hanya untuk admin (warga sudah dibatasi ke keluarganya)
      search: scope.isAdmin ? search : undefined,
    });
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate bills for all families' })
  async generateBills(
    @Body() body: { billTypeId: string; period: string; dueDate: string },
    @Session() session: UserSession,
  ) {
    await this.assertAdmin(session);
    return this.billsService.generateBills(body.billTypeId, body.period, body.dueDate);
  }

  @Post('generate-monthly')
  @ApiOperation({
    summary: 'Generate bills for all active monthly bill types (current or given period)',
  })
  async generateMonthly(@Session() session: UserSession, @Body() body?: { period?: string }) {
    await this.assertAdmin(session);
    return this.billsService.generateMonthlyBills(body?.period);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get bills summary' })
  async getSummary(@Session() session: UserSession, @Query('period') period?: string) {
    const scope = await this.resolveScope(session);
    // Warga hanya melihat ringkasan tagihan keluarganya sendiri
    const familyId = scope.isAdmin ? undefined : scope.familyId || '__none__';
    return this.billsService.getSummary(period, familyId);
  }

  // === Manual Payments (admin only) ===

  @Post('payments')
  @ApiOperation({ summary: 'Record a manual payment (cash/transfer)' })
  async recordPayment(
    @Body()
    body: {
      billId: string;
      amount: number;
      paidBy?: string;
      method?: string;
      note?: string;
      receivedBy?: string;
    },
    @Session() session: UserSession,
  ) {
    await this.assertAdmin(session);
    return this.billsService.recordPayment(body);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get payment history' })
  async findPayments(
    @Session() session: UserSession,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('billId') billId?: string,
  ) {
    await this.assertAdmin(session);
    return this.billsService.findPayments({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      billId,
    });
  }

  @Delete('payments/:id')
  @ApiOperation({ summary: 'Delete a payment and sync cash + bill status' })
  async deletePayment(@Param('id') id: string, @Session() session: UserSession) {
    await this.assertAdmin(session);
    return this.billsService.deletePayment(id);
  }

  @Post('payments/:id/proof')
  @ApiOperation({
    summary: 'Upload bukti bayar (foto struk transfer / bukti manual) untuk sebuah payment',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: PROOF_UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png)$/i;
        if (!allowed.test(extname(file.originalname))) {
          cb(
            new BadRequestException(
              'Hanya gambar (JPG, PNG) yang diperbolehkan sebagai bukti bayar',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadPaymentProof(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Session() session: UserSession,
  ) {
    try {
      await this.assertAdmin(session);
      if (!file) {
        throw new BadRequestException('File wajib diupload');
      }
      return await this.billsService.attachPaymentProof(id, {
        url: `/uploads/payments/${file.filename}`,
        name: file.originalname,
      });
    } catch (error) {
      // Interceptor menulis file sebelum cek auth — bersihkan bila gagal
      if (file?.filename) {
        try {
          await unlink(join(PROOF_UPLOAD_DIR, file.filename));
        } catch {
          // abaikan jika file tak ada
        }
      }
      throw error;
    }
  }

  // === Midtrans Online Payment ===

  @Get('midtrans/config')
  @ApiOperation({ summary: 'Get Midtrans client config for frontend' })
  getMidtransConfig() {
    return this.billsService.getMidtransConfig();
  }

  @Post('pay/:id')
  @ApiOperation({ summary: 'Create Midtrans Snap transaction for a bill' })
  async createSnapTransaction(@Param('id') billId: string, @Session() session: UserSession) {
    const scope = await this.resolveScope(session);
    // Warga hanya boleh membayar tagihan keluarganya sendiri
    if (!scope.isAdmin) {
      const bill = await this.billsService.findBillById(billId);
      if (!bill) throw new NotFoundException('Tagihan tidak ditemukan');
      if (bill.familyId !== scope.familyId) {
        throw new ForbiddenException('Anda tidak memiliki akses ke tagihan ini');
      }
    }
    return this.billsService.createSnapTransaction(billId);
  }

  @Post('verify/:id')
  @ApiOperation({
    summary: 'Verify payment status directly from Midtrans (fallback without webhook)',
  })
  async verifyPayment(@Param('id') billId: string, @Session() session: UserSession) {
    const scope = await this.resolveScope(session);
    // Warga hanya boleh memverifikasi tagihan keluarganya sendiri
    if (!scope.isAdmin) {
      const bill = await this.billsService.findBillById(billId);
      if (!bill) throw new NotFoundException('Tagihan tidak ditemukan');
      if (bill.familyId !== scope.familyId) {
        throw new ForbiddenException('Anda tidak memiliki akses ke tagihan ini');
      }
    }
    return this.billsService.verifyPayment(billId);
  }

  @Post('pay-bulk')
  @ApiOperation({ summary: 'Create one Midtrans Snap transaction for multiple bills' })
  async createBulkSnapTransaction(
    @Body() body: { billIds: string[] },
    @Session() session: UserSession,
  ) {
    if (!Array.isArray(body?.billIds) || body.billIds.length === 0) {
      throw new BadRequestException('billIds wajib diisi');
    }
    const scope = await this.resolveScope(session);
    // Warga dibatasi ke tagihan keluarganya sendiri; admin bebas
    const allowedFamilyId = scope.isAdmin ? undefined : scope.familyId || '__none__';
    return this.billsService.createBulkSnapTransaction(body.billIds, allowedFamilyId);
  }

  @Post('verify-group/:orderId')
  @ApiOperation({ summary: 'Verify a bulk payment group status directly from Midtrans' })
  async verifyPaymentGroup(@Param('orderId') orderId: string, @Session() session: UserSession) {
    // Verifikasi status boleh dilakukan pemilik transaksi maupun admin;
    // otorisasi detail sudah tercermin saat pembuatan grup (kepemilikan tagihan).
    await this.resolveScope(session);
    return this.billsService.verifyPaymentGroup(orderId);
  }

  @Post('webhook/midtrans')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Handle Midtrans payment notification (webhook)' })
  handleMidtransWebhook(@Body() body: any) {
    return this.billsService.handleMidtransNotification(body);
  }

  private async assertAdmin(session: UserSession) {
    const scope = await this.resolveScope(session);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk aksi ini');
    }
  }
}
