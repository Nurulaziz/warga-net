import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, 'test-outputs');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface TestCase {
  name: string;
  rtId: string;
  startDate: string;
  endDate: string;
  includeWatermark?: boolean;
  includeQrCode?: boolean;
  expectedStatus: number;
  description: string;
}

const testCases: TestCase[] = [
  {
    name: 'valid-data',
    rtId: '00000000-0000-0000-0000-000000000001',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    expectedStatus: 200,
    description: 'Test with valid data (existing RT, valid date range)',
  },
  {
    name: 'empty-period',
    rtId: '00000000-0000-0000-0000-000000000001',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    expectedStatus: 200,
    description: 'Test with empty period (no transactions in date range)',
  },
  {
    name: 'with-watermark',
    rtId: '00000000-0000-0000-0000-000000000001',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    includeWatermark: true,
    expectedStatus: 200,
    description: 'Test with watermark enabled',
  },
  {
    name: 'with-qrcode',
    rtId: '00000000-0000-0000-0000-000000000001',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    includeQrCode: true,
    expectedStatus: 200,
    description: 'Test with QR code enabled',
  },
  {
    name: 'with-all-features',
    rtId: '00000000-0000-0000-0000-000000000001',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    includeWatermark: true,
    includeQrCode: true,
    expectedStatus: 200,
    description: 'Test with watermark and QR code enabled',
  },
];

async function getAuthToken(): Promise<string> {
  try {
    // Login as super admin
    const otpResponse = await axios.post(`${API_BASE_URL}/api/auth/request-otp`, {
      phoneNumber: '+6281234567890',
    });

    console.log('OTP requested successfully');

    // In test environment, we need to get OTP from logs or use a test OTP
    // For now, we'll use a hardcoded test OTP (this should be configured in test env)
    const verifyResponse = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
      phoneNumber: '+6281234567890',
      otp: '123456', // Test OTP
    });

    return verifyResponse.data.accessToken;
  } catch (error: any) {
    console.error('Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testPdfGeneration(testCase: TestCase, token: string): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Test: ${testCase.name}`);
  console.log(`Description: ${testCase.description}`);
  console.log(`${'='.repeat(80)}`);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/financial-reports/pdf`,
      {
        rtId: testCase.rtId,
        startDate: testCase.startDate,
        endDate: testCase.endDate,
        includeWatermark: testCase.includeWatermark,
        includeQrCode: testCase.includeQrCode,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'arraybuffer',
        validateStatus: () => true, // Don't throw on any status
      },
    );

    console.log(`Status: ${response.status}`);
    console.log(`Expected: ${testCase.expectedStatus}`);

    if (response.status !== testCase.expectedStatus) {
      console.error(`❌ FAILED: Expected status ${testCase.expectedStatus}, got ${response.status}`);
      if (response.status >= 400) {
        const errorText = Buffer.from(response.data).toString('utf-8');
        console.error('Error response:', errorText);
      }
      return;
    }

    if (response.status === 200) {
      // Check headers
      const contentType = response.headers['content-type'];
      const contentDisposition = response.headers['content-disposition'];

      console.log(`Content-Type: ${contentType}`);
      console.log(`Content-Disposition: ${contentDisposition}`);

      if (contentType !== 'application/pdf') {
        console.error(`❌ FAILED: Expected Content-Type 'application/pdf', got '${contentType}'`);
        return;
      }

      if (!contentDisposition || !contentDisposition.includes('attachment')) {
        console.error(`❌ FAILED: Invalid Content-Disposition header`);
        return;
      }

      // Save PDF file
      const filename = `${testCase.name}.pdf`;
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, response.data);

      const fileSize = fs.statSync(filepath).size;
      console.log(`✅ PDF saved: ${filepath}`);
      console.log(`File size: ${(fileSize / 1024).toFixed(2)} KB`);

      // Basic PDF validation
      const pdfHeader = Buffer.from(response.data).toString('utf-8', 0, 5);
      if (pdfHeader !== '%PDF-') {
        console.error(`❌ FAILED: Invalid PDF header`);
        return;
      }

      console.log(`✅ PASSED: ${testCase.name}`);
    }
  } catch (error: any) {
    console.error(`❌ ERROR: ${error.message}`);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

async function runTests() {
  console.log('Starting PDF Generation API Tests...\n');

  try {
    // Get authentication token
    console.log('Authenticating...');
    const token = await getAuthToken();
    console.log('✅ Authentication successful\n');

    // Run all test cases
    for (const testCase of testCases) {
      await testPdfGeneration(testCase, token);
    }

    console.log('\n' + '='.repeat(80));
    console.log('All tests completed!');
    console.log(`Output directory: ${OUTPUT_DIR}`);
    console.log('='.repeat(80));
    console.log('\nManual verification steps:');
    console.log('1. Open each PDF file in the test-outputs directory');
    console.log('2. Verify header displays correctly with logo');
    console.log('3. Verify all sections present (summary, income, expense, category, signatures)');
    console.log('4. Verify currency formatting (Rp X.XXX.XXX)');
    console.log('5. Verify date formatting (DD/MM/YYYY in tables, DD Month YYYY in headers)');
    console.log('6. Verify page numbers appear (if multi-page)');
    console.log('7. Verify watermark appears in watermark-enabled PDFs');
    console.log('8. Verify QR code appears in QR-enabled PDFs');
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests();
