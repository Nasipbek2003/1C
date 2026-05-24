@echo off
echo ========================================
echo   Проверка статуса сервисов
echo ========================================
echo.

echo [1/3] Проверка Backend API (порт 3001)...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Backend API работает
) else (
    echo   ✗ Backend API не отвечает
)

echo.
echo [2/3] Проверка Telegram Bot (порт 3002)...
curl -s http://localhost:3002/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Telegram Bot работает
) else (
    echo   ✗ Telegram Bot не отвечает
)

echo.
echo [3/3] Проверка Web Interface (порт 3000)...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Web Interface работает
) else (
    echo   ✗ Web Interface не отвечает
)

echo.
echo ========================================
echo   Проверка завершена
echo ========================================
echo.
echo Если какой-то сервис не работает:
echo   1. Убедитесь, что система запущена (start.bat)
echo   2. Проверьте консоль на ошибки
echo   3. См. ИСПРАВЛЕНИЕ_ПРОБЛЕМ.md
echo.
pause
