import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import dotenv from 'dotenv';
import { handleMessage } from './handlers/messageHandler';
import { handleCallbackQuery } from './handlers/callbackHandler';
import { setupCommands } from './commands';
import axios from 'axios';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token || token === 'your_telegram_bot_token_here') {
  console.error('❌ TELEGRAM_BOT_TOKEN не настроен!');
  console.error('');
  console.error('Для запуска Telegram Bot:');
  console.error('1. Откройте Telegram и найдите @BotFather');
  console.error('2. Отправьте команду /newbot');
  console.error('3. Следуйте инструкциям');
  console.error('4. Скопируйте токен и добавьте в .env файл');
  console.error('');
  console.error('Пока токен не настроен, Telegram Bot не будет работать.');
  console.error('Backend API и 1C Integration могут работать независимо.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const app = express();
const PORT = process.env.BOT_PORT || 3002;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoint to send messages
app.post('/api/send-message', async (req, res) => {
  try {
    const { chatId, text, replyMarkup } = req.body;

    const options: any = {};
    if (replyMarkup) {
      options.reply_markup = replyMarkup;
    }

    const message = await bot.sendMessage(chatId, text, options);

    res.json({
      messageId: message.message_id.toString(),
      success: true
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API endpoint to send notifications
app.post('/api/send-notification', async (req, res) => {
  try {
    const { customerId, notificationType, orderData } = req.body;

    // Get customer's telegram chat ID from backend
    const customerResponse = await axios.get(
      `${process.env.BOT_API_URL}/api/customers/${customerId}`
    );
    const customer = customerResponse.data.customer;

    let text = '';
    switch (notificationType) {
      case 'order_confirmed':
        text = `✅ Ваш заказ №${orderData.orderNumber} подтвержден!\n\nСумма: ${orderData.totalAmount} руб.\nАдрес доставки: ${orderData.deliveryAddress}`;
        break;
      case 'order_shipped':
        text = `📦 Ваш заказ №${orderData.orderNumber} отправлен!\n\nТрек-номер: ${orderData.trackingNumber || 'Уточняется'}`;
        break;
      case 'order_delivered':
        text = `🎉 Ваш заказ №${orderData.orderNumber} доставлен!\n\nСпасибо за покупку!`;
        break;
    }

    await bot.sendMessage(customer.telegramUserId, text);

    res.json({
      notificationId: `notif-${Date.now()}`,
      success: true
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Setup bot commands
setupCommands(bot);

// Handle messages
bot.on('message', (msg) => handleMessage(bot, msg));

// Handle callback queries (inline keyboard buttons)
bot.on('callback_query', (query) => handleCallbackQuery(bot, query));

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Telegram Bot Service started on port ${PORT}`);
  console.log('Bot is running...');
});

export { bot };
