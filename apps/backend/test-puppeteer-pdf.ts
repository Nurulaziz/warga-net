/**
 * Test script untuk verify Puppeteer PDF generation
 * 
 * Usage: npx ts-node test-puppeteer-pdf.ts
 */

import { PdfGeneratorService } from './src/report/services/pdf-generator.service';
import { TemplateRendererService } from './src/report/services/template-renderer.service';
import { AssetManager } from './src/report/services/asset-manager.service';
import { ReportData } from './src/report/interfaces/report-data.interface';
import * as fs from 'fs';
import * as path from 'path';

async function testPdfGeneration() {
  console.log('🚀 Testing Puppeteer PDF Generation...\n');

  // Create service instances
  const assetManager = new AssetManager();
  const templateRenderer = new TemplateRendererService();
  const pdfGenerator = new PdfGeneratorService(templateRenderer, assetManager);

  // Create sample report data
  const sampleData: ReportData = {
    rtInfo: {
      id: 'rt-001',
      name: 'RT 004 / RW 012',
      kelurahan: 'Harapan Jaya',
      kecamatan: 'Bekasi Utara',
      kota: 'Kota Bekasi',
      address: 'Jl. Raya Harapan Jaya No. 123',
      phone: '021-12345678',
      ketuaName: 'Budi Santoso',
      sekretarisName: 'Siti Aminah',
      bendaharaName: 'Ahmad Hidayat',
    },
    period: {
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    },
    summary: {
      saldoAwal: 5000000,
      totalIncome: 3500000,
      totalExpense: 2000000,
      saldoAkhir: 6500000,
    },
    incomeTransactions: [
      {
        paymentDate: new Date('2026-01-05'),
        residentName: 'Andi Wijaya',
        feeTypeName: 'Iuran Bulanan',
        period: 'Januari 2026',
        paymentMethod: 'Transfer',
        amount: 100000,
        notes: 'Lunas',
      },
      {
        paymentDate: new Date('2026-01-10'),
        residentName: 'Dewi Lestari',
        feeTypeName: 'Iuran Bulanan',
        period: 'Januari 2026',
        paymentMethod: 'Tunai',
        amount: 100000,
      },
    ],
    expenseTransactions: [
      {
        expenseDate: new Date('2026-01-15'),
        description: 'Pembelian Lampu Jalan',
        categoryName: 'Infrastruktur',
        amount: 500000,
        notes: 'Lampu LED 10 unit',
        approvedByName: 'Budi Santoso',
      },
    ],
    categoryRecap: [
      {
        categoryName: 'Infrastruktur',
        total: 500000,
      },
    ],
    generatedAt: new Date(),
    generatedBy: 'System Test',
  };

  try {
    console.log('📄 Generating PDF with Puppeteer...');
    const startTime = Date.now();
    
    const pdfBuffer = await pdfGenerator.generate(sampleData);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ PDF generated successfully in ${duration}ms`);
    console.log(`📦 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    // Save PDF to test-outputs folder
    const outputDir = path.join(__dirname, 'test-outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'puppeteer-test-report.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`💾 PDF saved to: ${outputPath}`);
    console.log('\n✨ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testPdfGeneration();
