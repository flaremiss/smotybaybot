# 🚀 Полный туториал: Деплой Shomy Bay Bot на Railway

## 📋 Содержание

1. [Подготовка](#подготовка)
2. [Создание GitHub репозитория](#создание-github-репозитория)
3. [Настройка Railway](#настройка-railway)
4. [Переменные окружения](#переменные-окружения)
5. [Настройка ngrok](#настройка-ngrok)
6. [Запуск модерации](#запуск-модерации)
7. [Тестирование](#тестирование)
8. [Мониторинг](#мониторинг)
9. [Устранение неполадок](#устранение-неполадок)

---

## 🛠️ Подготовка

### Шаг 1: Скачивание файлов

Убедитесь, что у вас есть папка `railway-deploy` с файлами:
- `bot-remote.js`
- `package.json`
- `keep-alive.js`
- `railway.json`
- `README-DEPLOY.md`

### Шаг 2: Получение токенов

Вам понадобятся:
- **BOT_TOKEN** - токен вашего Telegram бота
- **ADMIN_CHAT_ID** - ваш Telegram ID
- **GitHub аккаунт** - для создания репозитория

---

## 📁 Создание GitHub репозитория

### Шаг 1: Вход в GitHub

1. Откройте [github.com](https://github.com)
2. Войдите в свой аккаунт
3. Нажмите **"New repository"** (зеленая кнопка)

### Шаг 2: Создание репозитория

1. **Repository name**: `shomy-bay-bot-railway`
2. **Description**: `Shomy Bay Telegram Bot for Railway hosting`
3. **Visibility**: ✅ Public (для бесплатного Railway)
4. **Initialize**: ❌ НЕ ставьте галочки
5. Нажмите **"Create repository"**

### Шаг 3: Загрузка файлов

#### Вариант A: Через веб-интерфейс GitHub

1. Нажмите **"uploading an existing file"**
2. Перетащите все файлы из папки `railway-deploy`
3. Введите commit message: `Initial commit: Railway deployment files`
4. Нажмите **"Commit changes"**

#### Вариант B: Через Git (если установлен)

```bash
# В папке railway-deploy
git init
git add .
git commit -m "Initial commit: Railway deployment files"
git branch -M main
git remote add origin https://github.com/ВАШ_USERNAME/shomy-bay-bot-railway.git
git push -u origin main
```

### Шаг 4: Проверка

Убедитесь, что в репозитории есть файлы:
- ✅ `bot-remote.js`
- ✅ `package.json`
- ✅ `keep-alive.js`
- ✅ `railway.json`
- ✅ `README-DEPLOY.md`

---

## 🚀 Настройка Railway

### Шаг 1: Регистрация на Railway

1. Откройте [railway.app](https://railway.app)
2. Нажмите **"Login"**
3. Выберите **"Login with GitHub"**
4. Разрешите доступ Railway к вашему GitHub

### Шаг 2: Создание проекта

1. Нажмите **"New Project"**
2. Выберите **"Deploy from GitHub repo"**
3. Найдите ваш репозиторий `shomy-bay-bot-railway`
4. Нажмите **"Deploy Now"**

### Шаг 3: Ожидание деплоя

Railway автоматически:
- ✅ Определит Node.js проект
- ✅ Установит зависимости из `package.json`
- ✅ Запустит `npm start`
- ✅ Создаст публичный URL

**Время ожидания**: 2-5 минут

### Шаг 4: Получение URL

После деплоя вы увидите:
- **Domain**: `https://ваш-проект.railway.app`
- **Status**: `Deployed`
- **Logs**: Доступны в реальном времени

---

## 🔧 Переменные окружения

### Шаг 1: Открытие настроек

1. В панели Railway нажмите на ваш проект
2. Перейдите во вкладку **"Variables"**
3. Нажмите **"New Variable"**

### Шаг 2: Добавление переменных

Добавьте каждую переменную по очереди:

#### BOT_TOKEN
- **Name**: `BOT_TOKEN`
- **Value**: `ваш_токен_бота_от_BotFather`
- **Description**: `Telegram Bot Token`

#### ADMIN_CHAT_ID
- **Name**: `ADMIN_CHAT_ID`
- **Value**: `ваш_telegram_id`
- **Description**: `Admin Telegram Chat ID`

#### WEBHOOK_URL
- **Name**: `WEBHOOK_URL`
- **Value**: `https://ваш-проект.railway.app`
- **Description**: `Railway Webhook URL`

#### MODERATION_URL
- **Name**: `MODERATION_URL`
- **Value**: `https://ваш-ngrok-url.ngrok.io` (пока оставьте placeholder)
- **Description**: `Ngrok Moderation Panel URL`

### Шаг 3: Сохранение

После добавления всех переменных:
1. Railway автоматически перезапустит проект
2. Дождитесь завершения деплоя
3. Проверьте логи на наличие ошибок

---

## 🌐 Настройка ngrok

### Шаг 1: Скачивание ngrok

1. Откройте [ngrok.com/download](https://ngrok.com/download)
2. Скачайте версию для Windows
3. Распакуйте `ngrok.exe` в папку с проектом

### Шаг 2: Регистрация ngrok

1. Создайте аккаунт на [ngrok.com](https://ngrok.com)
2. Получите authtoken в панели управления
3. Запустите команду:
```bash
ngrok config add-authtoken ВАШ_AUTHTOKEN
```

### Шаг 3: Запуск туннеля

```bash
# В папке с проектом
ngrok http 3000
```

Вы увидите:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

### Шаг 4: Копирование URL

Скопируйте **HTTPS URL** (например: `https://abc123.ngrok.io`)

---

## 🎛️ Запуск модерации

### Шаг 1: Обновление переменной

1. Вернитесь в Railway → Variables
2. Обновите `MODERATION_URL` на ваш ngrok URL
3. Railway автоматически перезапустит

### Шаг 2: Запуск панели модерации

```bash
# Запустите на вашем ПК
start_moderation.bat
```

### Шаг 3: Проверка доступности

1. Откройте ngrok URL в браузере
2. Должна открыться панель модерации
3. Проверьте, что бот отвечает в Telegram

---

## ✅ Тестирование

### Шаг 1: Проверка бота

1. Найдите вашего бота в Telegram
2. Отправьте `/start`
3. Проверьте, что бот отвечает
4. Попробуйте команды: "🛒 Купить", "💰 Продать"

### Шаг 2: Проверка статуса

1. Откройте `https://ваш-проект.railway.app/status`
2. Должны увидеть:
```json
{
  "status": "online",
  "bot": "running",
  "users": 0,
  "listings": 0,
  "uptime": 123.45,
  "memory": {...},
  "version": "1.0.0"
}
```

### Шаг 3: Проверка модерации

1. Откройте ngrok URL
2. Войдите в панель модерации
3. Проверьте функциональность

### Шаг 4: Проверка логов

1. В Railway → Deployments → View Logs
2. Должны увидеть:
```
🚀 Запуск Shomy Bay Bot (Remote Version)
📱 Bot Token: ✅ Установлен
👤 Admin Chat ID: 123456789
🌐 Moderation URL: https://abc123.ngrok.io
🔄 Starting keep-alive service...
✅ Keep-alive service started
🚀 Сервер запущен на порту 3000
```

---

## 📊 Мониторинг

### Railway Dashboard

1. **URL**: https://railway.app/dashboard
2. **Метрики**: CPU, Memory, Network
3. **Логи**: Real-time logs
4. **Деплои**: История изменений

### Локальный мониторинг

1. **ngrok**: http://127.0.0.1:4040
2. **Модерация**: http://localhost:3000
3. **Статус бота**: https://ваш-проект.railway.app/status

### Telegram уведомления

Бот автоматически отправит уведомление админу при запуске:
```
🚀 Shomy Bay Bot запущен!

🌐 Статус: https://ваш-проект.railway.app/status
🔗 Модерация: https://abc123.ngrok.io
⏰ Время: 25.10.2025, 12:00:00
```

---

## 🛠️ Устранение неполадок

### Проблема: Бот не отвечает

#### Проверка 1: Токен бота
```bash
# Проверьте в Railway Variables
BOT_TOKEN=правильный_токен_от_BotFather
```

#### Проверка 2: Логи Railway
1. Railway → Deployments → View Logs
2. Ищите ошибки типа:
```
❌ BOT_TOKEN не установлен!
❌ ADMIN_CHAT_ID не установлен!
```

#### Проверка 3: Статус
```bash
curl https://ваш-проект.railway.app/status
```

**Решение**: Обновите переменные окружения

### Проблема: Модерация недоступна

#### Проверка 1: ngrok статус
```bash
ngrok status
```

#### Проверка 2: Локальная панель
```bash
# Проверьте, что модерация запущена
http://localhost:3000
```

#### Проверка 3: URL в Railway
```bash
# Проверьте MODERATION_URL в Railway
MODERATION_URL=https://правильный-ngrok-url.ngrok.io
```

**Решение**: Перезапустите ngrok и обновите URL

### Проблема: Webhook не работает

#### Проверка 1: WEBHOOK_URL
```bash
# В Railway Variables
WEBHOOK_URL=https://ваш-проект.railway.app
```

#### Проверка 2: Доступность
```bash
curl https://ваш-проект.railway.app/status
```

#### Проверка 3: Логи
Ищите в логах:
```
🔗 Настраиваем webhook...
✅ Webhook настроен
```

**Решение**: Проверьте URL и перезапустите проект

### Проблема: Railway засыпает

#### Причина: Неактивность
Railway засыпает через 30 минут неактивности

#### Решение: Keep-alive
1. Проверьте, что `keep-alive.js` запущен
2. В логах должны быть:
```
✅ Keep-alive ping: 200 - 2025-10-25T12:00:00.000Z
```

#### Альтернатива: Uptime Robot
1. Зарегистрируйтесь на [uptimerobot.com](https://uptimerobot.com)
2. Добавьте мониторинг: `https://ваш-проект.railway.app/status`
3. Интервал: 5 минут

### Проблема: ngrok переподключается

#### Причина: Бесплатный план
ngrok переподключается каждые 8 часов

#### Решение: Автоматический рестарт
```bash
# Создайте скрипт restart-ngrok.bat
@echo off
:loop
ngrok http 3000
timeout /t 10
goto loop
```

### Проблема: Ошибки деплоя

#### Проверка 1: package.json
```json
{
  "scripts": {
    "start": "node bot-remote.js & node keep-alive.js"
  }
}
```

#### Проверка 2: Зависимости
```json
{
  "dependencies": {
    "node-telegram-bot-api": "^0.64.0",
    "fs-extra": "^11.1.1",
    "express": "^4.18.2"
  }
}
```

#### Проверка 3: Логи деплоя
Ищите ошибки типа:
```
npm ERR! peer dep missing
npm ERR! install failed
```

**Решение**: Обновите зависимости и перезапустите

---

## 🎯 Финальная проверка

### ✅ Чек-лист

- [ ] GitHub репозиторий создан
- [ ] Railway проект развернут
- [ ] Все переменные окружения установлены
- [ ] ngrok туннель работает
- [ ] Модерация доступна через ngrok
- [ ] Бот отвечает в Telegram
- [ ] Статус страница работает
- [ ] Keep-alive активен
- [ ] Логи не содержат ошибок

### 🚀 Готово!

Ваш бот теперь работает на Railway бесплатно! 

**Ссылки:**
- 🤖 **Бот**: Работает в Telegram
- 🌐 **Статус**: https://ваш-проект.railway.app/status
- 🎛️ **Модерация**: https://ваш-ngrok-url.ngrok.io
- 📊 **Railway**: https://railway.app/dashboard

---

## 📞 Поддержка

### Railway
- 📖 [Документация](https://docs.railway.app)
- 💬 [Discord](https://discord.gg/railway)
- 🐛 [GitHub Issues](https://github.com/railwayapp/cli/issues)

### ngrok
- 📖 [Документация](https://ngrok.com/docs)
- 💬 [Support](https://ngrok.com/support)

### Shomy Bay
- 📧 Техподдержка: через Telegram
- 🐛 Баги: GitHub Issues
- 💡 Предложения: Telegram чат

---

**Создано**: 25 октября 2025  
**Версия**: 1.0  
**Автор**: Shomy Bay Team
