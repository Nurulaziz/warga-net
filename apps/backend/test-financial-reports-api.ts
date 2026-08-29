import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

// Test token - ganti dengan token valid Anda
const TOKEN = 'YOUR_TOKEN_HERE';

async function testFinancialReportsAPI() {
  try {
    console.log('Testing Financial Reports API...\n');

    const headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    };

    // Test 1: Income Report
    console.log('1. Testing Income Report...');
    try {
      const startDate = new Date('2026-02-01').toISOString();
      const endDate = new Date('2026-02-28').toISOString();
      
      const incomeResponse = await axios.get(`${API_URL}/financial-reports/income`, {
        headers,
        params: { startDate, endDate },
      });
      
      console.log('✓ Income Report Response:', JSON.stringify(incomeResponse.data, null, 2));
    } catch (error: any) {
      console.error('✗ Income Report Error:', error.response?.data || error.message);
    }

    // Test 2: Expense Report
    console.log('\n2. Testing Expense Report...');
    try {
      const startDate = new Date('2026-02-01').toISOString();
      const endDate = new Date('2026-02-28').toISOString();
      
      const expenseResponse = await axios.get(`${API_URL}/financial-reports/expenses`, {
        headers,
        params: { startDate, endDate },
      });
      
      console.log('✓ Expense Report Response:', JSON.stringify(expenseResponse.data, null, 2));
    } catch (error: any) {
      console.error('✗ Expense Report Error:', error.response?.data || error.message);
    }

    // Test 3: Payment Status Report
    console.log('\n3. Testing Payment Status Report...');
    try {
      const period = '2026-02';
      
      const paymentStatusResponse = await axios.get(`${API_URL}/financial-reports/payment-status`, {
        headers,
        params: { period },
      });
      
      console.log('✓ Payment Status Report Response:', JSON.stringify(paymentStatusResponse.data, null, 2));
    } catch (error: any) {
      console.error('✗ Payment Status Report Error:', error.response?.data || error.message);
    }

    // Test 4: Trend Analysis
    console.log('\n4. Testing Trend Analysis...');
    try {
      const trendResponse = await axios.get(`${API_URL}/financial-reports/trends`, {
        headers,
        params: { months: 6 },
      });
      
      console.log('✓ Trend Analysis Response:', JSON.stringify(trendResponse.data, null, 2));
    } catch (error: any) {
      console.error('✗ Trend Analysis Error:', error.response?.data || error.message);
    }

    // Test 5: Current Balance
    console.log('\n5. Testing Current Balance...');
    try {
      const balanceResponse = await axios.get(`${API_URL}/financial-reports/balance`, {
        headers,
      });
      
      console.log('✓ Current Balance Response:', JSON.stringify(balanceResponse.data, null, 2));
    } catch (error: any) {
      console.error('✗ Current Balance Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFinancialReportsAPI();
