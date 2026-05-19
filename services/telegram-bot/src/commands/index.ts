import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const API_URL = process.env.BOT_API_URL || 'http://localhost:3001';

export const setupCommands = (bot: TelegramBot) => {
  // /start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString();
    const username = msg.from?.username;
    const firstName = msg.from?.first_name;

    try {
      // Create or get customer
      await axios.post(`${API_URL}/api/public/customers`, {
        telegramUserId: userId,
        username,
        firstName
      });

      // Get customer
      const customerResponse = await axios.get(
        `${API_URL}/api/public/customers/telegram/${userId}`
      );
      const customer = customerResponse.data.customer;

      if (customer) {
        // Create chat session
        await axios.post(`${API_URL}/api/public/chat-sessions`, {
          customerId: customer.id
        });
      }

      const welcomeText = `
👋 Добро пожаловать в магазин одежды!

Я помогу вам:
• Просмотреть каталог товаров
• Оформить заказ
• Отследить статус заказа
• Получить консультацию

Выберите действие с помощью кнопок ниже:
      `;

      // Create keyboard with buttons
      const keyboard = {
        keyboard: [
          [{ text: '🛍️ Каталог товаров' }, { text: '📦 Мои заказы' }],
          [{ text: '❓ Помощь' }, { text: '📞 Связаться с оператором' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      };

      await bot.sendMessage(chatId, welcomeText.trim(), {
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error in /start command:', error);
      await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
    }
  });

  // /catalog command and button handler
  const handleCatalog = async (chatId: number) => {
    try {
      const response = await axios.get(`${API_URL}/api/public/products?limit=10`);
      const products = response.data.products;

      if (products.length === 0) {
        await bot.sendMessage(chatId, 'Каталог пока пуст.');
        return;
      }

      let catalogText = '🛍️ *Каталог товаров:*\n\n';
      
      products.forEach((product: any, index: number) => {
        catalogText += `${index + 1}. *${product.name}*\n`;
        catalogText += `   💰 Цена: ${product.price} руб.\n`;
        if (product.description) {
          catalogText += `   📝 ${product.description}\n`;
        }
        if (product.sizes && Array.isArray(product.sizes)) {
          catalogText += `   📏 Размеры: ${product.sizes.join(', ')}\n`;
        }
        catalogText += `   📦 В наличии: ${product.inventory} шт.\n\n`;
      });

      await bot.sendMessage(chatId, catalogText, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in catalog:', error);
      await bot.sendMessage(chatId, 'Не удалось загрузить каталог. Попробуйте позже.');
    }
  };

  bot.onText(/\/catalog/, async (msg) => {
    await handleCatalog(msg.chat.id);
  });

  // /orders command and button handler
  const handleOrders = async (chatId: number, userId: string) => {
    try {
      // Get orders using public endpoint
      const ordersResponse = await axios.get(
        `${API_URL}/api/public/customers/telegram/${userId}/orders`
      );
      
      const orders = ordersResponse.data.orders;

      if (orders.length === 0) {
        await bot.sendMessage(chatId, '📦 У вас пока нет заказов.');
        return;
      }

      let ordersText = '📦 *Ваши заказы:*\n\n';
      
      orders.forEach((order: any) => {
        ordersText += `*Заказ №${order.orderNumber}*\n`;
        ordersText += `Статус: ${getStatusEmoji(order.status)} ${getStatusText(order.status)}\n`;
        ordersText += `Сумма: ${order.totalAmount} руб.\n`;
        ordersText += `Дата: ${new Date(order.createdAt).toLocaleDateString('ru-RU')}\n\n`;
      });

      await bot.sendMessage(chatId, ordersText, { parse_mode: 'Markdown' });
    } catch (error: any) {
      console.error('Error in orders:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        await bot.sendMessage(chatId, '📦 У вас пока нет заказов. Используйте /start для регистрации.');
      } else {
        await bot.sendMessage(chatId, 'Не удалось загрузить заказы. Попробуйте позже.');
      }
    }
  };

  bot.onText(/\/orders/, async (msg) => {
    const userId = msg.from?.id.toString();
    if (userId) {
      await handleOrders(msg.chat.id, userId);
    }
  });

  // /help command and button handler
  const handleHelp = async (chatId: number) => {
    const helpText = `
📚 *Помощь*

*Доступные команды:*
🛍️ Каталог товаров - Посмотреть все товары
📦 Мои заказы - Просмотр ваших заказов
❓ Помощь - Показать эту справку
📞 Связаться с оператором - Написать оператору

*Часто задаваемые вопросы:*

*Как оформить заказ?*
Просмотрите каталог и напишите оператору о желаемом товаре.

*Способы доставки:*
• Курьерская доставка по городу
• Доставка в пункт выдачи
• Почта России

*Способы оплаты:*
• Наличными при получении
• Картой при получении
• Онлайн-оплата

*Возврат и обмен:*
В течение 14 дней с момента получения товара.

Для связи с оператором просто напишите сообщение!
    `;

    await bot.sendMessage(chatId, helpText.trim(), { parse_mode: 'Markdown' });
  };

  bot.onText(/\/help/, async (msg) => {
    await handleHelp(msg.chat.id);
  });

  // Handle button clicks
  bot.on('message', async (msg) => {
    // Skip if it's a command
    if (msg.text?.startsWith('/')) return;

    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString();
    const text = msg.text;

    if (!text || !userId) return;

    // Handle button presses
    if (text === '🛍️ Каталог товаров') {
      await handleCatalog(chatId);
    } else if (text === '📦 Мои заказы') {
      await handleOrders(chatId, userId);
    } else if (text === '❓ Помощь') {
      await handleHelp(chatId);
    } else if (text === '📞 Связаться с оператором') {
      await bot.sendMessage(
        chatId,
        '👤 Напишите ваше сообщение, и оператор скоро ответит вам.'
      );
    }
  });
};

function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    NEW: '🆕',
    CONFIRMED: '✅',
    PROCESSING: '⚙️',
    SHIPPED: '📦',
    DELIVERED: '🎉',
    CANCELLED: '❌'
  };
  return emojis[status] || '📋';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    NEW: 'Новый',
    CONFIRMED: 'Подтвержден',
    PROCESSING: 'В обработке',
    SHIPPED: 'Отправлен',
    DELIVERED: 'Доставлен',
    CANCELLED: 'Отменен'
  };
  return texts[status] || status;
}
