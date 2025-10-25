# ✅ Railway Deploy Checklist

## 📋 Быстрый чек-лист для деплоя

### 🛠️ Подготовка (5 минут)

- [ ] **GitHub аккаунт** - зарегистрирован
- [ ] **Railway аккаунт** - зарегистрирован  
- [ ] **ngrok** - скачан с [ngrok.com](https://ngrok.com/download)
- [ ] **BOT_TOKEN** - получен от @BotFather
- [ ] **ADMIN_CHAT_ID** - ваш Telegram ID
- [ ] **railway-deploy папка** - готова с файлами

### 📁 GitHub (3 минуты)

- [ ] Создан репозиторий `shomy-bay-bot-railway`
- [ ] Загружены файлы из `railway-deploy`
- [ ] Репозиторий **публичный** (для бесплатного Railway)
- [ ] Commit message: "Initial commit: Railway deployment files"

### 🚀 Railway (5 минут)

- [ ] Вход через GitHub на [railway.app](https://railway.app)
- [ ] "New Project" → "Deploy from GitHub repo"
- [ ] Выбран репозиторий `shomy-bay-bot-railway`
- [ ] Деплой завершен (статус: Deployed)
- [ ] Получен URL: `https://ваш-проект.railway.app`

### 🔧 Переменные окружения (3 минуты)

- [ ] `BOT_TOKEN` = ваш_токен_бота
- [ ] `ADMIN_CHAT_ID` = ваш_telegram_id  
- [ ] `WEBHOOK_URL` = https://ваш-проект.railway.app
- [ ] `MODERATION_URL` = https://ваш-ngrok-url.ngrok.io

### 🌐 ngrok (2 минуты)

- [ ] Скачан `ngrok.exe` в папку проекта
- [ ] Создан аккаунт на [ngrok.com](https://ngrok.com)
- [ ] Получен authtoken
- [ ] Выполнено: `ngrok config add-authtoken ВАШ_AUTHTOKEN`
- [ ] Запущен: `ngrok http 3000`
- [ ] Скопирован HTTPS URL

### 🎛️ Модерация (1 минута)

- [ ] Запущен `start_moderation.bat`
- [ ] Панель доступна по ngrok URL
- [ ] Обновлен `MODERATION_URL` в Railway

### ✅ Тестирование (2 минуты)

- [ ] **Бот отвечает** в Telegram (`/start`)
- [ ] **Статус работает**: https://ваш-проект.railway.app/status
- [ ] **Модерация доступна** по ngrok URL
- [ ] **Логи Railway** без ошибок
- [ ] **Keep-alive активен** (пинги каждые 5 мин)

---

## 🎯 Финальная проверка

### ✅ Все работает?

- [ ] 🤖 **Бот**: Отвечает в Telegram
- [ ] 🌐 **Статус**: https://ваш-проект.railway.app/status
- [ ] 🎛️ **Модерация**: https://ваш-ngrok-url.ngrok.io
- [ ] 📊 **Railway**: https://railway.app/dashboard
- [ ] 🔄 **Keep-alive**: Активен в логах

### 🚨 Проблемы?

| Проблема | Решение |
|----------|---------|
| Бот не отвечает | Проверьте BOT_TOKEN в Railway |
| Модерация недоступна | Перезапустите ngrok |
| Railway засыпает | Проверьте keep-alive в логах |
| Webhook не работает | Проверьте WEBHOOK_URL |

---

## 📞 Быстрая помощь

### 🔍 Проверка статуса
```bash
# Статус бота
curl https://ваш-проект.railway.app/status

# Логи Railway
# Railway Dashboard → Deployments → View Logs
```

### 🔄 Перезапуск
```bash
# Railway
# Railway Dashboard → Deployments → Redeploy

# ngrok
# Ctrl+C → ngrok http 3000

# Модерация
# Ctrl+C → start_moderation.bat
```

### 📊 Мониторинг
- **Railway**: https://railway.app/dashboard
- **ngrok**: http://127.0.0.1:4040
- **Статус**: https://ваш-проект.railway.app/status

---

## 🎉 Готово!

**Ваш бот работает бесплатно на Railway!**

- 💰 **Стоимость**: 0₽/месяц
- ⏰ **Время настройки**: ~15 минут
- 🔄 **Автоматические обновления**: Через GitHub
- 📊 **Мониторинг**: Railway Dashboard

**Ссылки для быстрого доступа:**
- 🤖 **Бот**: Работает в Telegram
- 🌐 **Статус**: https://ваш-проект.railway.app/status
- 🎛️ **Модерация**: https://ваш-ngrok-url.ngrok.io
- 📊 **Railway**: https://railway.app/dashboard

---

**Создано**: 25 октября 2025  
**Версия**: 1.0  
**Автор**: Shomy Bay Team
