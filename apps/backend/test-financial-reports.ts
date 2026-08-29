import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

async function testFinancialReports() {
  try {
    console.log('🔍 Testing Financial Reports API...\n');

    // Test 1: Payment Status Report for December 2025
    console.log('📅 Test 1: Payment Status Report - December 2025');
    const dec2025 = await axios.get(`${API_URL}/reports/payment-status`, {
      params: { period: '2025-12' },
    });
    console.log('Response:', JSON.stringify(dec2025.data, null, 2));
    console.log('\n' + '-'.repeat(60) + '\n');

    // Test 2: Payment Status Report for January 2026
    console.log('📅 Test 2: Payment Status Report - January 2026');
    const jan2026 = await axios.get(`${API_URL}/reports/payment-status`, {
      params: { period: '2026-01' },
    });
    console.log('Response:', JSON.stringify(jan2026.data, null, 2));
    console.log('\n' + '-'.repeat(60) + '\n');

    // Test 3: Payment Status Report for February 2026
    console.log('📅 Test 3: Payment Status Report - February 2026');
    const feb2026 = await axios.get(`${API_URL}/reports/payment-status`, {
      params: { period: '2026-02' },
    });
    console.log('Response:', JSON.stringify(feb2026.data, null, 2));
    console.log('\n' + '-'.repeat(60) + '\n');

    // Test 4: Income Report
    console.log('📊 Test 4: Income Report');
    const income = await axios.get(`${API_URL}/reports/income`, {
      params: {
        startDate: '2025-12-01',
        endDate: '2026-02-28',
      },
    });
    console.log('Response:', JSON.stringify(income.data, null, 2));
    console.log('\n' + '-'.repeat(60) + '\n');

    console.log('✅ All tests completed successfully!');
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFinancialReports();
