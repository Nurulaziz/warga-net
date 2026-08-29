import TelegramBot from 'node-telegram-bot-api';

const BOT_TOKEN = '8366745143:AAFJ66J1rtS2gHXJgJa2cEtBhv0WXz6sd90';

console.log('Testing Telegram Bot Connection...');
console.log('Bot Token:', BOT_TOKEN);

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Test getMe
bot.getMe()
  .then((botInfo) => {
    console.log('\n✅ Bot Connection Successful!');
    console.log('Bot Info:', JSON.stringify(botInfo, null, 2));
    console.log('\nBot Username:', `@${botInfo.username}`);
    console.log('Bot ID:', botInfo.id);
    console.log('Bot Name:', botInfo.first_name);
    
    // Test getUpdates to see if there are pending messages
    return bot.getUpdates({ limit: 1 });
  })
  .then((updates) => {
    console.log('\n📬 Recent Updates:', updates.length);
    if (updates.length > 0) {
      console.log('Last Update:', JSON.stringify(updates[0], null, 2));
    }
    
    // Check webhook status
    return bot.getWebHookInfo();
  })
  .then((webhookInfo) => {
    console.log('\n🔗 Webhook Info:');
    console.log('URL:', webhookInfo.url || '(not set - using polling)');
    console.log('Pending Updates:', webhookInfo.pending_update_count);
    
    if (webhookInfo.url) {
      console.log('\n⚠️  WARNING: Webhook is set! This will conflict with polling.');
      console.log('Run this to delete webhook:');
      console.log('curl -X POST https://api.telegram.org/bot' + BOT_TOKEN + '/deleteWebhook');
    }
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Bot Connection Failed!');
    console.error('Error:', error.message);
    console.error('\nPossible causes:');
    console.error('1. Invalid bot token');
    console.error('2. Network/firewall blocking Telegram API');
    console.error('3. Bot was deleted or revoked');
    process.exit(1);
  });
