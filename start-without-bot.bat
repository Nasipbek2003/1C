@echo off
echo ========================================
echo Запуск системы БЕЗ Telegram Bot
echo ========================================
echo.
echo Backend API будет доступен на http://localhost:3001
echo 1C Integration будет доступен на http://localhost:3003
echo.
echo Для запуска Telegram Bot добавьте токен в .env
echo.
echo Нажмите Ctrl+C для остановки
echo ========================================
echo.

start "Backend API" cmd /k "cd services\backend-api && npm run dev"
timeout /t 3 /nobreak >nul
start "1C Integration" cmd /k "cd services\1c-integration && npm run dev"

echo.
echo Сервисы запущены в отдельных окнах!
echo Закройте окна для остановки сервисов.
pause
