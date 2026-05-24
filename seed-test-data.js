const axios = require('axios');

const API_URL = 'http://localhost:3001';

const testProducts = [
  {
    name: 'Джинсы slim fit',
    price: 3500,
    description: 'Стильные джинсы зауженного кроя',
    category: 'Джинсы',
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Синий', 'Черный', 'Серый'],
    inventory: 30,
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'
  },
  {
    name: 'Куртка демисезонная',
    price: 5500,
    description: 'Легкая куртка для весны и осени',
    category: 'Верхняя одежда',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Черный', 'Синий', 'Хаки'],
    inventory: 15,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'
  },
  {
    name: 'Мини юбка',
    price: 2500,
    description: 'Модная мини юбка',
    category: 'Юбки',
    sizes: ['S', 'M', 'L'],
    colors: ['Черный', 'Белый', 'Красный'],
    inventory: 20,
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500'
  },
  {
    name: 'Рубашка классическая',
    price: 2200,
    description: 'Деловая рубашка из хлопка',
    category: 'Рубашки',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Белый', 'Голубой', 'Черный'],
    inventory: 25,
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500'
  },
  {
    name: 'Футболка базовая',
    price: 1500,
    description: 'Классическая хлопковая футболка',
    category: 'Футболки',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Белый', 'Черный', 'Серый', 'Синий'],
    inventory: 40,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'
  },
  {
    name: 'Худи с капюшоном',
    price: 2800,
    description: 'Теплое худи из флиса',
    category: 'Толстовки',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Черный', 'Серый', 'Синий', 'Красный'],
    inventory: 12,
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500'
  },
  {
    name: 'Юбка плиссе',
    price: 2500,
    description: 'Элегантная плиссированная юбка',
    category: 'Юбки',
    sizes: ['S', 'M', 'L'],
    colors: ['Черный', 'Серый', 'Бежевый'],
    inventory: 18,
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500'
  },
  {
    name: 'Платье летнее',
    price: 3200,
    description: 'Легкое летнее платье',
    category: 'Платья',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Белый', 'Розовый', 'Голубой', 'Желтый'],
    inventory: 22,
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500'
  },
  {
    name: 'Свитер вязаный',
    price: 3800,
    description: 'Теплый вязаный свитер',
    category: 'Свитера',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Бежевый', 'Серый', 'Коричневый', 'Синий'],
    inventory: 14,
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500'
  },
  {
    name: 'Брюки классические',
    price: 3000,
    description: 'Деловые брюки со стрелками',
    category: 'Брюки',
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Черный', 'Серый', 'Синий'],
    inventory: 28,
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500'
  },
  {
    name: 'Пальто зимнее',
    price: 8500,
    description: 'Теплое зимнее пальто',
    category: 'Верхняя одежда',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Черный', 'Серый', 'Бежевый'],
    inventory: 8,
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500'
  },
  {
    name: 'Шорты джинсовые',
    price: 1800,
    description: 'Летние джинсовые шорты',
    category: 'Шорты',
    sizes: ['28', '30', '32', '34'],
    colors: ['Синий', 'Черный', 'Белый'],
    inventory: 35,
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500'
  }
];

async function seedTestData() {
  try {
    console.log('🔐 Вход как admin...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Токен получен\n');

    console.log('📦 Получение существующих товаров...');
    const existingResponse = await axios.get(`${API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const existingProducts = existingResponse.data.products;
    console.log(`✅ Найдено существующих товаров: ${existingProducts.length}\n`);

    console.log('🔄 Обновление/добавление товаров...\n');
    
    for (const product of testProducts) {
      // Проверяем существует ли товар
      const existing = existingProducts.find(p => p.name === product.name);
      
      try {
        if (existing) {
          // Обновляем существующий товар
          await axios.put(
            `${API_URL}/api/products/${existing.id}`,
            product,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          console.log(`✅ Обновлен: ${product.name}`);
          console.log(`   Цвета: ${product.colors.join(', ')}`);
          console.log(`   Размеры: ${product.sizes.join(', ')}`);
        } else {
          // Создаем новый товар
          await axios.post(
            `${API_URL}/api/products`,
            product,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          console.log(`✨ Создан: ${product.name}`);
          console.log(`   Цвета: ${product.colors.join(', ')}`);
          console.log(`   Размеры: ${product.sizes.join(', ')}`);
        }
      } catch (error) {
        console.error(`❌ Ошибка для ${product.name}:`, error.response?.data || error.message);
      }
      
      console.log('');
    }

    console.log('📊 Итоговая статистика...');
    const finalResponse = await axios.get(`${API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const finalProducts = finalResponse.data.products;
    console.log(`\n✅ Всего товаров в базе: ${finalProducts.length}`);
    
    const withColors = finalProducts.filter(p => p.colors && Array.isArray(p.colors) && p.colors.length > 0);
    const withSizes = finalProducts.filter(p => p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0);
    const withImages = finalProducts.filter(p => p.imageUrl);
    
    console.log(`✅ С цветами: ${withColors.length}`);
    console.log(`✅ С размерами: ${withSizes.length}`);
    console.log(`✅ С изображениями: ${withImages.length}`);

    console.log('\n🎉 Тестовые данные успешно добавлены!');
    console.log('🔄 Обновите страницу http://localhost:3000/products');
    console.log('📱 Протестируйте бота: напишите "джинсы" или "платье"');

  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

seedTestData();
