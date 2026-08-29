/**
 * Test script untuk multi-page PDF generation
 * Task 7.2: Test multi-page generation
 * 
 * Test ini akan:
 * 1. Generate report dengan 100+ transactions
 * 2. Verify headers repeat on all pages
 * 3. Verify footers appear on all pages
 * 4. Verify page numbers are correct
 * 5. Verify rows don't break in middle
 * 
 * Requirements: 2.4, 5.6, 7.1, 7.2, 7.3, 7.5
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PdfGeneratorService } from './src/report/services/pdf-generator.service';
import { ReportData, IncomeTransaction, ExpenseTransaction, CategoryRecap } from './src/report/interfaces/report-data.interface';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  console.log('🚀 Starting multi-page PDF generation test...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const pdfGenerator = app.get(PdfGeneratorService);

  // Generate test data dengan 100+ transactions
  const testData = generateLargeReportData();

  console.log('📊 Test Data Summary:');
  console.log(`   - Income Transactions: ${testData.incomeTransactions.length}`);
  console.log(`   - Expense Transactions: ${testData.expenseTransactions.length}`);
  console.log(`   - Total Transactions: ${testData.incomeTransactions.length + testData.expenseTransactions.length}`);
  console.log(`   - Period: ${testData.period.startDate.toLocaleDateString('id-ID')} - ${testData.period.endDate.toLocaleDateString('id-ID')}`);
  console.log('');

  try {
    console.log('⏳ Generating PDF...');
    const startTime = Date.now();
    
    const pdfBuffer = await pdfGenerator.generate(testData);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`✅ PDF generated successfully in ${duration.toFixed(2)} seconds`);
    console.log(`   - PDF Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log('');

    // Save PDF to test-outputs folder
    const outputDir = path.join(process.cwd(), 'test-outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'multipage-report-test.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log('💾 PDF saved to:', outputPath);
    console.log('');
    console.log('📋 Manual Verification Checklist:');
    console.log('   [ ] Headers appear on all pages');
    console.log('   [ ] Footers appear on all pages');
    console.log('   [ ] Page numbers are correct (Page X of Y)');
    console.log('   [ ] Table headers repeat on new pages');
    console.log('   [ ] Rows don\'t break in the middle');
    console.log('   [ ] Content is properly formatted');
    console.log('   [ ] Logo(s) appear correctly on all pages');
    console.log('');
    console.log('✨ Please open the PDF and verify the checklist above.');

  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

/**
 * Generate test data dengan 100+ transactions untuk multi-page testing
 */
function generateLargeReportData(): ReportData {
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-01-31');

  // Generate 80 income transactions
  const incomeTransactions: IncomeTransaction[] = [];
  for (let i = 1; i <= 80; i++) {
    const day = Math.floor(Math.random() * 31) + 1;
    incomeTransactions.push({
      paymentDate: new Date(2025, 0, day),
      residentName: `Warga ${String(i).padStart(3, '0')}`,
      feeTypeName: i % 3 === 0 ? 'Iuran Kebersihan' : i % 3 === 1 ? 'Iuran Keamanan' : 'Iuran Sampah',
      period: 'Januari 2025',
      paymentMethod: i % 2 === 0 ? 'Transfer' : 'Tunai',
      amount: 50000 + (i % 5) * 10000,
      notes: i % 10 === 0 ? `Pembayaran untuk periode Januari 2025` : undefined,
    });
  }

  // Generate 40 expense transactions
  const expenseTransactions: ExpenseTransaction[] = [];
  const categories = ['Kebersihan', 'Keamanan', 'Pemeliharaan', 'Administrasi', 'Lain-lain'];
  const descriptions = [
    'Gaji Satpam',
    'Gaji Cleaning Service',
    'Pembelian Alat Kebersihan',
    'Perbaikan Lampu Jalan',
    'Pembelian ATK',
    'Biaya Listrik Pos Ronda',
    'Pembelian Cat Tembok',
    'Biaya Fotocopy',
    'Pembelian Kunci Gerbang',
    'Biaya Konsumsi Rapat',
  ];

  for (let i = 1; i <= 40; i++) {
    const day = Math.floor(Math.random() * 31) + 1;
    const category = categories[i % categories.length];
    const description = descriptions[i % descriptions.length];
    
    expenseTransactions.push({
      expenseDate: new Date(2025, 0, day),
      description: `${description} - Item ${i}`,
      categoryName: category,
      amount: 100000 + (i % 10) * 50000,
      notes: i % 5 === 0 ? `Pengeluaran untuk ${category.toLowerCase()}` : `Pengeluaran rutin`,
      approvedByName: i % 3 === 0 ? 'Ketua RT' : i % 3 === 1 ? 'Bendahara RT' : 'Sekretaris RT',
    });
  }

  // Calculate category recap
  const categoryMap = new Map<string, number>();
  expenseTransactions.forEach(exp => {
    const current = categoryMap.get(exp.categoryName) || 0;
    categoryMap.set(exp.categoryName, current + exp.amount);
  });

  const categoryRecap: CategoryRecap[] = Array.from(categoryMap.entries()).map(([name, total]) => ({
    categoryName: name,
    total,
  }));

  // Calculate summary
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const saldoAwal = 5000000; // 5 juta
  const saldoAkhir = saldoAwal + totalIncome - totalExpense;

  return {
    rtInfo: {
      id: '1',
      name: 'RT 004 / RW 012',
      kelurahan: 'Harapan Jaya',
      kecamatan: 'Bekasi Utara',
      kota: 'Kota Bekasi',
      address: 'Jl. Raya Harapan Indah No. 123',
      phone: '021-12345678',
      ketuaName: 'Budi Santoso',
      sekretarisName: 'Siti Nurhaliza',
      bendaharaName: 'Ahmad Dahlan',
    },
    period: {
      startDate,
      endDate,
    },
    summary: {
      saldoAwal,
      totalIncome,
      totalExpense,
      saldoAkhir,
    },
    incomeTransactions,
    expenseTransactions,
    categoryRecap,
    generatedAt: new Date(),
    generatedBy: 'Test Script',
    documentNumber: 'LK-RT04-0125-TEST',
    status: 'FINAL',
  };
}

bootstrap();
