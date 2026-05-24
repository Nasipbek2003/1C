const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function checkOperatorLogin() {
  console.log('🔐 Проверка входа операторов...\n');

  const testCredentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'operator', password: 'operator123' },
    { username: 'operator', password: 'password123' },
    { username: 'operator', password: '123456' },
  ];

  for (const creds of testCredentials) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, creds);
      console.log(`✅ ${creds.username} / ${creds.password} - УСПЕШНО`);
      console.log(`   Имя: ${response.data.operator.name}`);
    } catch (error) {
      console.log(`❌ ${creds.username} / ${creds.password} - НЕВЕРНО`);
    }
  }

  console.log('\n💡 Если нужно сбросить пароль оператора:');
  console.log('   1. Войдите как admin (admin/admin123)');
  console.log('   2. Откройте http://localhost:3000/operators');
  console.log('   3. Нажмите "Редактировать" на операторе');
  console.log('   4. Введите новый пароль');
  console.log('   5. Сохраните');
}

checkOperatorLogin();
