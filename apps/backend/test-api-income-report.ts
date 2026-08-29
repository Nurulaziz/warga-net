import axios from 'axios';

async function testIncomeReportAPI() {
  try {
    console.log('=== Testing Income Report API ===\n');

    // You'll need to replace this with a valid JWT token
    // Get it from browser localStorage or login first
    const token = 'YOUR_JWT_TOKEN_HERE';

    const startDate = new Date('2026-02-01').toISOString();
    const endDate = new Date('2026-02-28').toISOString();

    console.log('Calling API with:', { startDate, endDate });

    const response = await axios.get('http://localhost:3000/api/v1/financial-reports/income', {
      params: { startDate, endDate },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('\n=== API Response ===');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

    console.log('\n=== Checking Data Types ===');
    console.log('totalIncome type:', typeof response.data.totalIncome);
    console.log('byMethod type:', typeof response.data.byMethod);
    console.log('byMethod keys:', Object.keys(response.data.byMethod || {}));
    console.log('byFeeType type:', typeof response.data.byFeeType);
    console.log('byFeeType keys:', Object.keys(response.data.byFeeType || {}));

  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testIncomeReportAPI();
