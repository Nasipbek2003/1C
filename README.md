# Система управления магазином одежды

Полнофункциональная система для управления магазином одежды с интеграцией Telegram-бота, панелью оператора и синхронизацией с 1С.

## 🚀 Возможности

### Панель оператора
- 👥 Управление клиентами
- 📦 Управление товарами (с загрузкой изображений)
- 🛒 Управление заказами
- 💬 Чат с клиентами в реальном времени
- 👨‍💼 Управление операторами (только для администраторов)
- 📊 Дашборд со статистикой

### Telegram бот
- 🤖 Автоматизированное общение с клиентами
- 🛍️ Просмотр каталога товаров
- 📝 Оформление заказов
- 📞 Связь с оператором

### Интеграция с 1С
- 🔄 Синхронизация товаров
- 👥 Синхронизация клиентов
- 📋 Синхронизация заказов

## 📋 Требования

- Node.js 18+
- PostgreSQL (используется Neon Database)
- Telegram Bot Token
- Cloudinary аккаунт (для загрузки изображений)

## 🛠️ Установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните необходимые данные:

```bash
cp .env.example .env
```

Основные переменные:
- `DATABASE_URL` - строка подключения к PostgreSQL
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота
- `JWT_SECRET` - секретный ключ для JWT
- `NEXT_PUBLIC_CLOUDINARY_*` - настройки Cloudinary

### 4. Инициализация базы данных

```bash
# Применить миграции
cd services/backend-api
npx prisma migrate deploy
npx prisma generate

# Заполнить тестовыми данными (опционально)
node ../../seed-test-data.js
```

### 5. Создание операторов

```bash
# Проверить существующих операторов
node check-operator-login.js

# Установить роль администратора
node set-admin-role.js
```

## 🚀 Запуск

### Запуск всей системы

```bash
# С Telegram ботом
start.bat

# Без Telegram бота
start-without-bot.bat
```

### Запуск отдельных сервисов

```bash
# Backend API (порт 3001)
cd services/backend-api
npm run dev

# Web Interface (порт 3000)
cd apps/web-interface
npm run dev

# Telegram Bot (порт 3002)
cd services/telegram-bot
npm run dev

# 1C Integration (порт 3003)
cd services/1c-integration
npm run dev
```

## 🔐 Доступ к системе

### Панель оператора
URL: http://localhost:3000/login

**Администратор:**
- Логин: `admin`
- Пароль: `admin123`
- Доступ: Все функции включая управление операторами

**Оператор:**
- Логин: `operator`
- Пароль: `operator123`
- Доступ: Все функции кроме управления операторами

## 📁 Структура проекта

```
.
├── apps/
│   └── web-interface/          # Next.js веб-интерфейс
│       ├── app/
│       │   ├── components/     # React компоненты
│       │   ├── customers/      # Страница клиентов
│       │   ├── products/       # Страница товаров
│       │   ├── orders/         # Страница заказов
│       │   ├── operators/      # Страница операторов
│       │   ├── chat/           # Страница чата
│       │   └── login/          # Страница входа
│       └── package.json
│
├── services/
│   ├── backend-api/            # Express.js API
│   │   ├── src/
│   │   │   ├── routes/         # API роуты
│   │   │   ├── middleware/     # Middleware (auth, errors)
│   │   │   └── utils/          # Утилиты
│   │   └── prisma/
│   │       ├── schema.prisma   # Схема базы данных
│   │       └── migrations/     # Миграции
│   │
│   ├── telegram-bot/           # Telegram бот
│   │   └── src/
│   │       ├── commands/       # Команды бота
│   │       └── handlers/       # Обработчики
│   │
│   └── 1c-integration/         # Интеграция с 1С
│       └── src/
│           ├── api/            # API endpoints
│           ├── client/         # 1С клиент
│           └── sync/           # Синхронизация
│
├── .env                        # Переменные окружения
├── package.json                # Зависимости проекта
├── start.bat                   # Запуск всей системы
└── start-without-bot.bat       # Запуск без бота
```

## 🎨 Особенности интерфейса

### Система ролей
- **ADMIN** - полный доступ ко всем функциям
- **OPERATOR** - доступ без управления операторами

### Анимации загрузки
- Красивые анимированные спиннеры на всех страницах
- Анимированная кнопка входа
- Три варианта анимации (default, dots, pulse)

### Адаптивный дизайн
- Полностью адаптивный интерфейс
- Поддержка мобильных устройств
- Современный UI с Tailwind CSS

## 🔧 Полезные скрипты

```bash
# Проверить операторов
node check-operator-login.js

# Установить роль администратора
node set-admin-role.js

# Заполнить тестовыми данными
node seed-test-data.js

# Проверить сервисы
check-services.bat

# Инициализировать базу данных
init-database.bat
```

## 📚 Документация

- [QUICKSTART.md](QUICKSTART.md) - Быстрый старт
- [СХЕМА_ЗАПУСКА.md](СХЕМА_ЗАПУСКА.md) - Схема запуска системы
- [ИЗМЕНЕНИЯ_РОЛИ.md](ИЗМЕНЕНИЯ_РОЛИ.md) - Информация о системе ролей
- [АНИМАЦИИ_ЗАГРУЗКИ.md](АНИМАЦИИ_ЗАГРУЗКИ.md) - Документация по анимациям
- [ИНСТРУКЦИЯ_ЗАПУСКА.md](ИНСТРУКЦИЯ_ЗАПУСКА.md) - Подробная инструкция
- [📖_ДОКУМЕНТАЦИЯ.md](📖_ДОКУМЕНТАЦИЯ.md) - Полная документация

## 🐛 Решение проблем

### Backend API не запускается
- Проверьте что PostgreSQL доступен
- Проверьте `DATABASE_URL` в `.env`
- Убедитесь что порт 3001 свободен

### Web Interface не подключается к API
- Убедитесь что Backend API запущен
- Проверьте `NEXT_PUBLIC_API_URL` в `.env`

### Telegram бот не отвечает
- Проверьте `TELEGRAM_BOT_TOKEN` в `.env`
- Убедитесь что Backend API запущен

### Ошибка при входе
- Проверьте что операторы созданы: `node check-operator-login.js`
- Убедитесь что `JWT_SECRET` установлен в `.env`

## 🔒 Безопасность

- JWT токены для аутентификации
- Bcrypt для хеширования паролей
- Middleware для проверки прав доступа
- Защита API endpoints по ролям

## 🚀 Развертывание

### Production

1. Установите переменные окружения для production
2. Соберите проекты:
```bash
cd apps/web-interface
npm run build

cd ../../services/backend-api
npm run build
```

3. Запустите в production режиме:
```bash
NODE_ENV=production npm start
```

## 📝 Лицензия

Proprietary - Все права защищены

## 👥 Поддержка

При возникновении проблем проверьте логи в консоли где запущены сервисы.
