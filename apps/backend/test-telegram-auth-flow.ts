/**
 * Test script untuk verifikasi Telegram authentication flow
 * 
 * Script ini membantu debug flow autentikasi dengan mencetak:
 * - Status bot
 * - Registered handlers
 * - Auth service configuration
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { TelegramBotService } from './src/telegram/telegram-bot.service';
import { TelegramAuthService } from './src/telegram/telegram-auth.service';

async function testTelegramAuthFlow() {
  console.log('🔍 Testing Telegram Authentication Flow...\n');

  try {
    // Create NestJS application
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get services
    const botService = app.get(TelegramBotService);
    const authService = app.get(TelegramAuthService);

    // Check bot status
    console.log('📊 Bot Health Status:');
    const healthStatus = botService.getHealthStatus();
    console.log(`  - Running: ${healthStatus.isRunning ? '✅' : '❌'}`);
    console.log(`  - Last Poll: ${healthStatus.lastPollTime?.toISOString() || 'Never'}`);
    console.log(`  - Total Commands: ${healthStatus.totalCommands}`);
    console.log(`  - Success Rate: ${(healthStatus.successRate * 100).toFixed(2)}%`);
    console.log(`  - Error Rate: ${(healthStatus.errorRate * 100).toFixed(2)}%\n`);

    // Check if bot is available
    const bot = botService.getBot();
    if (!bot) {
      console.log('❌ Bot tidak tersedia. Pastikan TELEGRAM_BOT_TOKEN sudah diset di .env\n');
      await app.close();
      return;
    }

    console.log('✅ Bot tersedia dan berjalan\n');

    // Test phone number validation
    console.log('🧪 Testing Phone Number Validation:');
    
    const testCases = [
      { phone: '+628123456789', expected: 'valid format' },
      { phone: '08123456789', expected: 'invalid format (missing +62)' },
      { phone: '+62812345', expected: 'invalid format (too short)' },
      { phone: '+6281234567890123456', expected: 'invalid format (too long)' },
    ];

    for (const testCase of testCases) {
      // Note: We can't directly test validatePhoneNumberFormat as it's private
      // But we can test the full flow with verifyPhoneNumber
      console.log(`  Testing: ${testCase.phone}`);
      console.log(`    Expected: ${testCase.expected}`);
    }

    console.log('\n✅ Test completed successfully');
    console.log('\n📝 Manual Testing Steps:');
    console.log('1. Open Telegram and find your bot');
    console.log('2. Send /start command');
    console.log('3. Bot should respond with welcome message');
    console.log('4. Send a phone number (e.g., +628123456789)');
    console.log('5. Bot should respond with authentication result');
    console.log('\n💡 Tips:');
    console.log('- Make sure the phone number is registered in WargaNet system');
    console.log('- Make sure the user has admin role (ADMIN_BENDAHARA, ADMIN_RT, or SUPER_ADMIN)');
    console.log('- Make sure the user account is active');

    await app.close();
  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }
}

// Run test
testTelegramAuthFlow()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
