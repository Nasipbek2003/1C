import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const API_URL = process.env.BOT_API_URL || 'http://localhost:3001';

const FAQ_RESPONSES: Record<string, string> = {
  'режим работы': '🕐 Мы работаем ежедневно с 9:00 до 21:00',
  'доставка': '📦 Доступна курьерская доставка, доставка в пункт выдачи и Почта России',
  'оплата': '💳 Принимаем наличные и карты при получении, а также онлайн-оплату',
  'возврат': '↩️ Возврат и обмен возможны в течение 14 дней с момента получения'
};

export const handleMessage = async (bot: TelegramBot, msg: TelegramBot.Message) => {
  // Skip commands
  if (msg.text?.startsWith('/')) {
    return;
  }

  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString();
  const text = msg.text?.toLowerCase() || '';

  try {
    // Get or create customer
    const customerResponse = await axios.get(
      `${API_URL}/api/public/customers/telegram/${userId}`
    ).catch(async () => {
      // Create customer if not exists
      const createResponse = await axios.post(`${API_URL}/api/public/customers`, {
        telegramUserId: userId,
        username: msg.from?.username,
        firstName: msg.from?.first_name
      });
      return createResponse;
    });
    
    const customer = customerResponse.data.customer;

    // Get or create active chat session
    const sessionsResponse = await axios.get(
      `${API_URL}/api/chat-sessions?customerId=${customer.id}&active=true`
    ).catch(async () => {
      // Create session if not exists
      const createSessionResponse = await axios.post(`${API_URL}/api/public/chat-sessions`, {
        customerId: customer.id
      });
      return createSessionResponse;
    });
    
    const chatSession = sessionsResponse.data.session || sessionsResponse.data.sessions[0];

    // Save message to database
    await axios.post(`${API_URL}/api/public/messages`, {
      chatSessionId: chatSession.id,
      senderId: userId!,
      senderType: 'CUSTOMER',
      content: msg.text || ''
    });

    // Check for FAQ responses
    let responded = false;
    for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
      if (text.includes(keyword)) {
        await bot.sendMessage(chatId, response);
        responded = true;
        break;
      }
    }

    // If no FAQ match, notify operator
    if (!responded) {
      await bot.sendMessage(
        chatId,
        'Спасибо за ваше сообщение! Оператор скоро ответит вам.'
      );
    }
  } catch (error) {
    console.error('Error handling message:', error);
    await bot.sendMessage(
      chatId,
      'Произошла ошибка при обработке сообщения. Попробуйте позже.'
    );
  }
};
