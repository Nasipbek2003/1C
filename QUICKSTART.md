# Быстрый старт

## Шаг 1: Установка зависимостей

```bash
npm install
```

## Шаг 2: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
cp .env.example .env
```

Минимальная конфигурация для запуска:

```env
# Database (уже настроена)
DATABASE_URL="postgresql://neondb_owner:npg_XVKeSlH9Q3Pj@ep-raspy-union-ap8x34an-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Telegram Bot Token (получите у @BotFather в Telegram)
TELEGRAM_BOT_TOKEN="your_bot_token_here"

# JWT Secret (любая случайная строка)
JWT_SECRET="my-super-secret-jwt-key-12345"

# Остальные настройки можно оставить по умолчанию
```

### Как получить Telegram Bot Token:

1. Откройте Telegram и найдите @BotFather
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Скопируйте полученный токен в `.env`

## Шаг 3: Инициализация базы данных

```bash
# Генерация Prisma Client
cd services/backend-api
npm run db:generate

# Применение схемы к базе данных
npm run db:push

# Заполнение тестовыми данными
npm run db:seed
```

После выполнения вы получите:
- 2 оператора (admin/admin123 и operator/operator123)
- 5 тестовых товаров
- 1 тестового клиента с чат-сессией

## Шаг 4: Запуск системы

Вернитесь в корневую директорию и запустите все сервисы:

```bash
cd ../..
npm run dev
```

Это запустит:
- ✅ Backend API на http://localhost:3001
- ✅ Telegram Bot на http://localhost:3002
- ✅ 1C Integration на http://localhost:3003

## Шаг 5: Проверка работы

### Проверка Backend API

Откройте в браузере: http://localhost:3001/health

Должны увидеть:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Проверка Telegram Bot

1. Найдите вашего бота в Telegram (по имени, которое вы указали при создании)
2. Отправьте команду `/start`
3. Бот должен ответить приветственным сообщением

### Проверка 1C Integration

Откройте в браузере: http://localhost:3003/health

## Шаг 6: Тестирование функционала

### Тест 1: Команды бота

В Telegram боте попробуйте:
- `/start` - Приветствие
- `/catalog` - Просмотр каталога (5 товаров)
- `/orders` - Ваши заказы
- `/help` - Справка

### Тест 2: API запросы

Войдите как оператор:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Получите токен из ответа и используйте его для других запросов:

```bash
# Получить список клиентов
curl http://localhost:3001/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Получить список товаров
curl http://localhost:3001/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Шаг 7: Просмотр базы данных

Запустите Prisma Studio для визуального просмотра данных:

```bash
cd services/backend-api
npm run db:studio
```

Откроется http://localhost:5555 с интерфейсом для просмотра всех таблиц.

## Следующие шаги

### Разработка Web Interface

Web-интерфейс для операторов еще не реализован. Для его создания:

```bash
cd apps/web-interface
# Создайте Next.js приложение
npx create-next-app@latest . --typescript --tailwind --app
```

### Настройка интеграции с 1С

Если у вас есть доступ к API 1С, настройте в `.env`:

```env
C1_API_URL="https://your-1c-system.com/api"
C1_API_USERNAME="your_username"
C1_API_PASSWORD="your_password"
```

Затем запустите синхронизацию:

```bash
# Синхронизация товаров
curl -X POST http://localhost:3003/api/1c/sync-products

# Синхронизация клиентов
curl -X POST http://localhost:3003/api/1c/sync-customers
```

## Troubleshooting

### Ошибка "Cannot find module '@prisma/client'"

```bash
cd services/backend-api
npm run db:generate
```

### Ошибка подключения к базе данных

Проверьте `DATABASE_URL` в `.env` и доступность Neon DB.

### Telegram Bot не отвечает

1. Проверьте `TELEGRAM_BOT_TOKEN` в `.env`
2. Убедитесь, что сервис запущен (должно быть сообщение "Bot is running...")
3. Проверьте логи в консоли

### Порт уже занят

Измените порты в `.env`:

```env
API_PORT=3011
BOT_PORT=3012
C1_INTEGRATION_PORT=3013
```

## Полезные команды

```bash
# Остановить все сервисы
Ctrl+C

# Запустить только Backend API
npm run dev:api

# Запустить только Telegram Bot
npm run dev:bot

# Запустить только 1C Integration
npm run dev:1c

# Просмотр логов в базе данных
cd services/backend-api
npm run db:studio
# Откройте таблицу SystemLog
```

## Структура учетных записей

После `db:seed` доступны:

**Операторы:**
- Username: `admin`, Password: `admin123`
- Username: `operator`, Password: `operator123`

**Тестовый клиент:**
- Telegram User ID: `123456789`
- Username: `test_user`
- Phone: `+79991234567`

**Товары:**
- 5 товаров в разных категориях
- Цены от 1500 до 5500 руб.

## Дополнительная информация

Подробная документация в файле [README.md](./README.md)
