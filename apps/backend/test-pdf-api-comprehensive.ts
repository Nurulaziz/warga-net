/**
 * Comprehensive PDF Generation API Test Script
 * Tests all scenarios from task 14.1
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, 'test-outputs', 'pdf-tests');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  fileSize?: number;
  fileName?: string;
}

const results: TestResult[] = [];

async function getAuthToken(): Promise<string> {
  console.log('🔐 Getting authentication token...');
  
  try {
    // Request OTP
    await axios.post(`${BASE_URL}/api/auth/request-otp`, {
      phoneNumber: '+6281234567890',
    });
    
    console.log('📱 OTP requested, using test OTP...');
    
    // Verify OTP (using test OTP from logs)
    const response = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      phoneNumber: '+6281234567890',
      otp: '123456', // Test OTP
    });
    
    console.log('✅ Authentication successful\n');
    return response.data.accessToken;
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testPdfGeneration(
  token: string,
  testName: string,
  payload: any,
  fileName: string,
): Promise<TestResult> {
  console.log(`\n📄 Testing: ${testName}`);
  console.log(`   Payload:`, JSON.stringify(payload, null, 2));
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/financial-reports/pdf`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      },
    );
    
    // Save PDF file
    const filePath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(filePath, response.data);
    
    const fileSize = fs.statSync(filePath).size;
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   ✅ File saved: ${fileName}`);
    console.log(`   ✅ File size: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`   ✅ Content-Type: ${response.headers['content-type']}`);
    
    // Verify it's a PDF
    const isPdf = response.headers['content-type'] === 'application/pdf';
    const hasContent = fileSize > 0;
    
    if (!isPdf) {
      throw new Error('Response is not a PDF');
    }
    
    if (!hasContent) {
      throw new Error('PDF file is empty');
    }
    
    return {
      testName,
      passed: true,
      fileSize,
      fileName,
    };
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.response?.data || error.message}`);
    return {
      testName,
      passed: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

async function runTests() {
  console.log('🚀 Starting PDF Generation API Tests\n');
  console.log('=' .repeat(60));
  
  let token: string;
  
  try {
    token = await getAuthToken();
  } catch (error) {
    console.error('\n❌ Cannot proceed without authentication token');
    process.exit(1);
  }
  
  // Test 1: Valid data (existing RT, valid date range)
  results.push(
    await testPdfGeneration(
      token,
      'Test 1: Valid Data',
      {
        rtId: '00000000-0000-0000-0000-000000000001',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      },
      'test-1-valid-data.pdf',
    ),
  );
  
  // Test 2: Empty period (no transactions)
  results.push(
    await testPdfGeneration(
      token,
      'Test 2: Empty Period',
      {
        rtId: '00000000-0000-0000-0000-000000000001',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      },
      'test-2-empty-period.pdf',
    ),
  );
  
  // Test 3: With watermark enabled
  results.push(
    await testPdfGeneration(
      token,
      'Test 3: With Watermark',
      {
        rtId: '00000000-0000-0000-0000-000000000001',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        includeWatermark: true,
      },
      'test-3-with-watermark.pdf',
    ),
  );
  
  // Test 4: With QR code enabled
  results.push(
    await testPdfGeneration(
      token,
      'Test 4: With QR Code',
      {
        rtId: '00000000-0000-0000-0000-000000000001',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        includeQrCode: true,
      },
      'test-4-with-qrcode.pdf',
    ),
  );
  
  // Test 5: Both watermark and QR code
  results.push(
    await testPdfGeneration(
      token,
      'Test 5: Watermark + QR Code',
      {
        rtId: '00000000-0000-0000-0000-000000000001',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        includeWatermark: true,
        includeQrCode: true,
      },
      'test-5-watermark-qrcode.pdf',
    ),
  );
  
  // Test 6: Different RT (test missing logo scenario)
  results.push(
    await testPdfGeneration(
      token,
      'Test 6: Different RT',
      {
        rtId: '00000000-0000-0000-0000-000000000002',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      },
      'test-6-different-rt.pdf',
    ),
  );
  
  // Test 7: Multi-month period (test multi-page)
  results.push(
    await testPdfGeneration(
      token,
      'Test 7: Multi-Month Period',
      {
        rtId: '00000000-0000-0000-0000-000000000001',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      },
      'test-7-multi-month.pdf',
    ),
  );
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  console.log('\n📋 Detailed Results:\n');
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.testName}`);
    if (result.passed) {
      console.log(`   File: ${result.fileName}`);
      console.log(`   Size: ${(result.fileSize! / 1024).toFixed(2)} KB`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n📁 Output Directory:', OUTPUT_DIR);
  console.log('\n🔍 MANUAL VERIFICATION REQUIRED:');
  console.log('   Please open the generated PDF files and verify:');
  console.log('   - Header displays correctly with logo');
  console.log('   - All sections present (summary, income, expense, category, signatures)');
  console.log('   - Currency formatting: "Rp X.XXX.XXX"');
  console.log('   - Date formatting: "DD/MM/YYYY" in tables');
  console.log('   - Date formatting: "DD Month YYYY" in headers');
  console.log('   - Page numbers appear (if multi-page)');
  console.log('   - Watermark appears when enabled');
  console.log('   - QR code appears when enabled');
  
  console.log('\n' + '='.repeat(60));
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test execution failed:', error);
  process.exit(1);
});
