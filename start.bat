@echo off
echo ========================================
echo   Система управления магазином одежды
echo ========================================
echo.
echo Очистка кэша Next.js...
if exist "apps\web-interface\.next" (
    rmdir /s /q "apps\web-interface\.next"
    echo Кэш очищен
) else (
    echo Кэш не найден
)
echo.
echo Запуск системы...
echo.
echo Backend API: http://localhost:3001
echo Telegram Bot: порт 3002
echo Web Interface: http://localhost:3000
echo.
echo Для остановки нажмите Ctrl+C
echo.
npm run dev
