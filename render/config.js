// Конфигурация для профилей Firefox
const config = {
  // Количество браузеров для запуска
  browserCount: 1,
  
  // Режим работы браузера
  headless: false, // true = скрытый режим (быстрее), false = видимый режим
  
  // Прокси настройки
  proxy: {
    server: 'http://45.81.136.8:5500',
    username: 'TVV12',
    password: 'GGF33PRO'
  },
  
  // Настройки Firefox
  firefox: {
    headless: false, // true = скрытый режим (быстрее), false = видимый режим
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',
      '--disable-javascript',
      '--disable-plugins-discovery',
      '--disable-preconnect',
      '--disable-translate',
      '--mute-audio',
      '--no-default-browser-check',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-ipc-flooding-protection',
      '--disable-client-side-phishing-detection',
      '--disable-sync',
      '--disable-default-apps',
      '--no-pings',
      '--disable-gpu',
      '--disable-gpu-sandbox',
      '--disable-software-rasterizer',
      '--disable-gpu-compositing',
      '--disable-gpu-rasterization',
      '--disable-background-networking',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-domain-reliability',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-mode',
      '--disable-low-res-tiling',
      '--disable-threaded-compositing',
      '--disable-threaded-scrolling',
      '--disable-checker-imaging',
      '--disable-new-tab-first-run',
      '--disable-logging',
      '--disable-login-animations',
      '--disable-notifications',
      '--disable-popup-blocking',
      '--disable-component-update',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-2d-canvas-clip-aa',
      '--disable-3d-apis',
      '--disable-accelerated-2d-canvas',
      '--disable-accelerated-jpeg-decoding',
      '--disable-accelerated-mjpeg-decode',
      '--disable-accelerated-video-decode',
      '--disable-accelerated-video-encode',
      '--disable-background-media-suspend',
      '--disable-breakpad',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-password-generation',
      '--disable-permissions-api',
      '--disable-print-preview',
      '--disable-webgl',
      '--disable-webgl2',
      '--disable-xss-auditor'
    ]
  },
  
  // Антидетект настройки
  stealth: {
    // 100 уникальных профилей с разными характеристиками
    profiles: [
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        viewport: { width: 1920, height: 1080 },
        hardwareConcurrency: 8,
        deviceMemory: 8,
        platform: 'Win32',
        cpu: 'Intel Core i7-12700K',
        gpu: 'NVIDIA GeForce RTX 3070',
        webglVendor: 'NVIDIA Corporation',
        webglRenderer: 'NVIDIA GeForce RTX 3070/PCIe/SSE2'
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        viewport: { width: 2560, height: 1440 },
        hardwareConcurrency: 12,
        deviceMemory: 16,
        platform: 'Win32',
        cpu: 'AMD Ryzen 7 5800X',
        gpu: 'AMD Radeon RX 6800 XT',
        webglVendor: 'ATI Technologies Inc.',
        webglRenderer: 'AMD Radeon RX 6800 XT (0x73bf)'
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        viewport: { width: 1366, height: 768 },
        hardwareConcurrency: 4,
        deviceMemory: 4,
        platform: 'Win32',
        cpu: 'Intel Core i5-10400F',
        gpu: 'NVIDIA GeForce GTX 1660',
        webglVendor: 'NVIDIA Corporation',
        webglRenderer: 'NVIDIA GeForce GTX 1660/PCIe/SSE2'
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        viewport: { width: 1920, height: 1200 },
        hardwareConcurrency: 6,
        deviceMemory: 8,
        platform: 'Win32',
        cpu: 'AMD Ryzen 5 5600X',
        gpu: 'NVIDIA GeForce RTX 3060',
        webglVendor: 'NVIDIA Corporation',
        webglRenderer: 'NVIDIA GeForce RTX 3060/PCIe/SSE2'
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        viewport: { width: 3440, height: 1440 },
        hardwareConcurrency: 16,
        deviceMemory: 32,
        platform: 'Win32',
        cpu: 'Intel Core i9-12900K',
        gpu: 'NVIDIA GeForce RTX 4080',
        webglVendor: 'NVIDIA Corporation',
        webglRenderer: 'NVIDIA GeForce RTX 4080/PCIe/SSE2'
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        viewport: { width: 1600, height: 900 },
        hardwareConcurrency: 4,
        deviceMemory: 6,
        platform: 'Win32',
        cpu: 'Intel Core i3-10100',
        gpu: 'Intel UHD Graphics 630',
        webglVendor: 'Intel Inc.',
        webglRenderer: 'Intel(R) UHD Graphics 630'
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        viewport: { width: 2560, height: 1600 },
        hardwareConcurrency: 10,
        deviceMemory: 12,
        platform: 'Win32',
        cpu: 'AMD Ryzen 9 5900X',
        gpu: 'AMD Radeon RX 6700 XT',
        webglVendor: 'ATI Technologies Inc.',
        webglRenderer: 'AMD Radeon RX 6700 XT (0x73df)'
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        viewport: { width: 1920, height: 1080 },
        hardwareConcurrency: 8,
        deviceMemory: 8,
        platform: 'Win32',
        cpu: 'Intel Core i7-11700K',
        gpu: 'NVIDIA GeForce RTX 3070 Ti',
        webglVendor: 'NVIDIA Corporation',
        webglRenderer: 'NVIDIA GeForce RTX 3070 Ti/PCIe/SSE2'
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        viewport: { width: 1280, height: 720 },
        hardwareConcurrency: 2,
        deviceMemory: 2,
        platform: 'Win32',
        cpu: 'Intel Celeron G5900',
        gpu: 'Intel UHD Graphics 610',
        webglVendor: 'Intel Inc.',
        webglRenderer: 'Intel(R) UHD Graphics 610'
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        viewport: { width: 3840, height: 2160 },
        hardwareConcurrency: 20,
        deviceMemory: 64,
        platform: 'Win32',
        cpu: 'AMD Ryzen Threadripper 3970X',
        gpu: 'NVIDIA GeForce RTX 4090',
        webglVendor: 'NVIDIA Corporation',
        webglRenderer: 'NVIDIA GeForce RTX 4090/PCIe/SSE2'
      }
    ],
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    geolocation: { latitude: 55.7558, longitude: 37.6176 }, // Москва
    permissions: ['geolocation'],
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    }
  },
  
  
  // Настройки mellstroy
  mellstroy: {
    baseUrl: 'https://mellstroy.com/'
  },
  
  // Настройки куки для автосохранения куки в файл cookies.json 
  cookies: {
    autoSave: false, // true = работает (сохраняет куки при каждом изменении) false = не работает (не сохраняет куки при изменении)
    saveOnClose: true // при закрытии браузера сохраняет куки в файл cookies.json 
  },
  
  // Настройки Telegram для получения промокодов
  telegram: {
    apiId: '22581574',
    apiHash: 'c486e1d1e77360f66634ffd1d2d4d4b8',
    channelUsername: '@cpermerfermer',
    phoneNumber: '+14097535844',
    sessionString: ''
  },

  // Настройки Telegram бота для уведомлений
  telegramBot: {
    token: '8216794662:AAHHWqEGOiNF_eS3ZwlzEo7GbwQLEEakZjA',
    chatId: '-1002807295964',
    username: 'cpermefermer_bot'
  },
  
  // Настройки AI/капча-решателя отключены — используется локальный решатель без внешних сервисов
};

  // Настройки маркет-бота (shomy bay)
