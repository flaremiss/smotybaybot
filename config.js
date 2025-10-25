const config = {};

// Настройки маркет-бота
config.marketBot = {
  token: process.env.TELEGRAM_BOT_TOKEN, // Берем из переменных окружения
  name: 'shomy bay',
  description: 'Приветствую, друзья! Вы находитесь в самом умном и удобном боте по покупке, продаже и подбору одежды. Наш бот создан ресейлерами для ресейлеров и, по совместительству, покупателями для покупателей.\n\nПользуясь ботом, вы принимаете <a href="https://telegra.ph/Pravila-Smoty-Bay-bota-10-24">правила использования</a>.',
  requiredChannels: ['@pinplace_com', '@cultlocker'],
  sponsorTitles: ['Подписаться', 'Подписаться'],
  supportContact: '@morgentg',
  styles: ['Архив', 'Кежуал', 'Old money', 'Стритвир', 'Другое']
};

// Настройки CryptoBot для оплаты
config.cryptoBot = {
  token: process.env.CRYPTO_BOT_TOKEN, // Берем из переменных окружения
  apiUrl: 'https://pay.crypt.bot/api',
  platinumPriceRub: 300,
  // Курсы лучше получать через API
  supportedCurrencies: [
    { code: 'USDT', name: 'Tether', emoji: '💎' },
    { code: 'TON', name: 'Toncoin', emoji: '⚡' },
    // ... остальные валюты без rate
  ],
  defaultCurrency: 'USDT'
};

module.exports = config;