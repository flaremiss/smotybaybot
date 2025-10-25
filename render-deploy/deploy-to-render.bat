@echo off
chcp 65001 >nul
title Shomy Bay Bot - Развертывание на Render
color 0A

echo.
echo ========================================
echo    SHOMY BAY BOT - RENDER DEPLOY
echo ========================================
echo.

echo 🚀 Подготовка к развертыванию на Render...
echo.

echo 📋 Проверка файлов...
if not exist "bot.js" (
    echo ❌ Файл bot.js не найден!
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ❌ Файл package.json не найден!
    pause
    exit /b 1
)

echo ✅ Все файлы найдены
echo.

echo 📝 Инструкции по развертыванию:
echo.
echo 1️⃣ Создайте репозиторий на GitHub
echo 2️⃣ Загрузите папку render-deploy в корень репозитория
echo 3️⃣ Перейдите на https://render.com
echo 4️⃣ Создайте новый Web Service
echo 5️⃣ Подключите ваш GitHub репозиторий
echo 6️⃣ Настройте переменные окружения
echo 7️⃣ Установите Root Directory: render-deploy
echo 8️⃣ Запустите деплой
echo.

echo 🔧 Обязательные переменные окружения:
echo.
echo BOT_TOKEN=ваш_токен_бота
echo ADMIN_CHAT_ID=ваш_chat_id
echo WEBHOOK_URL=https://ваш-проект.onrender.com
echo MODERATION_URL=https://ваш-ngrok-url.ngrok.io
echo.

echo 📊 После деплоя проверьте:
echo • Статус: https://ваш-проект.onrender.com/status
echo • Логи: Render Dashboard → Logs
echo • Webhook: https://ваш-проект.onrender.com/webhook
echo.

echo 🎯 Готово! Следуйте инструкциям выше.
echo.

pause
