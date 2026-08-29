import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

// Read public key
const publicKeyPath = path.join(__dirname, 'keys', 'public.pem');
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.log('❌ Usage: npx ts-node decode-jwt-token.ts <JWT_TOKEN>');
  console.log('\nExample:');
  console.log('npx ts-node decode-jwt-token.ts eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

try {
  console.log('🔍 Decoding JWT token...\n');
  
  // Decode without verification first to see the payload
  const decoded = jwt.decode(token, { complete: true });
  
  if (!decoded) {
    console.log('❌ Invalid token format');
    process.exit(1);
  }

  console.log('📋 Token Header:');
  console.log(JSON.stringify(decoded.header, null, 2));
  console.log('\n📋 Token Payload:');
  console.log(JSON.stringify(decoded.payload, null, 2));

  // Verify token signature
  try {
    const verified = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    console.log('\n✅ Token signature is valid');
    
    // Check permissions
    const payload = verified as any;
    
    if (payload.permissions) {
      console.log('\n💰 Financial permissions in token:\n');
      
      const financialFeatures = ['payments', 'expenses', 'bills', 'fee_types', 'financial_reports'];
      
      for (const feature of financialFeatures) {
        const perms = payload.permissions[feature];
        if (perms) {
          const actions = Object.entries(perms)
            .filter(([_, value]) => value === true)
            .map(([key]) => key);
          console.log(`   ✅ ${feature}: ${actions.join(', ')}`);
        } else {
          console.log(`   ❌ ${feature}: NOT FOUND`);
        }
      }
    } else {
      console.log('\n❌ No permissions found in token!');
    }
    
  } catch (verifyError: any) {
    console.log('\n❌ Token signature verification failed:', verifyError.message);
  }
  
} catch (error: any) {
  console.error('❌ Error decoding token:', error.message);
  process.exit(1);
}
