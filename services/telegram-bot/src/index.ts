import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { handleMessage } from './handlers/messageHandler';
import { handleCallbackQuery } from './handlers/callbackHandler';
import { setupCommands } from './commands';
import axios from 'axios';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

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

let bot: TelegramBot;
try {
  bot = new TelegramBot(token, { polling: true });
  console.log('✅ Telegram Bot инициализирован успешно');
} catch (error: any) {
  console.error('❌ Ошибка инициализации Telegram Bot:', error.message);
  console.error('');
  console.error('Возможные причины:');
  console.error('1. Неверный токен бота');
  console.error('2. Бот был удален в @BotFather');
  console.error('3. Проблемы с сетевым подключением');
  console.error('');
  console.error('Проверьте токен в .env файле и попробуйте снова.');
  process.exit(1);
}
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
        text = `✅ Ваш заказ №${orderData.orderNumber} подтвержден!\n\nСумма: ${orderData.totalAmount} сом\nАдрес доставки: ${orderData.deliveryAddress}`;
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
  console.error('❌ Ошибка polling Telegram Bot:', error.message);
  
  if (error.message.includes('401')) {
    console.error('');
    console.error('Ошибка авторизации (401):');
    console.error('- Токен бота недействителен');
    console.error('- Проверьте токен в .env файле');
    console.error('- Убедитесь, что бот не был удален в @BotFather');
  } else if (error.message.includes('409')) {
    console.error('');
    console.error('Конфликт (409):');
    console.error('- Бот уже запущен в другом месте');
    console.error('- Остановите другие экземпляры бота');
  } else if (error.message.includes('ETELEGRAM')) {
    console.error('');
    console.error('Ошибка Telegram API:');
    console.error('- Проверьте интернет-соединение');
    console.error('- Telegram API может быть временно недоступен');
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Telegram Bot Service started on port ${PORT}`);
  console.log('Bot is running...');
});

export { bot };
