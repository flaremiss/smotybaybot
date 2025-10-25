require('dotenv').config();
const express = require('express');
const path = require('path');

// Запускаем основного бота
require('./bot');

// Веб-сервер для Render
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Статическая страница для проверки работы
app.get('/', (req, res) => {
  res.json({ 
    status: 'Bot is running', 
    service: 'Shomy Bay Telegram Bot',
    timestamp: new Date().toISOString()
  });
});

// Health check для Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 Shomy Bay Bot запущен!`);
});