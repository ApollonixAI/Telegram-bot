// Simple Telegram Bot Webhook Handler
  const express = require('express');
  const axios = require('axios');

  const app = express();
  app.use(express.json());

  // Get environment variables
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const PORT = process.env.PORT || 5000;

  if (!BOT_TOKEN || !CHAT_ID) {
      console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables');
      process.exit(1);
  }

  console.log('🤖 Telegram Bot Starting...');
  console.log(`📱 Will send messages to chat ID: ${CHAT_ID}`);

  // Health check endpoint
  app.get('/', (req, res) => {
      res.json({
          status: 'Telegram Bot is running',
          endpoints: ['/health', '/webhook'],
          configured: true
      });
  });

  app.get('/health', (req, res) => {
      res.json({
          status: 'healthy',
          bot_configured: !!BOT_TOKEN,
          chat_configured: !!CHAT_ID
      });
  });

  // Webhook endpoint to receive notifications from proxy
  app.post('/webhook', async (req, res) => {
      console.log('📨 Received webhook:', JSON.stringify(req.body).substring(0, 200));

      try {
          const { type, message, data } = req.body;

          // Format message based on type
          let formattedMessage = message || 'Notification from ApollonixAI';

          // Add emoji based on notification type
          if (type === 'position_opened') {
              formattedMessage = '🟢 ' + formattedMessage;
          } else if (type === 'position_closed') {
              formattedMessage = '💰 ' + formattedMessage;
          } else if (type === 'signal') {
              formattedMessage = '📈 ' + formattedMessage;
          } else if (type === 'error') {
              formattedMessage = '🚨 ' + formattedMessage;
          }

          // Send to Telegram
          const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
          const response = await axios.post(telegramUrl, {
              chat_id: CHAT_ID,
              text: formattedMessage,
              parse_mode: 'Markdown'
          });

          console.log('✅ Message sent to Telegram');
          res.json({ success: true, message: 'Notification sent' });

      } catch (error) {
          console.error('❌ Error sending to Telegram:', error.message);
          if (error.response) {
              console.error('Telegram API response:', error.response.data);
          }
          res.status(500).json({
              success: false,
              error: error.message
          });
      }
  });

  // Test endpoint - send a test message
  app.post('/test', async (req, res) => {
      try {
          const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
          await axios.post(telegramUrl, {
              chat_id: CHAT_ID,
              text: '🧪 *Test Message*\nYour Telegram bot is working!',
              parse_mode: 'Markdown'
          });

          res.json({ success: true, message: 'Test message sent' });
      } catch (error) {
          console.error('❌ Test failed:', error.message);
          res.status(500).json({
              success: false,
              error: error.message
          });
      }
  });

  app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Telegram bot webhook server running on port ${PORT}`);
      console.log(`📍 Endpoints:`);
      console.log(`   GET  / - Status`);
      console.log(`   GET  /health - Health check`);
      console.log(`   POST /webhook - Receive notifications`);
      console.log(`   POST /test - Send test message`);
  });
