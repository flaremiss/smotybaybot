const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Подключение к боту для отправки уведомлений
const BOT_TOKEN = '7549540016:AAEuxl7RZbz7xLEbXrI3pF099doTN7Wsu58';
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Простая авторизация
const ADMIN_PASSWORD = 'admin123';
let isAuthenticated = false;

// Функции для работы с данными
async function readListings() {
  try {
    const listingsPath = path.join(__dirname, 'data', 'listings.json');
    return await fs.readJson(listingsPath);
  } catch (_) {
    return [];
  }
}

async function writeListings(listings) {
  const listingsPath = path.join(__dirname, 'data', 'listings.json');
  await fs.ensureDir(path.dirname(listingsPath));
  await fs.writeJson(listingsPath, listings, { spaces: 2 });
}

async function readUsers() {
  try {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    return await fs.readJson(usersPath);
  } catch (_) {
    return {};
  }
}

// API для авторизации
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    isAuthenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Неверный пароль' });
  }
});

app.post('/api/logout', (req, res) => {
  isAuthenticated = false;
  res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: isAuthenticated });
});

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
  if (isAuthenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Необходима авторизация' });
  }
};

// API для получения всех объявлений
app.get('/api/listings', requireAuth, async (req, res) => {
  try {
    const listings = await readListings();
    
    // Сортируем по дате создания (новые сначала)
    listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      listings: listings,
      total: listings.length
    });
  } catch (error) {
    console.error('Ошибка получения объявлений:', error);
    res.status(500).json({ error: 'Ошибка получения объявлений' });
  }
});

// API для удаления объявления с уведомлением автора
app.delete('/api/listings/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const listings = await readListings();
    
    const listingIndex = listings.findIndex(l => l.id === id);
    if (listingIndex === -1) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }
    
    const deletedListing = listings.splice(listingIndex, 1)[0];
    await writeListings(listings);
    
    // Отправляем уведомление автору
    try {
      const notificationMessage = `🚫 Ваше объявление удалено\n\n` +
        `📝 Товар: ${deletedListing.title || 'Без названия'}\n` +
        `💰 Цена: ${deletedListing.price || 'Не указана'} ₽\n` +
        `📅 Дата создания: ${new Date(deletedListing.createdAt).toLocaleString('ru-RU')}\n\n` +
        `❌ Причина удаления:\n${reason || 'Нарушение правил сообщества'}\n\n` +
        `Если у вас есть вопросы, обратитесь к администратору.`;
      
      await bot.sendMessage(deletedListing.userId, notificationMessage);
      console.log(`✅ Уведомление отправлено пользователю ${deletedListing.userId}`);
    } catch (botError) {
      console.error('❌ Ошибка отправки уведомления:', botError.message);
    }
    
    res.json({ 
      success: true, 
      message: 'Объявление удалено и автор уведомлен',
      listing: deletedListing
    });
  } catch (error) {
    console.error('Ошибка удаления объявления:', error);
    res.status(500).json({ error: 'Ошибка удаления объявления' });
  }
});

// API для получения статистики
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const listings = await readListings();
    const users = await readUsers();
    
    const stats = {
      totalListings: listings.length,
      totalUsers: Object.keys(users).length,
      todayListings: listings.filter(l => {
        const today = new Date();
        const listingDate = new Date(l.createdAt);
        return listingDate.toDateString() === today.toDateString();
      }).length
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// API для проксирования изображений Telegram
app.get('/api/photo/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Получаем путь к файлу от Telegram
    const file = await bot.getFile(fileId);
    if (!file || !file.file_path) {
      return res.status(404).send('Файл не найден');
    }
    
    // Формируем URL для скачивания
    const telegramFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    // Скачиваем изображение
    const response = await axios.get(telegramFileUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000 
    });
    
    // Отправляем изображение клиенту
    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.send(Buffer.from(response.data));
    
  } catch (error) {
    console.error('Ошибка получения фото:', error.message);
    res.status(500).send('Ошибка загрузки изображения');
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🌐 Веб-панель модерации запущена на http://localhost:${PORT}`);
  console.log(`🔑 Пароль администратора: ${ADMIN_PASSWORD}`);
});

module.exports = app;