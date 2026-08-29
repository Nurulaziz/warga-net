import { createClient } from 'redis';

async function forceLogoutAll() {
  console.log('🔄 Force logout all users...\n');

  const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  try {
    await redisClient.connect();
    console.log('✅ Connected to Redis\n');

    // Get all refresh token keys
    const keys = await redisClient.keys('refresh:*');
    
    if (keys.length === 0) {
      console.log('ℹ️  No active sessions found');
      return;
    }

    console.log(`📊 Found ${keys.length} active sessions\n`);

    // Delete all refresh tokens
    for (const key of keys) {
      await redisClient.del(key);
      console.log(`   ✅ Deleted: ${key}`);
    }

    console.log(`\n✅ Successfully logged out all users`);
    console.log('ℹ️  Users will need to login again to get new tokens with updated permissions\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await redisClient.disconnect();
  }
}

forceLogoutAll();
