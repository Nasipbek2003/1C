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
• 🔍 Найти товары по названию
• 🏷️ Просмотреть товары по категориям
• 📦 Оформить заказ
• 📋 Отследить статус заказа
• 💬 Получить консультацию

Выберите действие с помощью кнопок ниже или просто напишите название товара для поиска:
      `;

      // Create keyboard with buttons
      const keyboard = {
        keyboard: [
          [{ text: '🏷️ Категории' }, { text: '🔍 Поиск' }],
          [{ text: '📦 Мои заказы' }, { text: '❓ Помощь' }],
          [{ text: '📞 Связаться с оператором' }]
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

      await bot.sendMessage(chatId, '🛍️ *Каталог товаров:*\n\nПросматривайте товары ниже:', { 
        parse_mode: 'Markdown' 
      });

      // Send each product as a separate message with photo
      for (const product of products) {
        let caption = `*${product.name}*\n\n`;
        caption += `💰 Цена: *${product.price} сом*\n`;
        
        if (product.description) {
          caption += `📝 ${product.description}\n`;
        }
        
        if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
          caption += `📏 Размеры: ${product.sizes.join(', ')}\n`;
        }
        
        if (product.category) {
          caption += `🏷️ Категория: ${product.category}\n`;
        }
        
        caption += `📦 В наличии: ${product.inventory} шт.\n`;
        
        // Add order button
        const keyboard = {
          inline_keyboard: [
            [
              { 
                text: '🛒 Заказать', 
                callback_data: `order_${product.id}` 
              },
              { 
                text: 'ℹ️ Подробнее', 
                callback_data: `details_${product.id}` 
              }
            ]
          ]
        };

        try {
          if (product.imageUrl) {
            // Send with photo
            await bot.sendPhoto(chatId, product.imageUrl, {
              caption: caption,
              parse_mode: 'Markdown',
              reply_markup: keyboard
            });
          } else {
            // Send without photo
            await bot.sendMessage(chatId, caption, {
              parse_mode: 'Markdown',
              reply_markup: keyboard
            });
          }
        } catch (photoError) {
          console.error('Error sending product photo:', photoError);
          // Fallback: send without photo
          await bot.sendMessage(chatId, caption, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      await bot.sendMessage(chatId, '✨ Это все товары в каталоге!\n\nДля заказа нажмите кнопку "🛒 Заказать" под товаром.');
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
        ordersText += `Сумма: ${order.totalAmount} сом\n`;
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
🔍 Поиск - Найти товары по названию
🏷️ Категории - Товары по категориям
📦 Мои заказы - Просмотр ваших заказов
❓ Помощь - Показать эту справку
📞 Связаться с оператором - Написать оператору

*Как найти товар:*
Просто напишите название товара (например: "джинсы", "куртка")

*Как заказать товар:*
1. Найдите товар через поиск или категории
2. Просмотрите товары с фотографиями
3. Нажмите "🛒 Заказать" под понравившимся товаром
4. Следуйте инструкциям для оформления

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

  // /categories command - show product categories
  bot.onText(/\/categories/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const response = await axios.get(`${API_URL}/api/public/products`);
      const products = response.data.products;
      
      // Get unique categories
      const categories = [...new Set(products
        .map((p: any) => p.category)
        .filter((c: any) => c)
      )];

      if (categories.length === 0) {
        await bot.sendMessage(chatId, 'Категории пока не добавлены.');
        return;
      }

      const keyboard = {
        inline_keyboard: categories.map((category: string) => [
          { text: `🏷️ ${category}`, callback_data: `category_${category}` }
        ])
      };

      await bot.sendMessage(
        chatId, 
        '🏷️ *Выберите категорию:*',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      console.error('Error in categories:', error);
      await bot.sendMessage(chatId, 'Не удалось загрузить категории.');
    }
  });

  // Handle callback queries (inline button clicks)
  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id;
    const userId = query.from.id.toString();
    const data = query.data;

    if (!chatId || !data) return;

    try {
      if (data.startsWith('order_')) {
        const productId = data.replace('order_', '');
        
        // Get product details
        const productResponse = await axios.get(`${API_URL}/api/public/products/${productId}`);
        const product = productResponse.data.product;

        await bot.answerCallbackQuery(query.id, {
          text: '✅ Товар добавлен в корзину!'
        });

        const orderText = `
🛒 *Оформление заказа*

Товар: *${product.name}*
Цена: *${product.price} сом*

Для завершения заказа:
1. Укажите размер (если нужно)
2. Укажите адрес доставки
3. Выберите способ оплаты

