const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testStatistics() {
  console.log('🔍 Тестирование API статистики...\n');

  try {
    // 1. Проверка health endpoint
    console.log('1. Проверка health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // 2. Попытка получить статистику без токена
    console.log('2. Попытка получить статистику без токена...');
    try {
      await axios.get(`${API_URL}/api/statistics`);
      console.log('❌ Ошибка: должна быть ошибка 401');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Правильно: требуется аутентификация (401)');
      } else {
        console.log('❌ Неожиданная ошибка:', error.message);
      }
    }
    console.log('');

    // 3. Получение токена
    console.log('3. Получение токена...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Токен получен');
    console.log('');

    // 4. Получение статистики с токеном
    console.log('4. Получение статистики с токеном...');
    const statsResponse = await axios.get(`${API_URL}/api/statistics?period=all`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Статистика получена успешно!');
    console.log('');
    console.log('📊 Общая статистика:');
    console.log('  - Всего клиентов:', statsResponse.data.statistics.overview.totalCustomers);
    console.log('  - Всего заказов:', statsResponse.data.statistics.overview.totalOrders);
    console.log('  - Выручка:', statsResponse.data.statistics.overview.totalRevenue, 'сом');
    console.log('  - Активные чаты:', statsResponse.data.statistics.overview.activeChatSessions);
    console.log('  - Всего сообщений:', statsResponse.data.statistics.overview.totalMessages);
    console.log('');

    console.log('📦 Товары:');
    console.log('  - Всего:', statsResponse.data.statistics.products.total);
    console.log('  - Низкий запас:', statsResponse.data.statistics.products.lowStock);
    console.log('  - Нет в наличии:', statsResponse.data.statistics.products.outOfStock);
    console.log('');

    console.log('🎉 Все тесты пройдены успешно!');
    console.log('');
    console.log('📝 Следующие шаги:');
    console.log('  1. Откройте http://localhost:3000/login');
    console.log('  2. Войдите в систему (admin / admin123)');
    console.log('  3. Перейдите в раздел "Статистика"');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    if (error.response) {
      console.error('   Статус:', error.response.status);
      console.error('   Данные:', error.response.data);
    }
    console.log('');
    console.log('💡 Возможные причины:');
    console.log('  1. Backend API не запущен (запустите: cd services/backend-api && npm run dev)');
    console.log('  2. База данных недоступна');
    console.log('  3. Неправильные учетные данные');
  }
}

testStatistics();
