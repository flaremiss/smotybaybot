const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');

// Создаем PNG изображение для приветствия
const canvas = createCanvas(800, 600);
const ctx = canvas.getContext('2d');

// Создаем градиентный фон
const gradient = ctx.createLinearGradient(0, 0, 800, 600);
gradient.addColorStop(0, '#667eea');
gradient.addColorStop(1, '#764ba2');

// Заливаем фон
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 800, 600);

// Настраиваем шрифт
ctx.font = 'bold 48px Arial';
ctx.fillStyle = 'white';
ctx.textAlign = 'center';

// Рисуем заголовок
ctx.fillText('SHOMY BAY', 400, 150);

// Рисуем подзаголовок
ctx.font = '32px Arial';
ctx.fillText('Приветствуем вас!', 400, 220);

// Рисуем описание
ctx.font = '24px Arial';
ctx.fillText('Самый умный бот по покупке, продаже', 400, 300);
ctx.fillText('и подбору одежды', 400, 340);

// Рисуем подпись
ctx.font = '20px Arial';
ctx.fillStyle = '#f0f0f0';
ctx.fillText('Создан ресейлерами для ресейлеров', 400, 420);

// Рисуем эмодзи одежды
ctx.font = '60px Arial';
ctx.fillStyle = 'white';
ctx.fillText('👕', 400, 520);

// Сохраняем как PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./welcome_photo.png', buffer);

console.log('✓ Создано PNG изображение welcome_photo.png');
console.log('✓ Размер: 800x600 пикселей');
console.log('✓ Формат: PNG');

// Удаляем временный скрипт
setTimeout(() => {
  try {
    fs.unlinkSync('./create_welcome_png.js');
    console.log('✓ Временный файл удален');
  } catch (e) {
    // Игнорируем ошибки удаления
  }
}, 1000);