Напишите оператору для оформления заказа или используйте кнопку ниже:
        `;

        const keyboard = {
          inline_keyboard: [
            [{ text: '📞 Связаться с оператором', callback_data: 'contact_operator' }],
            [{ text: '🛍️ Продолжить покупки', callback_data: 'continue_shopping' }]
          ]
        };

        await bot.sendMessage(chatId, orderText.trim(), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });

      } else if (data.startsWith('details_')) {
        const productId = data.replace('details_', '');
        
        // Get product details
        const productResponse = await axios.get(`${API_URL}/api/public/products/${productId}`);
        const product = productResponse.data.product;

        await bot.answerCallbackQuery(query.id);

        let detailsText = `📋 *Подробная информация*\n\n`;
        detailsText += `*${product.name}*\n\n`;
        detailsText += `💰 Цена: *${product.price} сом*\n`;
        
        if (product.description) {
          detailsText += `\n📝 Описание:\n${product.description}\n`;
        }
        
        if (product.category) {
          detailsText += `\n🏷️ Категория: ${product.category}\n`;
        }
        
        if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
          detailsText += `\n📏 Доступные размеры:\n${product.sizes.join(', ')}\n`;
        }
        
        if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
          detailsText += `\n🎨 Доступные цвета:\n${product.colors.join(', ')}\n`;
        }
        
        detailsText += `\n📦 В наличии: ${product.inventory} шт.\n`;
        
        const keyboard = {
          inline_keyboard: [
            [{ text: '🛒 Заказать', callback_data: `order_${product.id}` }],
            [{ text: '🛍️ Вернуться к каталогу', callback_data: 'show_catalog' }]
          ]
        };

        await bot.sendMessage(chatId, detailsText, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });

      } else if (data === 'contact_operator') {
        await bot.answerCallbackQuery(query.id);
        await bot.sendMessage(
          chatId,
          '👤 Напишите ваше сообщение, и оператор скоро ответит вам.\n\nВы можете указать:\n• Желаемый товар\n• Размер\n• Адрес доставки\n• Способ оплаты'
        );

      } else if (data === 'continue_shopping' || data === 'show_catalog') {
        await bot.answerCallbackQuery(query.id);
        await handleCatalog(chatId);
        
      } else if (data.startsWith('category_')) {
        const category = data.replace('category_', '');
        await bot.answerCallbackQuery(query.id);
        
        // Get products by category
        const response = await axios.get(`${API_URL}/api/public/products`);
        const products = response.data.products.filter((p: any) => p.category === category);
        
        if (products.length === 0) {
          await bot.sendMessage(chatId, `В категории "${category}" пока нет товаров.`);
          return;
        }

        await bot.sendMessage(chatId, `🏷️ *Категория: ${category}*\n\nТоваров: ${products.length}`, {
          parse_mode: 'Markdown'
        });

        // Send products with photos
        for (const product of products) {
          let caption = `*${product.name}*\n\n`;
          caption += `💰 Цена: *${product.price} сом*\n`;
          
          if (product.description) {
            caption += `📝 ${product.description}\n`;
          }
          
          if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
            caption += `📏 Размеры: ${product.sizes.join(', ')}\n`;
          }
          
          if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
            caption += `🎨 Цвета: ${product.colors.join(', ')}\n`;
          }
          
          caption += `📦 В наличии: ${product.inventory} шт.\n`;
          
          const keyboard = {
            inline_keyboard: [
              [
                { text: '🛒 Заказать', callback_data: `order_${product.id}` },
                { text: 'ℹ️ Подробнее', callback_data: `details_${product.id}` }
              ]
            ]
          };

          try {
            if (product.imageUrl) {
              await bot.sendPhoto(chatId, product.imageUrl, {
                caption: caption,
                parse_mode: 'Markdown',
                reply_markup: keyboard
              });
            } else {
              await bot.sendMessage(chatId, caption, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
              });
            }
          } catch (photoError) {
            console.error('Error sending product photo:', photoError);
            await bot.sendMessage(chatId, caption, {
              parse_mode: 'Markdown',
              reply_markup: keyboard
            });
          }

          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

    } catch (error) {
      console.error('Error handling callback query:', error);
      await bot.answerCallbackQuery(query.id, {
        text: 'Произошла ошибка. Попробуйте позже.',
        show_alert: true
      });
    }
  });

  // Handle button clicks and search
  bot.on('message', async (msg) => {
    // Skip if it's a command
    if (msg.text?.startsWith('/')) return;

    const chatId = msg.chat.id;
    const userId = msg.from?.id.toString();
    const text = msg.text;

    if (!text || !userId) return;

    // Handle button presses
    if (text === '🔍 Поиск') {
      await bot.sendMessage(
        chatId,
        '🔍 *Поиск товаров*\n\nНапишите название или описание товара, который вы ищете.\n\nНапример: "джинсы", "куртка", "футболка"',
        { parse_mode: 'Markdown' }
      );
    } else if (text === '🏷️ Категории') {
      // Show categories
      try {
        const response = await axios.get(`${API_URL}/api/public/products`);
        const products = response.data.products;
        
        const categories = [...new Set(products
          .map((p: any) => p.category)
          .filter((c: any) => c)
        )];

        if (categories.length === 0) {
          await bot.sendMessage(chatId, 'Категории пока не добавлены.');
          return;
        }

        const keyboard = {
          inline_keyboard: categories.map((category: string) => [
            { text: `🏷️ ${category}`, callback_data: `category_${category}` }
          ])
        };

        await bot.sendMessage(
          chatId, 
          '🏷️ *Выберите категорию:*',
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          }
        );
      } catch (error) {
        console.error('Error showing categories:', error);
        await bot.sendMessage(chatId, 'Не удалось загрузить категории.');
      }
    } else if (text === '📦 Мои заказы') {
      await handleOrders(chatId, userId);
    } else if (text === '❓ Помощь') {
      await handleHelp(chatId);
    } else if (text === '📞 Связаться с оператором') {
      await bot.sendMessage(
        chatId,
        '👤 Напишите ваше сообщение, и оператор скоро ответит вам.'
      );
    } else {
      // Search for products by text
      try {
        const response = await axios.get(`${API_URL}/api/public/products`);
        const products = response.data.products;
        
        const searchText = text.toLowerCase();
        const foundProducts = products.filter((p: any) => 
          p.name.toLowerCase().includes(searchText) || 
          (p.description && p.description.toLowerCase().includes(searchText)) ||
          (p.category && p.category.toLowerCase().includes(searchText))
        );

        if (foundProducts.length === 0) {
          await bot.sendMessage(
            chatId,
            `🔍 По запросу "${text}" ничего не найдено.\n\nПопробуйте:\n• Изменить запрос\n• Использовать кнопку "🏷️ Категории"\n• Связаться с оператором`
          );
          return;
        }

        await bot.sendMessage(
          chatId,
          `🔍 Найдено товаров: ${foundProducts.length}\n\nПоказываю результаты:`,
          { parse_mode: 'Markdown' }
        );

        // Show found products (limit to 10)
        for (const product of foundProducts.slice(0, 10)) {
          let caption = `*${product.name}*\n\n`;
          caption += `💰 Цена: *${product.price} сом*\n`;
          
          if (product.description) {
            caption += `📝 ${product.description}\n`;
          }
          
          if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
            caption += `📏 Размеры: ${product.sizes.join(', ')}\n`;
          }
          
          if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
            caption += `🎨 Цвета: ${product.colors.join(', ')}\n`;
          }
          
          if (product.category) {
            caption += `🏷️ Категория: ${product.category}\n`;
          }
          
          caption += `📦 В наличии: ${product.inventory} шт.\n`;
          
          const keyboard = {
            inline_keyboard: [
              [
                { text: '🛒 Заказать', callback_data: `order_${product.id}` },
                { text: 'ℹ️ Подробнее', callback_data: `details_${product.id}` }
              ]
            ]
          };

          try {
            if (product.imageUrl) {
              await bot.sendPhoto(chatId, product.imageUrl, {
                caption: caption,
                parse_mode: 'Markdown',
                reply_markup: keyboard
              });
            } else {
              await bot.sendMessage(chatId, caption, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
              });
            }
          } catch (photoError) {
            console.error('Error sending product photo:', photoError);
            await bot.sendMessage(chatId, caption, {
              parse_mode: 'Markdown',
              reply_markup: keyboard
            });
          }

          await new Promise(resolve => setTimeout(resolve, 300));
        }

        if (foundProducts.length > 10) {
          await bot.sendMessage(
            chatId,
            `Показано 10 из ${foundProducts.length} товаров. Уточните запрос для более точного поиска.`
          );
        }
      } catch (error) {
        console.error('Error searching products:', error);
        await bot.sendMessage(chatId, 'Произошла ошибка при поиске. Попробуйте позже.');
      }
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
