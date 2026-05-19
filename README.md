# Система автоматизации клиентских коммуникаций

Система для автоматизации коммуникаций с клиентами магазина одежды через Telegram-бота с интеграцией 1С.

## Архитектура

Система состоит из следующих компонентов:

- **Backend API Service** (Node.js + Express) - REST API и WebSocket сервер
- **Telegram Bot Service** (Node.js + node-telegram-bot-api) - Telegram бот для клиентов
- **1C Integration Service** (Node.js) - Синхронизация с системой 1С
- **Web Interface** (Next.js + React) - Веб-интерфейс для операторов
- **PostgreSQL Database** (Neon DB) - Хранилище данных

## Требования

- Node.js 18+
- npm или yarn
- PostgreSQL (используется Neon DB)
- Telegram Bot Token

## Установка

### 1. Клонирование и установка зависимостей

```bash
# Установка зависимостей для всех сервисов
npm install

# Установка зависимостей в каждом workspace
npm install --workspaces
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните необходимые значения:

```bash
cp .env.example .env
```

Обязательные переменные:

```env
# Database
DATABASE_URL="postgresql://neondb_owner:npg_XVKeSlH9Q3Pj@ep-raspy-union-ap8x34an-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your_telegram_bot_token_here"

# JWT Secret
JWT_SECRET="your_secure_jwt_secret_here"

# 1C Integration (опционально)
C1_API_URL="https://your-1c-system.com/api"
C1_API_USERNAME="1c_api_user"
C1_API_PASSWORD="1c_api_password"
```

### 3. Инициализация базы данных

```bash
# Генерация Prisma Client
npm run db:generate

# Применение схемы к базе данных
npm run db:push
```

### 4. Создание первого оператора

Подключитесь к базе данных и создайте оператора:

```sql
INSERT INTO "Operator" (id, username, "passwordHash", name, "isActive", "createdAt")
VALUES (
  gen_random_uuid(),
  'admin',
  '$2b$10$YourHashedPasswordHere', -- используйте bcrypt для хеширования
  'Администратор',
  true,
  NOW()
);
```

Или используйте Node.js скрипт для создания хеша пароля:

```javascript
const bcrypt = require('bcrypt');
const password = 'your_password';
bcrypt.hash(password, 10).then(hash => console.log(hash));
```

## Запуск

### Режим разработки

Запустить все сервисы одновременно:

```bash
npm run dev
```

Или запустить сервисы по отдельности:

```bash
# Backend API
npm run dev:api

# Telegram Bot
npm run dev:bot

# 1C Integration
npm run dev:1c

# Web Interface
npm run dev:web
```

### Режим production

```bash
# Сборка всех сервисов
npm run build

# Запуск каждого сервиса
cd services/backend-api && npm start
cd services/telegram-bot && npm start
cd services/1c-integration && npm start
cd apps/web-interface && npm start
```

## Порты по умолчанию

- Backend API: `3001`
- Telegram Bot Service: `3002`
- 1C Integration Service: `3003`
- Web Interface: `3000`

## API Endpoints

### Backend API (http://localhost:3001)

#### Аутентификация
- `POST /api/auth/login` - Вход оператора
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Получить текущего пользователя

#### Клиенты
- `GET /api/customers` - Список клиентов
- `GET /api/customers/:id` - Информация о клиенте
- `POST /api/customers` - Создать клиента
- `PUT /api/customers/:id` - Обновить клиента

#### Товары
- `GET /api/products` - Список товаров
- `GET /api/products/:id` - Информация о товаре

#### Заказы
- `GET /api/orders` - Список заказов
- `GET /api/orders/:id` - Информация о заказе
- `POST /api/orders` - Создать заказ
- `PUT /api/orders/:id/status` - Обновить статус заказа

#### Чат-сессии
- `GET /api/chat-sessions` - Список чат-сессий
- `GET /api/chat-sessions/:id/messages` - Сообщения сессии

#### Сообщения
- `POST /api/messages` - Отправить сообщение

#### Уведомления
- `GET /api/notifications` - Список уведомлений
- `POST /api/notifications` - Создать уведомление

### Telegram Bot Service (http://localhost:3002)

- `POST /api/send-message` - Отправить сообщение клиенту
- `POST /api/send-notification` - Отправить уведомление

### 1C Integration Service (http://localhost:3003)

- `POST /api/1c/sync-products` - Синхронизировать товары
- `POST /api/1c/sync-customers` - Синхронизировать клиентов
- `POST /api/1c/orders` - Отправить заказ в 1С
- `GET /api/1c/orders/:orderNumber/status` - Получить статус заказа

## Telegram Bot Команды

- `/start` - Начать работу с ботом
- `/catalog` - Просмотр каталога товаров
- `/orders` - Мои заказы
- `/help` - Справка

## Структура проекта

```
.
├── services/
│   ├── backend-api/          # Backend API Service
│   │   ├── src/
│   │   │   ├── routes/       # API маршруты
│   │   │   ├── middleware/   # Middleware
│   │   │   ├── utils/        # Утилиты
│   │   │   └── index.ts      # Точка входа
│   │   └── prisma/
│   │       └── schema.prisma # Схема базы данных
│   ├── telegram-bot/         # Telegram Bot Service
│   │   └── src/
│   │       ├── commands/     # Команды бота
│   │       ├── handlers/     # Обработчики
│   │       └── index.ts
│   └── 1c-integration/       # 1C Integration Service
│       └── src/
│           ├── sync/         # Синхронизация
│           ├── api/          # API интеграции
│           ├── client/       # 1C клиент
│           └── index.ts
├── apps/
│   └── web-interface/        # Web Interface (Next.js)
├── .kiro/
│   └── specs/                # Спецификации проекта
└── package.json
```

## Разработка

### Просмотр базы данных

```bash
npm run db:studio
```

Откроется Prisma Studio на http://localhost:5555

### Миграции базы данных

```bash
# Создать миграцию
npm run db:migrate

# Применить схему без миграции
npm run db:push
```

## Интеграция с 1С

Система ожидает следующие API endpoints от системы 1С:

- `GET /api/products` - Получить список товаров
- `GET /api/customers` - Получить список клиентов
- `POST /api/orders` - Создать заказ
- `GET /api/orders/:orderId` - Получить статус заказа

Формат данных описан в документе `design.md`.

## Мониторинг и логи

Все ошибки и события логируются в таблицу `SystemLog` в базе данных.

Компоненты логирования:
- `backend-api` - Backend API Service
- `telegram-bot` - Telegram Bot Service
- `1c-integration` - 1C Integration Service
- `prisma` - Database queries

## Troubleshooting

### Telegram Bot не отвечает

1. Проверьте `TELEGRAM_BOT_TOKEN` в `.env`
2. Убедитесь, что бот запущен: `npm run dev:bot`
3. Проверьте логи сервиса

### Ошибки подключения к базе данных

1. Проверьте `DATABASE_URL` в `.env`
2. Убедитесь, что база данных доступна
3. Выполните `npm run db:push`

### 1С интеграция не работает

1. Проверьте `C1_API_URL`, `C1_API_USERNAME`, `C1_API_PASSWORD`
2. Убедитесь, что 1С API доступен
3. Система работает в offline режиме при недоступности 1С

## Лицензия

Proprietary
