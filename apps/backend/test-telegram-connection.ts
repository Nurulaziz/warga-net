import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testTelegramConnection() {
  console.log('🔍 Testing Telegram Bot Connection...\n');

  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN tidak ditemukan di .env');
    process.exit(1);
  }

  console.log(`✓ Bot token found: ${token.substring(0, 10)}...`);

  try {
    // Create bot instance (no polling)
    const bot = new TelegramBot(token, { polling: false });

    // Test getMe API call
    console.log('\n📡 Testing getMe API call...');
    const botInfo = await bot.getMe();

    console.log('\n✅ Bot connection successful!');
    console.log('\n📋 Bot Information:');
    console.log(`   ID: ${botInfo.id}`);
    console.log(`   Username: @${botInfo.username}`);
    console.log(`   Name: ${botInfo.first_name}`);

    // Test getUpdates to see if there are pending messages
    console.log('\n📬 Checking for pending updates...');
    const updates = await bot.getUpdates({ limit: 5 });

    if (updates.length > 0) {
      console.log(`\n✓ Found ${updates.length} pending update(s):`);
      updates.forEach((update, index) => {
        console.log(`\n   Update ${index + 1}:`);
        if (update.message) {
          console.log(`   - Type: message`);
          console.log(`   - From: ${update.message.from?.first_name} (ID: ${update.message.from?.id})`);
          console.log(`   - Chat ID: ${update.message.chat.id}`);
          console.log(`   - Text: ${update.message.text || '(no text)'}`);
        } else if (update.callback_query) {
          console.log(`   - Type: callback_query`);
          console.log(`   - From: ${update.callback_query.from.first_name} (ID: ${update.callback_query.from.id})`);
          console.log(`   - Data: ${update.callback_query.data}`);
        }
      });
    } else {
      console.log('   No pending updates');
    }

    console.log('\n✅ All tests passed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start your backend server: pnpm start:dev');
    console.log('   2. Open Telegram and search for your bot: @' + botInfo.username);
    console.log('   3. Send /start command to your bot');
    console.log('   4. Check backend logs for handler registration');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Bot connection failed!');
    console.error('\nError details:');
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Name: ${error.name}`);
    } else {
      console.error(`   ${String(error)}`);
    }

    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if TELEGRAM_BOT_TOKEN is correct in .env');
    console.log('   2. Verify token format: {bot_id}:{token}');
    console.log('   3. Make sure bot is not revoked in @BotFather');
    console.log('   4. Check internet connection');

    process.exit(1);
  }
}

testTelegramConnection();
