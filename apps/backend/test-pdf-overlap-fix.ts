import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const API_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, 'test-outputs');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('🔧 Test PDF Overlap Fix\n');
  console.log('==================================================');

  try {
    // 1. Login
    console.log('🔐 Login sebagai Super Admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      phoneNumber: '+6281234567890',
    });
    console.log('📱 OTP Response:', loginResponse.data);
    console.log('⚠️  Cek console backend untuk OTP code!');

    const otp = await question('Masukkan OTP dari backend console: ');
    const verifyResponse = await axios.post(`${API_URL}/auth/verify-otp`, {
      phoneNumber: '+6281234567890',
      otp: otp.trim(),
    });

    const token = verifyResponse.data.accessToken;
    console.log('✅ Login berhasil!\n');

    // 2. Generate PDF dengan berbagai skenario
    console.log('📄 Test 1: PDF dengan data lengkap (multi-page)...');
    const pdfResponse1 = await axios.post(
      `${API_URL}/report/generate`,
      {
        format: 'pdf',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
      },
    );

    const pdfPath1 = path.join(OUTPUT_DIR, 'overlap-fix-multipage.pdf');
    fs.writeFileSync(pdfPath1, pdfResponse1.data);
    console.log(`✅ PDF 1 saved: ${pdfPath1}\n`);

    // 3. Generate PDF dengan data minimal
    console.log('📄 Test 2: PDF dengan data minimal (single page)...');
    const pdfResponse2 = await axios.post(
      `${API_URL}/report/generate`,
      {
        format: 'pdf',
        startDate: '2026-02-01',
        endDate: '2026-02-05',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
      },
    );

    const pdfPath2 = path.join(OUTPUT_DIR, 'overlap-fix-singlepage.pdf');
    fs.writeFileSync(pdfPath2, pdfResponse2.data);
    console.log(`✅ PDF 2 saved: ${pdfPath2}\n`);

    console.log('==================================================');
    console.log('✅ Test selesai!\n');
    console.log('🔍 Verifikasi manual:');
    console.log('   1. Buka kedua file PDF');
    console.log('   2. Periksa header tidak overlap dengan konten');
    console.log('   3. Periksa footer tidak overlap dengan konten');
    console.log('   4. Periksa spacing antar section konsisten');
    console.log('   5. Periksa page break berfungsi dengan baik');
    console.log('\n📁 File locations:');
    console.log(`   - ${pdfPath1}`);
    console.log(`   - ${pdfPath2}`);
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    rl.close();
  }
}

main();