config.marketBot = {
  token: '7549540016:AAEuxl7RZbz7xLEbXrI3pF099doTN7Wsu58',
  name: 'shomy bay',
  description: 'Приветствую, друзья! Вы находитесь в самом умном и удобном боте по покупке, продаже и подбору одежды. Наш бот создан ресейлерами для ресейлеров и, по совместительству, покупателями для покупателей.\n\nПользуясь ботом, вы принимаете <a href="https://telegra.ph/Pravila-Smoty-Bay-bota-10-24">правила использования</a>.',
  requiredChannels: ['@pinplace_com', '@cultlocker'],
  sponsorTitles: ['Подписаться', 'Подписаться'],
  supportContact: '@morgentg',
  styles: ['Архив', 'Кежуал', 'Old money', 'Стритвир', 'Другое']
};

// Настройки CryptoBot для оплаты
config.cryptoBot = {
  token: '477602:AAMVUc1KkLcO7DM3n9npy1d8LxwjvdGUHAQ',
  apiUrl: 'https://pay.crypt.bot/api',
  platinumPriceRub: 300, // цена платины в рублях
  // Поддерживаемые криптовалюты (курсы обновляются автоматически)
  supportedCurrencies: [
    { code: 'USDT', name: 'Tether', emoji: '💎', rate: 81.45 },
    { code: 'TON', name: 'Toncoin', emoji: '⚡', rate: 181.23 },
    { code: 'SOL', name: 'Solana', emoji: '☀️', rate: 15574.73 },
    { code: 'TRX', name: 'TRON', emoji: '🔺', rate: 26.04 },
    { code: 'BTC', name: 'Bitcoin', emoji: '₿', rate: 8808778.34 },
    { code: 'ETH', name: 'Ethereum', emoji: 'Ξ', rate: 324128.43 },
    { code: 'DOGE', name: 'Dogecoin', emoji: '🐕', rate: 16.05 },
    { code: 'LTC', name: 'Litecoin', emoji: 'Ł', rate: 7686.39 },
    { code: 'NOT', name: 'Notcoin', emoji: '🪙', rate: 0.071 },
    { code: 'TRUMP', name: 'Trump', emoji: '🇺🇸', rate: 487.72 },
    { code: 'BNB', name: 'BNB', emoji: '🟡', rate: 90699.59 },
    { code: 'USDC', name: 'USD Coin', emoji: '💵', rate: 81.45 }
  ],
  defaultCurrency: 'USDT' // валюта по умолчанию
};

module.exports = config;
