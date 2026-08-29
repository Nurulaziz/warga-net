import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test script untuk generate PDF dengan dual logo (Bekasi + SMR)
 */

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Test credentials - Super Admin
const TEST_PHONE = '+628123456789';

async function login(): Promise<string> {
  console.log('🔐 Login sebagai Super Admin...');
  
  // Step 1: Request OTP
  const otpResponse = await axios.post(`${API_BASE_URL}/auth/request-otp`, {
    phoneNumber: TEST_PHONE,
  });
  
  console.log('📱 OTP Response:', otpResponse.data);
  console.log('⚠️  Cek console backend untuk OTP code!');
  
  // Tunggu user input OTP dari console
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const otp = await new Promise<string>((resolve) => {
    readline.question('Masukkan OTP dari backend console: ', (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
  
  // Step 2: Verify OTP
  const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
    phoneNumber: TEST_PHONE,
    otp: otp.trim(),
  });
  
  console.log('✅ Login berhasil!');
  return verifyResponse.data.accessToken;
}

async function generatePdfReport(token: string): Promise<void> {
  console.log('\n📄 Generate PDF Report dengan dual logo...');
  
  const response = await axios.post(
    `${API_BASE_URL}/financial-reports/pdf`,
    {
      rtId: 'dummy-rt-id', // System tidak pakai RT ID sebenarnya
      startDate: '2026-01-01',
      endDate: '2026-02-14',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'arraybuffer',
    }
  );
  
  // Save PDF to file
  const outputPath = path.join(__dirname, 'test-outputs', 'report-with-dual-logos.pdf');
  
  // Create output directory if not exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, response.data);
  
  console.log('✅ PDF berhasil di-generate!');
  console.log(`📁 File location: ${outputPath}`);
  console.log('\n🔍 Silakan buka file PDF dan verifikasi:');
  console.log('   1. Logo Bekasi muncul di kiri atas');
  console.log('   2. Logo SMR muncul di kanan atas');
  console.log('   3. Header terlihat profesional dan formal');
  console.log('   4. Spacing dan alignment sudah benar');
}

async function main() {
  try {
    console.log('🚀 Test PDF Generation dengan Dual Logo\n');
    console.log('='.repeat(50));
    
    // Login
    const token = await login();
    
    // Generate PDF
    await generatePdfReport(token);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test selesai!');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

main();
