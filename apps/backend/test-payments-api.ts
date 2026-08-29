import axios from 'axios';

async function testPaymentsAPI() {
  try {
    console.log('=== Testing Payments API ===\n');

    // You need to replace this with a valid JWT token from your login
    const token = 'YOUR_JWT_TOKEN_HERE';

    const response = await axios.get('http://localhost:3000/api/v1/payments?limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('\nPayments count:', response.data.payments?.length || 0);
    console.log('Total:', response.data.total);

    if (response.data.payments && response.data.payments.length > 0) {
      console.log('\nFirst payment sample:');
      console.log(JSON.stringify(response.data.payments[0], null, 2));
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPaymentsAPI();
