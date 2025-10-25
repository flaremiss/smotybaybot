# 🚀 Деплой на Render - Shomy Bay Bot

## 📋 Быстрый старт

### 1️⃣ **Создание аккаунта**
1. Перейдите на [render.com](https://render.com)
2. Войдите через GitHub
3. Подтвердите email

### 2️⃣ **Создание Web Service**
1. Нажмите **"New" → "Web Service"**
2. Выберите **"Build and deploy from a Git repository"**
3. Подключите ваш GitHub репозиторий
4. Выберите репозиторий `shomy-bay-bot-railway`

### 3️⃣ **Настройки деплоя**
- **Name**: `shomy-bay-bot`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free`

### 4️⃣ **Переменные окружения**
В разделе "Environment Variables" добавьте:

```env
BOT_TOKEN=ваш_токен_бота
ADMIN_CHAT_ID=ваш_telegram_id
WEBHOOK_URL=https://shomy-bay-bot.onrender.com
MODERATION_URL=https://ваш-ngrok-url.ngrok.io
```

### 5️⃣ **Деплой**
1. Нажмите **"Create Web Service"**
2. Дождитесь завершения деплоя (5-10 минут)
3. Получите URL: `https://shomy-bay-bot.onrender.com`

## 🔧 Особенности Render

### Бесплатный план:
- ✅ **750 часов/месяц** (достаточно для бота)
- ✅ **Автоматический деплой** из GitHub
- ✅ **Переменные окружения**
- ✅ **Логи в реальном времени**
- ⚠️ **Засыпает** через 15 минут неактивности

### Решения для засыпания:
1. **Keep-alive** (уже встроен в код)
2. **Uptime Robot** - мониторинг каждые 5 минут
3. **Ping endpoint** - `/status` для проверки

## 📊 Мониторинг

### Render Dashboard:
- **URL**: https://dashboard.render.com
- **Логи**: Logs tab
- **Метрики**: CPU, Memory, Network

### Статус бота:
- **URL**: https://shomy-bay-bot.onrender.com/status
- **Проверка**: `curl https://shomy-bay-bot.onrender.com/status`

## 🔄 Обновления

### Автоматический деплой:
1. Внесите изменения в код
2. Запушьте в GitHub
3. Render автоматически перезапустит

### Ручной деплой:
1. Render Dashboard → ваш сервис
2. **"Manual Deploy"**
3. Выберите ветку

## 🛠️ Устранение неполадок

### Проблема: Сервис засыпает
**Решение**: Настройте Uptime Robot
1. Зарегистрируйтесь на [uptimerobot.com](https://uptimerobot.com)
2. Добавьте мониторинг: `https://shomy-bay-bot.onrender.com/status`
3. Интервал: 5 минут

### Проблема: Деплой не запускается
**Решение**: Проверьте логи
1. Render Dashboard → ваш сервис
2. **"Logs"** tab
3. Ищите ошибки в логах

### Проблема: Переменные окружения не работают
**Решение**: Перезапустите сервис
1. Render Dashboard → ваш сервис
2. **"Settings"** → **"Environment"**
3. Обновите переменные
4. **"Save Changes"**

## 🎯 Итоговая схема

```
Пользователь → Telegram → Render Bot → ngrok → Ваш ПК (Модерация)
     ↑              ↑           ↑         ↑              ↑
   Бесплатно    Бесплатно   Бесплатно  Бесплатно     Бесплатно
```

**Результат: Полностью бесплатный хостинг бота на Render!** 🚀

---

**Создано**: 25 октября 2025  
**Версия**: 1.0  
**Автор**: Shomy Bay Team

