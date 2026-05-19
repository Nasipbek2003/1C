import TelegramBot from 'node-telegram-bot-api';

export const handleCallbackQuery = async (
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery
) => {
  const chatId = query.message?.chat.id;
  const data = query.data;

  if (!chatId || !data) {
    return;
  }

  try {
    // Handle different callback actions
    if (data.startsWith('product_')) {
      const productId = data.replace('product_', '');
      await bot.sendMessage(
        chatId,
        `Вы выбрали товар. Для оформления заказа свяжитесь с оператором.`
      );
    }

    // Answer callback query to remove loading state
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Error handling callback query:', error);
  }
};
