// Простой скрипт для тестирования Backend API
const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Тестирование Backend API...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Проверка health endpoint...');
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Health:', health.data);
    console.log();

    // 2. Login
    console.log('2️⃣ Вход как admin...');
    const login = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const token = login.data.token;
    console.log('✅ Токен получен:', token.substring(0, 20) + '...');
    console.log('✅ Оператор:', login.data.operator.name);
    console.log();

    // 3. Get customers
    console.log('3️⃣ Получение списка клиентов...');
    const customers = await axios.get(`${API_URL}/api/customers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Найдено клиентов:', customers.data.total);
    if (customers.data.customers.length > 0) {
      console.log('   Первый клиент:', customers.data.customers[0].name || customers.data.customers[0].firstName);
    }
    console.log();

    // 4. Get products
    console.log('4️⃣ Получение списка товаров...');
    const products = await axios.get(`${API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Найдено товаров:', products.data.total);
    products.data.products.slice(0, 3).forEach(p => {
      console.log(`   - ${p.name}: ${p.price} руб.`);
    });
    console.log();

    // 5. Get chat sessions
    console.log('5️⃣ Получение чат-сессий...');
    const sessions = await axios.get(`${API_URL}/api/chat-sessions?active=true`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Активных сессий:', sessions.data.sessions.length);
    console.log();

    console.log('🎉 Все тесты пройдены успешно!');
    console.log('\n📊 Система работает корректно!');
    console.log('\n💡 Для полной функциональности добавьте TELEGRAM_BOT_TOKEN в .env');

  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

testAPI();
