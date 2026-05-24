@echo off
echo ========================================
echo   Инициализация базы данных
echo ========================================
echo.

cd services\backend-api

echo [1/3] Генерация Prisma Client...
call npm run db:generate
if %errorlevel% neq 0 (
    echo.
    echo ОШИБКА: Не удалось сгенерировать Prisma Client
    pause
    exit /b 1
)

echo.
echo [2/3] Создание таблиц в базе данных...
call npm run db:push
if %errorlevel% neq 0 (
    echo.
    echo ОШИБКА: Не удалось создать таблицы
    echo Проверьте подключение к базе данных в .env
    pause
    exit /b 1
)

echo.
echo [3/3] Добавление тестовых данных...
call npm run db:seed
if %errorlevel% neq 0 (
    echo.
    echo ОШИБКА: Не удалось добавить тестовые данные
    pause
    exit /b 1
)

cd ..\..

echo.
echo ========================================
echo   База данных успешно инициализирована!
echo ========================================
echo.
echo Тестовые учетные данные:
echo   Администратор: admin / admin123
echo   Оператор: operator / operator123
echo.
echo Теперь можете запустить систему через start.bat
echo.
pause
