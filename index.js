const { firefox } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const config = require('./config');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const TelegramBot = require('node-telegram-bot-api');

class MellstroyLootScript {
  constructor() {
    this.browsers = [];
    this.pages = [];
    this.telegramClient = null;
    this.lastMessageId = 0;
    this.channelId = null; // Добавляем ID канала
    this.telegramBot = null; // Telegram бот для уведомлений
  }

  // Инициализация Telegram клиента
  async initTelegram() {
    try {
      console.log('🔧 Отладка: Начинаем инициализацию Telegram...');
      console.log('🔧 Отладка: API ID:', config.telegram.apiId);
      console.log('🔧 Отладка: API Hash:', config.telegram.apiHash ? 'установлен' : 'не установлен');
      console.log('🔧 Отладка: Номер телефона:', config.telegram.phoneNumber);
      console.log('🔧 Отладка: Канал:', config.telegram.channelUsername);

      // Загружаем сохраненную сессию из файла
      const sessionPath = path.resolve('./telegram_session.txt');
      let sessionString = config.telegram.sessionString;
      
      try {
        if (await fs.pathExists(sessionPath)) {
          sessionString = await fs.readFile(sessionPath, 'utf8');
          console.log('🔧 Отладка: Загружена сохраненная сессия из файла');
        }
      } catch (error) {
        console.log('🔧 Отладка: Не удалось загрузить сессию из файла:', error.message);
      }

      const stringSession = new StringSession(sessionString);
      console.log('🔧 Отладка: StringSession создан');
      
      this.telegramClient = new TelegramClient(stringSession, parseInt(config.telegram.apiId), config.telegram.apiHash, {
        connectionRetries: 5,
      });
      console.log('🔧 Отладка: TelegramClient создан');

      console.log('🔧 Отладка: Запускаем клиент...');
      await this.telegramClient.start({
        phoneNumber: config.telegram.phoneNumber,
        password: async () => await input.text('Пароль:'),
        phoneCode: async () => await input.text('Код из SMS:'),
        onError: (err) => console.log('Ошибка Telegram:', err),
      });

      // Сохраняем сессию в файл для повторного использования
      const newSessionString = this.telegramClient.session.save();
      await fs.writeFile(sessionPath, newSessionString, 'utf8');
      console.log('🔧 Отладка: Сессия сохранена в файл telegram_session.txt');
      
      // Обновляем конфиг с новой сессией
      config.telegram.sessionString = newSessionString;

      // Получаем ID канала для фильтрации (без получения сообщений)
      try {
        const entity = await this.telegramClient.getEntity(config.telegram.channelUsername);
        this.channelId = entity.id.toString();
        console.log('🔧 Отладка: ID канала:', this.channelId);
        
        // Инициализируем последний ID как 0 - будем получать все новые сообщения
        this.lastMessageId = 0;
        console.log('🔧 Отладка: Инициализирован последний ID сообщения:', this.lastMessageId);
      } catch (error) {
        console.log('⚠ Не удалось получить информацию о канале:', error.message);
      }

      console.log('✓ Telegram клиент подключен');
      return true;
    } catch (error) {
      if (error.message.includes('FloodWaitError')) {
        const waitTime = error.seconds || 60;
        console.log(`⚠ Telegram заблокирован на ${waitTime} секунд. Ожидаем...`);
        
        // Автоматическое ожидание
        for (let i = waitTime; i > 0; i--) {
          process.stdout.write(`\r⏰ Осталось ${i} секунд...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('\n🔄 Повторная попытка подключения...');
        
        // Повторная попытка подключения
        try {
          await this.telegramClient.start({
            phoneNumber: config.telegram.phoneNumber,
            password: async () => await input.text('Пароль:'),
            phoneCode: async () => await input.text('Код из SMS:'),
            onError: (err) => console.log('Ошибка Telegram:', err),
          });

          // Сохраняем сессию в файл
          const newSessionString = this.telegramClient.session.save();
          await fs.writeFile(path.resolve('./telegram_session.txt'), newSessionString, 'utf8');
          console.log('🔧 Отладка: Сессия сохранена в файл telegram_session.txt');
          
          config.telegram.sessionString = newSessionString;
          console.log('✓ Telegram клиент подключен после ожидания');
          return true;
        } catch (retryError) {
          console.log('⚠ Ошибка повторного подключения:', retryError.message);
          return false;
        }
      }
      console.log('⚠ Ошибка подключения к Telegram:', error.message);
      console.log('🔧 Отладка: Полная ошибка:', error);
      return false;
    }
  }

  // Инициализация Telegram бота (только для отправки сообщений)
  async initTelegramBot() {
    try {
      console.log('🤖 Инициализация Telegram бота...');
      
      // Создаем бота БЕЗ polling - только для отправки сообщений
      this.telegramBot = new TelegramBot(config.telegramBot.token, { polling: false });
      
      console.log('✓ Telegram бот инициализирован (только отправка сообщений)');
      return true;
    } catch (error) {
      console.log('⚠ Ошибка инициализации Telegram бота:', error.message);
      return false;
    }
  }

  // Отправка статуса системы
  async sendStatusMessage(chatId = null) {
    try {
      const targetChatId = chatId || config.telegramBot.chatId;
      const activeBrowsers = this.pages.length;
      const totalBrowsers = config.browserCount;
      const proxyInfo = `${config.proxy.server} (${config.proxy.username})`;
      
      const statusMessage = `📊 Статус системы mellstroy loot\n\n` +
        `🖥️ Браузеры: ${activeBrowsers}/${totalBrowsers} активных\n` +
        `🌐 Прокси: ${proxyInfo}\n` +
        `📱 Telegram: ${this.telegramClient ? '✅ Подключен' : '❌ Отключен'}\n` +
        `🤖 Бот: ${this.telegramBot ? '✅ Активен' : '❌ Неактивен'}\n` +
        `⏰ Время: ${new Date().toLocaleString('ru-RU')}\n\n` +
        `Команды:\n` +
        `/screen_1 - скриншот профиля 1\n` +
        `/screen_2 - скриншот профиля 2\n` +
        `/screen_3 - скриншот профиля 3\n` +
        `/screen_4 - скриншот профиля 4\n` +
        `/screen_5 - скриншот профиля 5\n` +
        `/status - статус системы`;

      await this.telegramBot.sendMessage(targetChatId, statusMessage);
    } catch (error) {
      console.log('⚠ Ошибка отправки статуса:', error.message);
    }
  }

  // Отправка фото профиля
  async sendProfilePhoto(chatId = null, profileId) {
    try {
      const targetChatId = chatId || config.telegramBot.chatId;
      const profile = this.pages.find(p => p.profileId === profileId);
      
      if (!profile) {
        await this.telegramBot.sendMessage(targetChatId, `❌ Профиль ${profileId} не найден`);
        return;
      }

      const { page } = profile;
      
      // Делаем скриншот страницы
      const screenshot = await page.screenshot({ 
        type: 'png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
      });

      // Отправляем фото с правильным форматом
      await this.telegramBot.sendPhoto(targetChatId, screenshot, {
        caption: `📸 Профиль ${profileId}\n⏰ ${new Date().toLocaleString('ru-RU')}`,
        filename: `profile_${profileId}_${Date.now()}.png`
      });
    } catch (error) {
      console.log(`⚠ Ошибка отправки фото профиля ${profileId}:`, error.message);
      const targetChatId = chatId || config.telegramBot.chatId;
      await this.telegramBot.sendMessage(targetChatId, `❌ Ошибка получения фото профиля ${profileId}`);
    }
  }

  // Отправка уведомления об активации промокода
  async sendActivationNotification(profileId, promoCode, activationTime) {
    try {
      const message = `🎯 **Промокод активирован!**\n\n` +
        `👤 **Профиль:** ${profileId}\n` +
        `🎫 **Промокод:** \`${promoCode}\`\n` +
        `⏱️ **Время активации:** ${activationTime}\n` +
        `📅 **Дата:** ${new Date().toLocaleString('ru-RU')}`;

      await this.telegramBot.sendMessage(config.telegramBot.chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.log('⚠ Ошибка отправки уведомления об активации:', error.message);
    }
  }

  // Получение новых сообщений из канала БЕЗ FLOOD (только для fallback)
  async getNewPromoCodes() {
    try {
      if (!this.telegramClient) {
        console.log('🔧 Отладка: Telegram клиент не подключен');
        return [];
      }

      // Используем getMessages с минимальным лимитом
      const messages = await this.telegramClient.getMessages(config.telegram.channelUsername, {
        limit: 1,
        minId: this.lastMessageId
      });

      const promoCodes = [];
      for (const message of messages) {
        if (message.id > this.lastMessageId) {
          this.lastMessageId = message.id;
          const text = message.message || '';
          
          console.log('🔧 Отладка: Новое сообщение:', message.id, text);
          
          // Ищем промокоды - очень гибкий поиск
          const codeMatch = text.match(/\b[A-Za-z0-9]{4,30}\b/g);
          if (codeMatch) {
            console.log('🔧 Отладка: Найдены потенциальные коды:', codeMatch);
            
            // Берем все коды длиной от 6 символов
            const validCodes = codeMatch.filter(code => code.length >= 6);
            
            if (validCodes.length > 0) {
              console.log('🎯 Найден промокод:', validCodes);
              promoCodes.push(...validCodes);
            }
          }
        }
      }

      return promoCodes;
    } catch (error) {
      if (error.message.includes('FloodWaitError')) {
        throw error; // Пробрасываем flood error наверх
      }
      console.log('⚠ Ошибка получения промокодов:', error.message);
      return [];
    }
  }

  // Создание директорий для профилей
  async createProfileDirectories() {
    console.log(`Создание директорий для ${config.browserCount} профилей Firefox...`);
    
    for (let i = 1; i <= config.browserCount; i++) {
      const profilePath = path.resolve(`./firefox_profiles/profile_${i}`);
      await fs.ensureDir(profilePath);
      console.log(`Создана директория: ${profilePath}`);
    }
  }

  // Загрузка куки из файла
  async loadCookies(context, cookiesPath) {
    try {
      if (await fs.pathExists(cookiesPath)) {
        const cookiesData = await fs.readJson(cookiesPath);
        if (cookiesData && cookiesData.length > 0) {
          await context.addCookies(cookiesData);
          console.log(`✓ Загружено ${cookiesData.length} куки из ${path.basename(cookiesPath)}`);
        }
      }
    } catch (error) {
      console.log(`⚠ Не удалось загрузить куки: ${error.message}`);
    }
  }

  // Сохранение куки в файл
  async saveCookies(context, cookiesPath, page = null) {
    try {
      let cookies = [];
      
      // Пробуем получить куки через контекст
      if (context && !context._closed) {
        try {
          cookies = await context.cookies();
        } catch (error) {
          console.log(`⚠ Не удалось получить куки через контекст: ${error.message}`);
        }
      }
      
      // Если не получилось через контекст, пробуем через страницу
      if (cookies.length === 0 && page && !page.isClosed()) {
        try {
          cookies = await page.context().cookies();
        } catch (error) {
          console.log(`⚠ Не удалось получить куки через страницу: ${error.message}`);
        }
      }
      
      if (cookies && cookies.length > 0) {
        // Создаем директорию если не существует
        await fs.ensureDir(path.dirname(cookiesPath));
        
        // Сохраняем куки с форматированием
        await fs.writeJson(cookiesPath, cookies, { spaces: 2 });
        console.log(`✓ Сохранено ${cookies.length} куки в ${path.basename(cookiesPath)}`);
      } else {
        console.log(`⚠ Нет куки для сохранения в ${path.basename(cookiesPath)}`);
      }
    } catch (error) {
      console.log(`⚠ Не удалось сохранить куки: ${error.message}`);
    }
  }

  // Настройка stealth режима для обхода детекции
  async setupStealthMode(page, profile) {
    try {
      // Удаление webdriver свойств с уникальными характеристиками
      await page.addInitScript((profileData) => {
        // Удаляем webdriver флаги
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Удаляем automation флаги
        delete window.navigator.__proto__.webdriver;
        
        // Маскируем chrome runtime
        if (window.chrome && window.chrome.runtime) {
          delete window.chrome.runtime.onConnect;
          delete window.chrome.runtime.onMessage;
        }
        
        // Маскируем permissions API
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
        
        // Маскируем plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Маскируем languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['ru-RU', 'ru', 'en-US', 'en'],
        });
        
        // Маскируем platform
        Object.defineProperty(navigator, 'platform', {
          get: () => profileData.platform,
        });
        
        // Маскируем hardwareConcurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => profileData.hardwareConcurrency,
        });
        
        // Маскируем deviceMemory
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => profileData.deviceMemory,
        });
        
        // Маскируем screen с уникальными характеристиками
        Object.defineProperty(screen, 'availHeight', {
          get: () => profileData.viewport.height - 40,
        });
        Object.defineProperty(screen, 'availWidth', {
          get: () => profileData.viewport.width,
        });
        Object.defineProperty(screen, 'colorDepth', {
          get: () => 24,
        });
        Object.defineProperty(screen, 'pixelDepth', {
          get: () => 24,
        });
        
        // Добавляем реальную информацию о CPU и GPU через WebGL
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            Object.defineProperty(gl, 'getParameter', {
              value: function(parameter) {
                if (parameter === debugInfo.UNMASKED_RENDERER_WEBGL) {
                  return profileData.gpu;
                }
                if (parameter === debugInfo.UNMASKED_VENDOR_WEBGL) {
                  return 'NVIDIA Corporation';
                }
                return gl.getParameter.call(this, parameter);
              }
            });
          }
        }
        
        // Добавляем информацию о CPU через navigator
        Object.defineProperty(navigator, 'cpuClass', {
          get: () => profileData.cpu,
        });
        
        // Добавляем информацию о GPU через navigator
        Object.defineProperty(navigator, 'gpuVendor', {
          get: () => profileData.gpu,
        });
        
        // Добавляем информацию о GPU через WebGL context
        Object.defineProperty(navigator, 'webglVendor', {
          get: () => profileData.webglVendor,
        });
        
        Object.defineProperty(navigator, 'webglRenderer', {
          get: () => profileData.webglRenderer,
        });
      }, profile);

      // Установка дополнительных заголовков
      await page.setExtraHTTPHeaders({
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
      });

      console.log('✓ Stealth режим настроен');
    } catch (error) {
      console.log(`⚠ Ошибка настройки stealth режима: ${error.message}`);
    }
  }

  // Запуск Firefox браузера с прокси через Playwright
  async launchFirefoxBrowser(profileId) {
    console.log(`Запуск Firefox для профиля: Profile_${profileId}`);
    
    // Путь к файлу куки для профиля
    const cookiesPath = path.resolve(`./firefox_profiles/profile_${profileId}/cookies.json`);
    
    // Настройки Firefox с антидетект
    const browser = await firefox.launch({
      headless: config.headless,
      proxy: {
        server: config.proxy.server,
        username: config.proxy.username,
        password: config.proxy.password
      },
      args: config.firefox.args
    });

    // Выбор уникального профиля для каждого браузера
    const profileIndex = (profileId - 1) % config.stealth.profiles.length;
    const selectedProfile = config.stealth.profiles[profileIndex];
    
    console.log(`Profile_${profileId}: CPU: ${selectedProfile.cpu}, GPU: ${selectedProfile.gpu}, RAM: ${selectedProfile.deviceMemory}GB`);
    console.log(`Profile_${profileId}: Разрешение: ${selectedProfile.viewport.width}x${selectedProfile.viewport.height}`);
    
    // Создание контекста с уникальными характеристиками
    const context = await browser.newContext({
      userDataDir: path.resolve(`./firefox_profiles/profile_${profileId}`),
      userAgent: selectedProfile.userAgent,
      viewport: selectedProfile.viewport,
      locale: config.stealth.locale,
      timezoneId: config.stealth.timezoneId,
      geolocation: config.stealth.geolocation,
      permissions: config.stealth.permissions,
      extraHTTPHeaders: config.stealth.extraHTTPHeaders
    });

    // Загрузка сохраненных куки
    await this.loadCookies(context, cookiesPath);

    // Создание страницы
    const page = await context.newPage();

    // Дополнительные антидетект настройки с уникальными характеристиками
    await this.setupStealthMode(page, selectedProfile);

    // Сохранение куки при каждом изменении (если включено в конфиге)
    if (config.cookies.autoSave) {
      page.on('response', async (response) => {
        if (response.url().includes('mellstroy')) {
          try {
            await this.saveCookies(context, cookiesPath, page);
          } catch (error) {
            // Игнорируем ошибки автосохранения
          }
        }
      });
    }

    return { browser, context, page, profileId, cookiesPath, selectedProfile };
  }

  // Запуск всех браузеров
  async launchAllBrowsers() {
    console.log(`Запуск ${config.browserCount} Firefox браузеров...`);
    
    for (let i = 1; i <= config.browserCount; i++) {
      try {
        const { browser, context, page, profileId, cookiesPath } = await this.launchFirefoxBrowser(i);
        this.browsers.push(browser);
        this.pages.push({ page, context, profileId, cookiesPath });
        console.log(`✓ Браузер Profile_${i} запущен успешно`);
      } catch (error) {
        console.error(`✗ Ошибка запуска браузера Profile_${i}:`, error.message);
      }
    }
  }

  // Имитация поведения пользователя
  async simulateHumanBehavior(page) {
    try {
      // Случайная задержка
      await page.waitForTimeout(Math.random() * 2000 + 1000);
      
      // Случайное движение мыши
      await page.mouse.move(
        Math.random() * 1920,
        Math.random() * 1080,
        { steps: Math.floor(Math.random() * 10) + 5 }
      );
      
      // Случайная прокрутка
      await page.mouse.wheel(0, Math.random() * 500 + 100);
      
      // Случайная задержка
      await page.waitForTimeout(Math.random() * 1000 + 500);
    } catch (error) {
      // Игнорируем ошибки имитации
    }
  }

  // Переход на mellstroy
  async navigateToMellstroy() {
    console.log('Переход на mellstroy...');
    
    for (const { page, profileId } of this.pages) {
      try {
        await page.goto(config.mellstroy.baseUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        // Ожидание загрузки страницы
        await page.waitForTimeout(2000);
        
        // Попытка нажать на кнопку view_details
        try {
          // Пробуем разные селекторы
          const selectors = [
            'button.view_root-nfNUB div.view_details-nfNUB',
            'div.view_details-nfNUB',
            'button.view_root-nfNUB',
            '[class*="view_details"]',
            '[class*="view_root"]'
          ];
          
          let clicked = false;
          for (const selector of selectors) {
            try {
              await page.click(selector, { timeout: 2000 });
              console.log(`✓ Profile_${profileId}: Нажата кнопка view_details (селектор: ${selector})`);
              clicked = true;
              break;
            } catch (error) {
              // Пробуем следующий селектор
            }
          }
          
          if (!clicked) {
            console.log(`⚠ Profile_${profileId}: Не удалось найти кнопку view_details ни одним селектором`);
          }
        } catch (error) {
          console.log(`⚠ Profile_${profileId}: Ошибка при нажатии кнопки view_details: ${error.message}`);
        }
        
        // Ожидание после нажатия view_details
        await page.waitForTimeout(1000);
        
        // Попытка нажать на кнопку "Ваучеры" (не "Бонусы")
        try {
          const listSelectors = [
            '//div[contains(text(), "Ваучеры")]',
            '//button[contains(., "Ваучеры")]',
            '//div[contains(@class, "list-item") and contains(., "Ваучеры")]',
            '//div[contains(text(), "Активация кода")]',
            '//button[contains(., "Активация кода")]',
            '/html/body/div/div[3]/div/div/div[2]/div[2]/div/div[2]/div[2]/div[1]/button[2]/div[2]'
          ];
          
          let listClicked = false;
          for (const selector of listSelectors) {
            try {
              if (selector.startsWith('//') || selector.startsWith('/html')) {
                // XPath селектор
                await page.click(`xpath=${selector}`, { timeout: 2000 });
              } else {
                // CSS селектор
                await page.click(selector, { timeout: 2000 });
              }
              console.log(`✓ Profile_${profileId}: Нажата кнопка "Ваучеры" (селектор: ${selector})`);
              listClicked = true;
              break;
            } catch (error) {
              // Пробуем следующий селектор
            }
          }
          
          if (!listClicked) {
            console.log(`⚠ Profile_${profileId}: Не удалось найти кнопку "Ваучеры" ни одним селектором`);
          }
        } catch (error) {
          console.log(`⚠ Profile_${profileId}: Ошибка при нажатии кнопки "Ваучеры": ${error.message}`);
        }
        
        // Сохранение куки после успешной загрузки
        const { context, cookiesPath } = this.pages.find(p => p.profileId === profileId);
        await this.saveCookies(context, cookiesPath, page);
        
        console.log(`✓ Profile_${profileId}: Переход на mellstroy выполнен`);
        
        // Делаем скриншот при запуске профиля
        setTimeout(async () => {
          try {
            console.log(`📸 Profile_${profileId}: Делаем скриншот при запуске...`);
            const screenshot = await page.screenshot({ 
              type: 'png',
              fullPage: false,
              clip: { x: 0, y: 0, width: 1920, height: 1080 }
            });

            if (this.telegramBot) {
              await this.telegramBot.sendPhoto(config.telegramBot.chatId, screenshot, {
                caption: `🚀 Профиль ${profileId} запущен\n⏰ ${new Date().toLocaleString('ru-RU')}`,
                filename: `startup_${profileId}_${Date.now()}.png`
              });
              console.log(`📤 Profile_${profileId}: Скриншот запуска отправлен в Telegram`);
            }
          } catch (error) {
            console.log(`⚠ Profile_${profileId}: Ошибка отправки скриншота запуска:`, error.message);
          }
        }, 2000); // Ждем 2 секунды после загрузки
      } catch (error) {
        console.error(`✗ Profile_${profileId}: Ошибка перехода на mellstroy:`, error.message);
      }
    }
  }

  // Прохождение Geetest CAPTCHA v4
  async solveGeetestCaptcha(page, profileId) {
    try {
      console.log(`🔐 Profile_${profileId}: Начинаем прохождение Geetest CAPTCHA...`);
      
      // Ждем появления капчи
      await page.waitForSelector('.geetest_box', { timeout: 10000 });
      console.log(`🔧 Profile_${profileId}: Geetest CAPTCHA обнаружена`);
      
      // Получаем элементы капчи
      const slider = await page.$('.geetest_btn');
      const track = await page.$('.geetest_track');
      const slice = await page.$('.geetest_slice');
      const bg = await page.$('.geetest_bg');
      
      console.log(`🔧 Profile_${profileId}: Элементы капчи найдены:`, {
        slider: !!slider,
        track: !!track,
        slice: !!slice,
        bg: !!bg
      });
      
      if (!slider || !track || !slice || !bg) {
        console.log(`⚠ Profile_${profileId}: Не все элементы капчи найдены`);
        return false;
      }
      
      // Получаем размеры и позиции элементов
      const trackBox = await track.boundingBox();
      const sliceBox = await slice.boundingBox();
      const bgBox = await bg.boundingBox();
      
      if (!trackBox || !sliceBox || !bgBox) {
        console.log(`⚠ Profile_${profileId}: Не удалось получить размеры элементов`);
        return false;
      }
      
      // Простой и надежный анализ позиции фрагмента
      const sliceOffsetX = sliceBox.x - bgBox.x;
      const sliceOffsetY = sliceBox.y - bgBox.y;
      
      console.log(`🔧 Profile_${profileId}: Фрагмент смещен на X: ${sliceOffsetX}, Y: ${sliceOffsetY}`);
      console.log(`🔧 Profile_${profileId}: Размеры фрагмента: ${sliceBox.width}x${sliceBox.height}`);
      console.log(`🔧 Profile_${profileId}: Размеры фона: ${bgBox.width}x${bgBox.height}`);
      
      // В Geetest v4 анализируем изображение для точного определения позиции выреза
      let targetOffset;
      
      if (sliceOffsetX < 10) {
        // Фрагмент слева, анализируем изображение для поиска выреза
        try {
          console.log(`🔧 Profile_${profileId}: Анализируем изображение для поиска выреза`);
          
          // Получаем данные изображения через canvas
          const imageAnalysis = await page.evaluate(() => {
            return new Promise((resolve) => {
              const bgElement = document.querySelector('.geetest_bg');
              if (!bgElement) {
                resolve({ success: false, error: 'Background element not found' });
                return;
              }
              
              const style = window.getComputedStyle(bgElement);
              const bgImage = style.backgroundImage;
              const bgUrl = bgImage.replace(/url\(['"]?(.+?)['"]?\)/, '$1');
              
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = function() {
                try {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = img.width;
                  canvas.height = img.height;
                  
                  ctx.drawImage(img, 0, 0);
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const data = imageData.data;
                  
                  // Ищем вырез по разным критериям - более агрессивный поиск
                  let cutoutX = 0;
                  let foundCutout = false;
                  let bestMatch = { x: 0, score: 0 };
                  
                  // Сканируем ВСЕ изображение слева направо (вырез может быть где угодно)
                  const startX = Math.floor(canvas.width * 0.1);
                  const endX = Math.floor(canvas.width * 0.9); // Ограничиваем поиск 90% ширины
                  
                  for (let x = startX; x < endX; x++) {
                    let transparentPixels = 0;
                    let darkPixels = 0;
                    let lightPixels = 0;
                    let edgePixels = 0;
                    let cutoutShape = 0;
                    let contrastPixels = 0;
                    
                    for (let y = 0; y < canvas.height; y++) {
                      const index = (y * canvas.width + x) * 4;
                      const alpha = data[index + 3];
                      const r = data[index];
                      const g = data[index + 1];
                      const b = data[index + 2];
                      const brightness = (r + g + b) / 3;
                      
                      // Ищем прозрачные пиксели
                      if (alpha < 50) {
                        transparentPixels++;
                      }
                      // Ищем очень светлые пиксели (белые области)
                      else if (brightness > 200) {
                        lightPixels++;
                      }
                      // Ищем очень темные пиксели (черные области)
                      else if (brightness < 50) {
                        darkPixels++;
                      }
                      // Ищем пиксели на границах (резкие переходы)
                      else if (brightness > 100 && brightness < 150) {
                        edgePixels++;
                      }
                      
                      // Анализ контраста (вырез обычно имеет высокий контраст)
                      if (x > 0 && x < canvas.width - 1) {
                        const prevIndex = (y * canvas.width + (x - 1)) * 4;
                        const nextIndex = (y * canvas.width + (x + 1)) * 4;
                        
                        const prevR = data[prevIndex];
                        const prevG = data[prevIndex + 1];
                        const prevB = data[prevIndex + 2];
                        
                        const nextR = data[nextIndex];
                        const nextG = data[nextIndex + 1];
                        const nextB = data[nextIndex + 2];
                        
                        const contrast = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB) +
                                       Math.abs(r - nextR) + Math.abs(g - nextG) + Math.abs(b - nextB);
                        
                        if (contrast > 200) {
                          contrastPixels++;
                        }
                      }
                    }
                    
                    // Проверяем форму выреза - ищем вертикальные линии с аномальными пикселями
                    let verticalLines = 0;
                    for (let checkX = Math.max(0, x - 5); checkX <= Math.min(canvas.width - 1, x + 5); checkX++) {
                      let lineAnomalies = 0;
                      for (let y = 0; y < canvas.height; y++) {
                        const index = (y * canvas.width + checkX) * 4;
                        const alpha = data[index + 3];
                        const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
                        
                        if (alpha < 100 || brightness > 180 || brightness < 70) {
                          lineAnomalies++;
                        }
                      }
                      if (lineAnomalies > canvas.height * 0.2) {
                        verticalLines++;
                      }
                    }
                    
                    // Вычисляем "скор" для этой позиции (учитываем контраст)
                    const totalPixels = canvas.height;
                    const score = (transparentPixels * 6) + (lightPixels * 2) + (darkPixels * 2) + (edgePixels * 1) + (verticalLines * 5) + (contrastPixels * 4);
                    
                    // Если скор лучше предыдущего, сохраняем
                    if (score > bestMatch.score) {
                      bestMatch = { x: x, score: score };
                    }
                    
                    // Если в колонке много аномальных пикселей И есть вертикальные линии, это может быть вырез
                    // Очень мягкие критерии для поиска выреза
                    if ((transparentPixels > totalPixels * 0.001 || 
                         lightPixels > totalPixels * 0.005 || 
                         darkPixels > totalPixels * 0.005 ||
                         contrastPixels > totalPixels * 0.002) && verticalLines >= 1) {
                      cutoutX = x;
                      foundCutout = true;
                      console.log(`Найден вырез на X: ${x}, прозрачных: ${transparentPixels}, светлых: ${lightPixels}, темных: ${darkPixels}, контрастных: ${contrastPixels}, вертикальных линий: ${verticalLines}, скор: ${score}`);
                      break;
                    }
                  }
                  
                  // Если не нашли точный вырез, используем лучший матч
                  if (!foundCutout && bestMatch.score > 0) {
                    cutoutX = bestMatch.x;
                    foundCutout = true;
                    console.log(`Используем лучший матч на X: ${cutoutX}, скор: ${bestMatch.score}`);
                  }
                  
                  if (foundCutout) {
                    // Конвертируем позицию выреза в пиксели относительно размера элемента
                    const elementWidth = bgElement.offsetWidth;
                    const offsetRatio = cutoutX / canvas.width;
                    const targetOffset = offsetRatio * elementWidth;
                    
                    resolve({ 
                      success: true, 
                      offset: targetOffset,
                      cutoutX: cutoutX,
                      canvasWidth: canvas.width,
                      elementWidth: elementWidth
                    });
                  } else {
                    resolve({ success: false, error: 'Cutout not found' });
                  }
                } catch (error) {
                  resolve({ success: false, error: error.message });
                }
              };
              
              img.onerror = () => {
                resolve({ success: false, error: 'Failed to load image' });
              };
              
              img.src = bgUrl;
            });
          });
          
          if (imageAnalysis.success) {
            targetOffset = Math.round(imageAnalysis.offset);
            console.log(`🔧 Profile_${profileId}: Анализ изображения успешен!`);
            console.log(`🔧 Profile_${profileId}: Вырез найден на X: ${imageAnalysis.cutoutX}px`);
            console.log(`🔧 Profile_${profileId}: Ширина canvas: ${imageAnalysis.canvasWidth}px`);
            console.log(`🔧 Profile_${profileId}: Ширина элемента: ${imageAnalysis.elementWidth}px`);
            console.log(`🔧 Profile_${profileId}: Целевое смещение: ${targetOffset}px`);
            
            // Проверяем, что вырез находится в разумных пределах
            const cutoutRatio = imageAnalysis.cutoutX / imageAnalysis.canvasWidth;
            console.log(`🔧 Profile_${profileId}: Позиция выреза: ${Math.round(cutoutRatio * 100)}% от ширины изображения`);
            
     // Используем точное смещение без коррекции
     const bgWidth = bgBox.width;
     targetOffset = Math.round(cutoutRatio * bgWidth);
     console.log(`🔧 Profile_${profileId}: Точное смещение: ${targetOffset}px (${Math.round(cutoutRatio * 100)}%)`);
     
     // Добавляем небольшой отступ для точности
     targetOffset = Math.max(targetOffset, 20); // Минимум 20px
     targetOffset = Math.min(targetOffset, bgWidth - 20); // Максимум ширина - 20px
     console.log(`🔧 Profile_${profileId}: Финальное смещение: ${targetOffset}px`);
          } else {
            console.log(`🔧 Profile_${profileId}: Ошибка анализа изображения: ${imageAnalysis.error}`);
            
            // Умный fallback на основе размеров элементов
            const sliceWidth = sliceBox.width;
            const bgWidth = bgBox.width;
            
            // Вычисляем примерную позицию выреза на основе размеров
            // Вырез может быть где угодно, используем случайную позицию
            const estimatedCutoutPosition = bgWidth * (0.05 + Math.random() * 0.9); // 5%-95% от ширины фона
            targetOffset = Math.round(estimatedCutoutPosition);
            
            console.log(`🔧 Profile_${profileId}: Используем умный fallback: ${targetOffset}px (${Math.round(estimatedCutoutPosition/bgWidth*100)}% от ширины фона)`);
          }
        } catch (error) {
          console.log(`🔧 Profile_${profileId}: Ошибка при анализе изображения: ${error.message}`);
          // Fallback на основе размеров фона
          const bgWidth = bgBox.width;
          targetOffset = Math.round(bgWidth * 0.3); // 30% от ширины фона
          console.log(`🔧 Profile_${profileId}: Fallback смещение: ${targetOffset}px`);
        }
      } else {
        // Фрагмент уже в позиции, используем его смещение
        targetOffset = sliceOffsetX;
        console.log(`🔧 Profile_${profileId}: Используем стандартное смещение: ${targetOffset}px`);
      }
      
      console.log(`🔧 Profile_${profileId}: Целевое смещение: ${targetOffset}px`);
      
      // Получаем реальную позицию слайдера
      const sliderBox = await slider.boundingBox();
      if (!sliderBox) {
        console.log(`⚠ Profile_${profileId}: Не удалось получить позицию слайдера`);
        return false;
      }
      
      // Используем координаты самого слайдера для клика
      const startX = sliderBox.x + sliderBox.width / 2; // Центр слайдера
      const startY = sliderBox.y + sliderBox.height / 2; // Центр слайдера
      
      console.log(`🔧 Profile_${profileId}: Реальная позиция слайдера: ${sliderBox.x}, ${sliderBox.y}`);
      console.log(`🔧 Profile_${profileId}: Центр слайдера: ${startX}, ${startY}`);
      
      // Вычисляем целевую позицию на основе смещения от слайдера
      let targetX = startX + targetOffset; // Относительно начальной позиции слайдера
      
      // Проверяем, что целевая позиция не выходит за границы track
      if (targetX <= trackBox.x) {
        console.log(`🔧 Profile_${profileId}: Целевая позиция ${targetX} <= начала track ${trackBox.x}, корректируем`);
        targetX = trackBox.x + trackBox.width * 0.8; // 80% от ширины track
        console.log(`🔧 Profile_${profileId}: Новая целевая позиция: ${targetX}`);
      } else if (targetX > trackBox.x + trackBox.width) {
        console.log(`🔧 Profile_${profileId}: Целевая позиция ${targetX} выходит за границы track, корректируем`);
        targetX = trackBox.x + trackBox.width - 20; // Конец track - отступ
        console.log(`🔧 Profile_${profileId}: Новая целевая позиция: ${targetX}`);
      }
      
      console.log(`🔧 Profile_${profileId}: Координаты track:`, trackBox);
      console.log(`🔧 Profile_${profileId}: Координаты slice:`, sliceBox);
      console.log(`🔧 Profile_${profileId}: Координаты bg:`, bgBox);
      console.log(`🔧 Profile_${profileId}: Начальная позиция: ${startX}, ${startY}`);
      console.log(`🔧 Profile_${profileId}: Целевая позиция: ${targetX}, ${startY}`);
      
      // Финальная проверка - расстояние должно быть достаточным
      const dragDistance = targetX - startX;
      console.log(`🔧 Profile_${profileId}: Расстояние для перетаскивания: ${dragDistance}px`);
      if (dragDistance <= 0 || dragDistance < 50) {
        console.log(`🔧 Profile_${profileId}: Расстояние перетаскивания ${dragDistance}px, корректируем`);
        // Увеличиваем расстояние до минимум 100px
        targetX = startX + Math.max(100, Math.abs(targetOffset) * 1.5);
        console.log(`🔧 Profile_${profileId}: Исправленная целевая позиция: ${targetX}, расстояние: ${targetX - startX}px`);
      }
      
      // Попробуем использовать dragAndDrop для более надежного перетаскивания
      console.log(`🔧 Profile_${profileId}: Пробуем dragAndDrop от ${startX},${startY} до ${targetX},${startY}`);
      
      // Используем простой и надежный метод - кликаем и перетаскиваем по track
      console.log(`🔧 Profile_${profileId}: Используем простой метод перетаскивания`);
      
      // Наводим мышь на слайдер
      await page.mouse.move(startX, startY, { steps: 3 });
      await page.waitForTimeout(200);
      
      // Нажимаем и удерживаем
      console.log(`🔧 Profile_${profileId}: Нажимаем и удерживаем мышь`);
      await page.mouse.down();
      await page.waitForTimeout(100);
      
      // Простое перетаскивание - двигаемся по прямой линии
      const finalDragDistance = targetX - startX;
      console.log(`🔧 Profile_${profileId}: Перетаскиваем на расстояние: ${finalDragDistance}px`);
      
      // Двигаемся плавно к целевой позиции с большим количеством шагов для точности
      await page.mouse.move(targetX, startY, { steps: 50 });
      await page.waitForTimeout(500);
      
      // Отпускаем мышь
      console.log(`🔧 Profile_${profileId}: Отпускаем мышь`);
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      console.log(`🔧 Profile_${profileId}: Перетаскивание завершено`);
      
      // Ждем результат и проверяем позицию слайдера
      await page.waitForTimeout(1000);

      // Проверяем, сдвинулся ли слайдер
      const newSliderBox = await slider.boundingBox();
      if (newSliderBox) {
        const sliderMoved = Math.abs(newSliderBox.x - sliderBox.x) > 10;
        console.log(`🔧 Profile_${profileId}: Слайдер сдвинулся: ${sliderMoved}, новая позиция: ${newSliderBox.x}`);
      }

      // Делаем скриншот после движения для анализа
      console.log(`📸 Profile_${profileId}: Делаем скриншот после движения слайдера...`);
      const screenshotAfter = await page.screenshot({ type: 'png' });
      
      // Анализируем, попали ли мы в вырез
      const analysisResult = await page.evaluate(() => {
        const slice = document.querySelector('.geetest_slice');
        const bg = document.querySelector('.geetest_bg');
        
        if (!slice || !bg) {
          console.log('🔧 Элементы не найдены после движения');
          return { success: false, reason: 'Elements not found after movement' };
        }
        
        const sliceBox = slice.getBoundingClientRect();
        const bgBox = bg.getBoundingClientRect();
        
        console.log(`🔧 Элементы найдены: slice.x=${sliceBox.x}, bg.x=${bgBox.x}`);
        
        return {
          sliceX: sliceBox.x,
          sliceY: sliceBox.y,
          bgX: bgBox.x,
          bgY: bgBox.y
        };
      });
      
      // Проверяем, найдены ли элементы
      if (analysisResult.success === false) {
        console.log(`❌ Profile_${profileId}: Элементы капчи не найдены после движения: ${analysisResult.reason}`);
        console.log(`⚠ Profile_${profileId}: Возможно, капча исчезла или изменилась`);
        
        // Ждем еще немного и проверяем, исчезла ли капча
        await page.waitForTimeout(2000);
        const captchaStillVisible = await page.$('.geetest_box');
        if (!captchaStillVisible) {
          console.log(`✅ Profile_${profileId}: Geetest CAPTCHA успешно пройдена (элементы исчезли)`);
          return true;
        } else {
          console.log(`⚠ Profile_${profileId}: CAPTCHA не пройдена, элементы не найдены`);
          return false;
        }
      }
      
      // Вычисляем правильные координаты выреза используя СВЕЖИЕ координаты bg
      const targetCutoutX = analysisResult.bgX + targetOffset; // Позиция выреза в bg (свежие координаты)
      const targetCutoutY = analysisResult.bgY + sliceOffsetY; // Позиция выреза по Y (свежие координаты)
      
      console.log(`🔧 Profile_${profileId}: Вычисляем координаты выреза:`);
      console.log(`🔧 Profile_${profileId}: bg.x=${analysisResult.bgX}, targetOffset=${targetOffset}, targetCutoutX=${targetCutoutX}`);
      console.log(`🔧 Profile_${profileId}: bg.y=${analysisResult.bgY}, sliceOffsetY=${sliceOffsetY}, targetCutoutY=${targetCutoutY}`);
      
      // В Geetest slice движется только по X, но Y координата slice определяется автоматически
      // Поэтому мы не можем контролировать Y координату slice
      console.log(`🔧 Profile_${profileId}: В Geetest slice движется только по X, Y координата определяется автоматически`);
      
      // Вычисляем разности
      const xDiff = Math.abs(analysisResult.sliceX - targetCutoutX);
      const yDiff = Math.abs(analysisResult.sliceY - targetCutoutY);
      
      console.log(`🔧 Profile_${profileId}: Анализ попадания:`);
      console.log(`🔧 Profile_${profileId}: slice.x=${analysisResult.sliceX}, bg.x=${analysisResult.bgX}, target.x=${targetCutoutX}, разница X=${xDiff}`);
      console.log(`🔧 Profile_${profileId}: slice.y=${analysisResult.sliceY}, bg.y=${analysisResult.bgY}, target.y=${targetCutoutY}, разница Y=${yDiff}`);
      
      // Если разница по X меньше 0.0005px и по Y меньше 0.0005px, считаем что попали
      const success = xDiff < 0.0005 && yDiff < 0.0005;
      
      if (success) {
        console.log(`✅ Profile_${profileId}: Пазл попал в вырез!`);
        
        // Ждем еще немного для обработки результата
        await page.waitForTimeout(2000);
        
        // Проверяем, исчезла ли капча
        const captchaStillVisible = await page.$('.geetest_box');
        if (!captchaStillVisible) {
          console.log(`✅ Profile_${profileId}: Geetest CAPTCHA успешно пройдена`);
          return true;
        } else {
          console.log(`⚠ Profile_${profileId}: Пазл попал, но капча не исчезла`);
          return false;
        }
      } else {
        console.log(`❌ Profile_${profileId}: Пазл не попал в вырез. Разница X: ${xDiff}px, Y: ${yDiff}px`);
        
        // Если разница по Y очень маленькая, значит мы почти попали по Y
        if (yDiff < 10) {
          console.log(`🔧 Profile_${profileId}: Разница по Y очень маленькая (${yDiff}px), корректируем только по X`);
        }
        
        // В Geetest slice движется только по X, коррекция по Y невозможна
        if (yDiff > 0.0002) {
          console.log(`🔧 Profile_${profileId}: Разница по Y ${yDiff}px, но в Geetest slice движется только по X`);
          console.log(`🔧 Profile_${profileId}: Коррекция по Y невозможна, продолжаем только с X`);
        }
        
        // Если не попали, пробуем скорректировать позицию
        const correctionX = targetCutoutX - analysisResult.sliceX;
        console.log(`🔧 Profile_${profileId}: Корректируем позицию на ${correctionX}px (от ${analysisResult.sliceX} до ${targetCutoutX})`);
        
        // Если коррекция очень маленькая, делаем её более точной
        if (Math.abs(correctionX) < 50) {
          console.log(`🔧 Profile_${profileId}: Маленькая коррекция, делаем её более точной`);

          // Двигаем слайдер на корректирующее расстояние относительно текущей позиции
          const currentSliderBox = await slider.boundingBox();
          if (currentSliderBox) {
            const currentSliderCenterX = currentSliderBox.x + currentSliderBox.width / 2;
            const correctionTargetX = currentSliderCenterX + correctionX;
            console.log(`🔧 Profile_${profileId}: Корректируем с ${currentSliderCenterX} до ${correctionTargetX}`);

            // Делаем коррекцию более плавной
            await page.mouse.move(correctionTargetX, startY, { steps: 5 });
            await page.waitForTimeout(200);
          }
        } else {
          console.log(`🔧 Profile_${profileId}: Большая коррекция, пропускаем`);
        }
        
        // Если мы очень близко к цели (разница < 10px), делаем дополнительную коррекцию
        if (xDiff < 10 && yDiff < 10) {
          console.log(`🔧 Profile_${profileId}: Очень близко к цели, делаем дополнительную коррекцию`);
          
          // Делаем еще одну коррекцию для максимальной точности (только по X)
          const finalCorrectionX = targetCutoutX - analysisResult.sliceX;
          
          if (Math.abs(finalCorrectionX) > 0.0002) {
            console.log(`🔧 Profile_${profileId}: Финальная коррекция X: ${finalCorrectionX}px`);
            
            const currentSliderBox = await slider.boundingBox();
            if (currentSliderBox) {
              const currentSliderCenterX = currentSliderBox.x + currentSliderBox.width / 2;
              const finalTargetX = currentSliderCenterX + finalCorrectionX;
              console.log(`🔧 Profile_${profileId}: Финальная коррекция с ${currentSliderCenterX} до ${finalTargetX}`);
              
              // Очень плавная финальная коррекция только по X
              await page.mouse.move(finalTargetX, startY, { steps: 3 });
              await page.waitForTimeout(100);
            }
          }
        }
        
        // Делаем еще один скриншот после коррекции
        console.log(`📸 Profile_${profileId}: Делаем скриншот после коррекции...`);
        const screenshotAfterCorrection = await page.screenshot({ type: 'png' });
        
        // Ждем результат
        await page.waitForTimeout(2000);
        
        // Проверяем, исчезла ли капча
        const captchaStillVisible = await page.$('.geetest_box');
        if (!captchaStillVisible) {
          console.log(`✅ Profile_${profileId}: Geetest CAPTCHA успешно пройдена после коррекции`);
          return true;
        } else {
          console.log(`⚠ Profile_${profileId}: CAPTCHA не пройдена даже после коррекции`);
          return false;
        }
      }
      
    } catch (error) {
      console.error(`✗ Profile_${profileId}: Ошибка прохождения Geetest CAPTCHA:`, error.message);
      return false;
    }
  }

  // Локальное решение Geetest v4 "Select in this order" без сторонних сервисов (перебор последовательностей)
  async solveGeetestV4SelectOrder(page, profileId) {
    try {
      console.log(`🤖 Profile_${profileId}: Локальная попытка решить Geetest v4 (select in this order)...`);
      // Находим целевой фрейм с капчей (вдруг она в iframe)
      let target = page;
      try {
        // Быстрый опрос всех фреймов
        for (const f of page.frames()) {
          try {
            const hasBox = await f.$('.geetest_box');
            if (hasBox) { target = f; break; }
          } catch (_) {}
        }
      } catch (_) {}

      await target.waitForSelector('.geetest_box', { timeout: 10000 });

      const okButtonSelectors = ['text=OK', '.geetest_commit', '.geetest_btn_confirm', 'button:has-text("OK")'];
      const refreshSelectors = ['.geetest_refresh', '[class*="refresh"]'];

      // Вспомогательная: k-перестановки из массива (без повторов)
      const kPermutations = (arr, k) => {
        const result = [];
        const used = Array(arr.length).fill(false);
        const current = [];
        const dfs = () => {
          if (current.length === k) { result.push(current.slice()); return; }
          for (let i = 0; i < arr.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            current.push(arr[i]);
            dfs();
            current.pop();
            used[i] = false;
          }
        };
        dfs();
        return result;
      };

      let latestCroppedScreenshot = null; // для отладки/телеграма при неудаче

      // До 6 итераций: на каждой переопределяем область, детектим цели и пробуем несколько последовательностей
      for (let round = 0; round < 6; round++) {
        if (page.isClosed && page.isClosed()) { console.log(`⚠ Profile_${profileId}: Страница закрыта (start round ${round+1})`); return false; }
        if (page.context && page.context().isClosed && page.context().isClosed()) { console.log(`⚠ Profile_${profileId}: Контекст закрыт (start round ${round+1})`); return false; }

        // Находим область изображения динамически внутри .geetest_box на каждой итерации (в контексте целевого фрейма)
        const imgRect = await target.evaluate(() => {
          const box = document.querySelector('.geetest_box');
          if (!box) return null;
          const candidates = Array.from(box.querySelectorAll('canvas, img, div'));
          let best = null;
          let bestEl = null;
          const sx = window.scrollX, sy = window.scrollY;
          for (const el of candidates) {
            const style = window.getComputedStyle(el);
            const hasBg = style.backgroundImage && style.backgroundImage !== 'none';
            const isCanvasOrImg = el.tagName === 'CANVAS' || el.tagName === 'IMG';
            if (!isCanvasOrImg && !hasBg) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 120 || r.height < 80) continue;
            const area = r.width * r.height;
            if (!best || area > best.area) {
              best = {
                client: { x: r.left, y: r.top, width: r.width, height: r.height },
                page: { x: r.left + sx, y: r.top + sy, width: r.width, height: r.height },
                area
              };
              bestEl = el;
            }
          }
          try { if (bestEl) bestEl.setAttribute('data-gt-main', '1'); } catch(_) {}
          return best ? best : null;
        });

        if (!imgRect) {
          console.log(`⚠ Profile_${profileId}: Не найдена область изображения капчи (итерация ${round+1})`);
          // Обновим виджет и попробуем ещё раз в следующей итерации
          try {
            const sels = ['.geetest_refresh', '[class*="refresh"]'];
            for (const rsel of sels) { try { await target.click(rsel, { timeout: 200 }); } catch (e) {} }
            await page.waitForTimeout(600);
          } catch (_) {}
          continue;
        }

        const imgBoxClient = imgRect.client; // для кликов/elementFromPoint (внутри фрейма)
        const imgBoxPage = imgRect.page;     // для screenshot clip

        // Смещение iframe в координатах страницы (нужно для page.mouse.*)
        let frameOffsetClient = { x: 0, y: 0 };
        try {
          if (target !== page) {
            const fe = await target.frameElement();
            if (fe) {
              const fb = await fe.boundingBox();
              if (fb) frameOffsetClient = { x: fb.x, y: fb.y };
            }
          }
        } catch(_) {}

        // Собираем геометрию виджета и иконок порядка (в верхней части)
        const widgetInfo = await target.evaluate(() => {
          const w = document.querySelector('.geetest_box');
          if (!w) return null;
          const wr = w.getBoundingClientRect();
          const sx = window.scrollX, sy = window.scrollY;
          const all = Array.from(w.querySelectorAll('img, svg, [class*="icon"], [class*="order"], [class*="tip"], [class*="target"]'));
          const iconsClient = [];
          const iconsPage = [];
          for (const el of all) {
            const r = el.getBoundingClientRect();
            // Фильтруем мелкие элементы в верхней полосе
            if (r.width >= 14 && r.width <= 48 && r.height >= 14 && r.height <= 48 && (r.top - wr.top) < 130) {
              iconsClient.push({ x: r.left, y: r.top, w: r.width, h: r.height });
              iconsPage.push({ x: r.left + sx, y: r.top + sy, w: r.width, h: r.height });
            }
          }
          iconsClient.sort((a,b)=>a.x-b.x);
          iconsPage.sort((a,b)=>a.x-b.x);
          return {
            client: { x: wr.left, y: wr.top, width: wr.width, height: wr.height },
            page: { x: wr.left + sx, y: wr.top + sy, width: wr.width, height: wr.height },
            iconsClient,
            iconsPage
          };
        });
        if (!widgetInfo) {
          console.log(`⚠ Profile_${profileId}: Не удалось получить геометрию виджета (итерация ${round+1})`);
        }

        // Пытаемся определить требуемое число целей (иконки в заголовке), fallback = 3
        const requiredTargets = await target.evaluate(() => {
          const header = document.querySelector('.geetest_box');
          if (!header) return 3;
          const headerRect = header.getBoundingClientRect();
          const icons = header.querySelectorAll('img, svg, [class*="icon"], [class*="tip"], [class*="order"], [class*="target"]');
          const count = [...icons].filter(el => {
            const r = el.getBoundingClientRect();
            return (r.top - headerRect.top) < 100 && r.height < 80 && r.width < 80;
          }).length;
          if (count >= 2 && count <= 5) return count;
          return 3;
        });

        // Делаем снимок области — предпочтительно через сам элемент (учитывает масштаб и iframe)
        let pngBuffer;
        try {
          const imgElHandle = await target.$('[data-gt-main="1"]');
          if (imgElHandle) pngBuffer = await imgElHandle.screenshot({ type: 'png' });
        } catch(_) {}
        if (!pngBuffer) {
          pngBuffer = await page.screenshot({ type: 'png', clip: { x: imgBoxPage.x, y: imgBoxPage.y, width: imgBoxPage.width, height: imgBoxPage.height } });
        }
        latestCroppedScreenshot = pngBuffer;
        const base64 = pngBuffer.toString('base64');
        let widgetB64 = null; let iconsRel = [];
        try {
          if (widgetInfo) {
            try {
              const widgetHandle = await target.$('.geetest_box');
              if (widgetHandle) {
                const widgetBuffer = await widgetHandle.screenshot({ type: 'png' });
                widgetB64 = widgetBuffer.toString('base64');
              }
            } catch(_) {}
            if (!widgetB64) {
              const widgetBuffer = await page.screenshot({ type: 'png', clip: { x: widgetInfo.page.x, y: widgetInfo.page.y, width: widgetInfo.page.width, height: widgetInfo.page.height } });
              widgetB64 = widgetBuffer.toString('base64');
            }
            widgetB64 = widgetBuffer.toString('base64');
            if (Array.isArray(widgetInfo.iconsPage)) {
              // Переводим координаты иконок (page) в относительные к widget (page)
              iconsRel = widgetInfo.iconsPage.map(ic => ({
                x: Math.max(0, ic.x - widgetInfo.page.x),
                y: Math.max(0, ic.y - widgetInfo.page.y),
                w: ic.w,
                h: ic.h
              }));
            }
          }
        } catch (e) {
          // игнорируем проблемы скриншота виджета
        }

        // Детектируем "мишени" с расширенными диапазонами HSV и динамическим порогом площади
        const det = await target.evaluate(async ({ imgB64, widgetB64, icons }) => {
          function rgbToHsv(r, g, b) {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r,g,b), min = Math.min(r,g,b);
            let h, s, v = max;
            const d = max - min;
            s = max === 0 ? 0 : d / max;
            if (max === min) { h = 0; }
            else {
              switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
              }
              h /= 6;
            }
            return [h*360, s, v];
          }

          function hueInRanges(h, ranges) {
            return ranges.some(([h1, h2]) => {
              if (h1 <= h2) return h >= h1 && h <= h2; // обычный интервал
              // обернутый через 360 (например 345..360)
              return h >= h1 || h <= h2;
            });
          }

          function morphClose(mask, w, h) {
            // 3x3 dilation followed by erosion to fill small gaps
            const dilated = new Uint8Array(w*h);
            for (let y=0; y<h; y++) {
              for (let x=0; x<w; x++) {
                let on = 0;
                for (let dy=-1; dy<=1; dy++) {
                  for (let dx=-1; dx<=1; dx++) {
                    const nx = x+dx, ny = y+dy;
                    if (nx<0||ny<0||nx>=w||ny>=h) continue;
                    if (mask[ny*w+nx]) { on=1; break; }
                  }
                  if (on) break;
                }
                dilated[y*w+x] = on;
              }
            }
            const eroded = new Uint8Array(w*h);
            for (let y=0; y<h; y++) {
              for (let x=0; x<w; x++) {
                let all = 1;
                for (let dy=-1; dy<=1; dy++) {
                  for (let dx=-1; dx<=1; dx++) {
                    const nx = x+dx, ny = y+dy;
                    if (nx<0||ny<0||nx>=w||ny>=h) { all=0; break; }
                    if (!dilated[ny*w+nx]) { all=0; break; }
                  }
                  if (!all) break;
                }
                eroded[y*w+x] = all ? 1 : 0;
              }
            }
            return eroded;
          }

          function detectClusters(ctx, w, h) {
            const img = ctx.getImageData(0, 0, w, h);
            const data = img.data;
            let mask = new Uint8Array(w*h);
            // Расширенные цветовые диапазоны: красный, оранжевый/желтый, зелёный, синий/циан, фиолетовый
            const hueRanges = [
              [345, 360],
              [0, 15],
              [15, 55],
              [50, 75],
              [75, 160],
              [160, 280],
              [280, 320]
            ];
            for (let y=0; y<h; y++) {
              for (let x=0; x<w; x++) {
                const i = (y*w + x) * 4;
                const [H,S,V] = rgbToHsv(data[i], data[i+1], data[i+2]);
                if (hueInRanges(H, hueRanges) && S > 0.18 && V > 0.28) mask[y*w + x] = 1;
              }
            }

            // Морфологическое замыкание для очистки шума
            mask = morphClose(mask, w, h);
            // Простая кластеризация (BFS)
            const visited = new Uint8Array(w*h);
            const clusters = [];
            const qx = new Int32Array(w*h);
            const qy = new Int32Array(w*h);
            const minArea = Math.max(50, Math.floor(0.00025 * w * h));
            for (let y=0; y<h; y++) {
              for (let x=0; x<w; x++) {
                const idx = y*w + x;
                if (!mask[idx] || visited[idx]) continue;
                let head = 0, tail = 0;
                qx[tail] = x; qy[tail] = y; tail++;
                visited[idx] = 1;
                let sumX = 0, sumY = 0, cnt = 0, minX=x, minY=y, maxX=x, maxY=y;
                while (head < tail) {
                  const cx = qx[head];
                  const cy = qy[head];
                  head++;
                  sumX += cx; sumY += cy; cnt++;
                  if (cx<minX) minX=cx; if (cx>maxX) maxX=cx;
                  if (cy<minY) minY=cy; if (cy>maxY) maxY=cy;
                  for (let dy=-1; dy<=1; dy++) {
                    for (let dx=-1; dx<=1; dx++) {
                      if (dx===0 && dy===0) continue;
                      const nx = cx + dx, ny = cy + dy;
                      if (nx<0||ny<0||nx>=w||ny>=h) continue;
                      const nidx = ny*w + nx;
                      if (!mask[nidx] || visited[nidx]) continue;
                      visited[nidx] = 1;
                      qx[tail] = nx; qy[tail] = ny; tail++;
                    }
                  }
                }
                const area = cnt;
                const bboxW = maxX - minX + 1;
                const bboxH = maxY - minY + 1;
                if (area >= minArea && bboxW > 8 && bboxH > 8) {
                  // доуточняем центр в окрестности 12px по маске
                  const cx0 = Math.round(sumX/area), cy0 = Math.round(sumY/area);
                  let wx=0, wy=0, wsum=0;
                  const r = 12;
                  for (let dy=-r; dy<=r; dy++) {
                    for (let dx=-r; dx<=r; dx++) {
                      const x2 = cx0+dx, y2 = cy0+dy;
                      if (x2<0||y2<0||x2>=w||y2>=h) continue;
                      const m = mask[y2*w + x2];
                      if (!m) continue;
                      const wgt = 1;
                      wx += x2 * wgt; wy += y2 * wgt; wsum += wgt;
                    }
                  }
                  const rcx = wsum ? wx/wsum : cx0;
                  const rcy = wsum ? wy/wsum : cy0;
                  // оценим средний оттенок вокруг центра
                  let hueSum = 0, hueCnt = 0;
                  for (let dy=-8; dy<=8; dy++) {
                    for (let dx=-8; dx<=8; dx++) {
                      const x2 = Math.round(rcx)+dx, y2 = Math.round(rcy)+dy;
                      if (x2<0||y2<0||x2>=w||y2>=h) continue;
                      const ii = (y2*w + x2) * 4;
                      const [h,s,v] = rgbToHsv(data[ii], data[ii+1], data[ii+2]);
                      if (s > 0.12 && v > 0.2) { hueSum += h; hueCnt++; }
                    }
                  }
                  const meanHue = hueCnt ? (hueSum / hueCnt) : 0;
                  clusters.push({ cx: rcx, cy: rcy, area, hue: meanHue, bbox: { x:minX, y:minY, w:bboxW, h:bboxH } });
                }
              }
            }
            // Слияние близко расположенных кластеров (дедупликация)
            const mergeDistance = Math.max(12, Math.floor(0.03 * Math.min(w, h)));
            const merged = [];
            clusters.sort((a,b)=>b.area-a.area);
            for (const c of clusters) {
              let mergedInto = false;
              for (const m of merged) {
                const dx = c.cx - m.cx;
                const dy = c.cy - m.cy;
                if (dx*dx + dy*dy <= mergeDistance*mergeDistance) {
                  // area-weighted centroid
                  const total = m.area + c.area;
                  m.cx = (m.cx*m.area + c.cx*c.area) / total;
                  m.cy = (m.cy*m.area + c.cy*c.area) / total;
                  m.area = total;
                  mergedInto = true;
                  break;
                }
              }
              if (!mergedInto) merged.push({ ...c });
            }
            merged.sort((a,b)=>b.area-a.area);
            return merged.slice(0, 8);
          }
          // Преобразование патча в бинарную карту контуров 24x24
          function edgeMaskFromPatch(patchCanvas) {
            const w = 24, h = 24;
            const tmp = document.createElement('canvas'); tmp.width=w; tmp.height=h;
            const tctx = tmp.getContext('2d');
            tctx.drawImage(patchCanvas, 0, 0, w, h);
            const d = tctx.getImageData(0,0,w,h).data;
            const mask = new Uint8Array(w*h);
            // простой градиент
            const idx = (x,y)=> (y*w + x)*4;
            const gray = new Float32Array(w*h);
            for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
              const i=idx(x,y); const r=d[i], g=d[i+1], b=d[i+2]; gray[y*w+x]=(r+g+b)/3;
            }
            for (let y=1;y<h-1;y++) for (let x=1;x<w-1;x++) {
              const gx = -gray[y*w+(x-1)] + gray[y*w+(x+1)];
              const gy = -gray[(y-1)*w+x] + gray[(y+1)*w+x];
              const mag = Math.abs(gx)+Math.abs(gy);
              if (mag > 40) mask[y*w+x]=1;
            }
            return { w, h, mask };
          }

          function hamming(a,b) {
            const n = Math.min(a.mask.length, b.mask.length); let s=0; for (let i=0;i<n;i++) s += (a.mask[i]^b.mask[i]); return s / n;
          }

          return await new Promise((resolve) => {
            const img = new Image();
            const widgetImg = new Image();
            let imgLoaded=false, widgetLoaded = !widgetB64; // если нет виджета, считаем загруженным
            const tryResolve = () => {
              if (!imgLoaded || !widgetLoaded) return;
              // Подготовим канвасы
              const canvas = document.createElement('canvas');
              canvas.width = img.width; canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              const clusters = detectClusters(ctx, canvas.width, canvas.height);

              let iconMasks = [];
              if (widgetB64 && icons && icons.length) {
                const wCanvas = document.createElement('canvas');
                wCanvas.width = widgetImg.width; wCanvas.height = widgetImg.height;
                const wctx = wCanvas.getContext('2d');
                wctx.drawImage(widgetImg, 0, 0);
                iconMasks = icons.map(ic => {
                  const p = document.createElement('canvas');
                  p.width = Math.max(1, Math.min(wCanvas.width, Math.round(ic.w)));
                  p.height = Math.max(1, Math.min(wCanvas.height, Math.round(ic.h)));
                  try { p.getContext('2d').drawImage(wCanvas, Math.round(ic.x), Math.round(ic.y), Math.round(ic.w), Math.round(ic.h), 0, 0, p.width, p.height); } catch(_){}
                  return edgeMaskFromPatch(p);
                });
              }

              // Подготовим маски кандидатов (по их bbox с небольшим полем)
              const candMasks = clusters.map(c => {
                const pad = 6;
                const x = Math.max(0, Math.round(c.bbox.x - pad));
                const y = Math.max(0, Math.round(c.bbox.y - pad));
                const w = Math.min(canvas.width - x, Math.round(c.bbox.w + pad*2));
                const h = Math.min(canvas.height - y, Math.round(c.bbox.h + pad*2));
                const p = document.createElement('canvas'); p.width=Math.max(1,w); p.height=Math.max(1,h);
                try { p.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, p.width, p.height); } catch(_){}
                return edgeMaskFromPatch(p);
              });

              // Сопоставление иконок с кандидатами (жадно)
              const orderIndices = [];
              if (iconMasks.length >= 2 && candMasks.length >= iconMasks.length) {
                const used = new Set();
                for (let i=0;i<iconMasks.length;i++) {
                  let best=-1, bestD=1e9;
                  for (let j=0;j<candMasks.length;j++) {
                    if (used.has(j)) continue;
                    const d = hamming(iconMasks[i], candMasks[j]);
                    if (d < bestD) { bestD = d; best = j; }
                  }
                  if (best>=0) { used.add(best); orderIndices.push(best); }
                }
              }

              resolve({
                width: canvas.width,
                height: canvas.height,
                points: clusters.map(c=>({ x:c.cx, y:c.cy, area:c.area, hue: c.hue })),
                iconOrder: orderIndices
              });
            };
            img.onload = () => { imgLoaded=true; tryResolve(); };
            widgetImg.onload = () => { widgetLoaded=true; tryResolve(); };
            img.onerror = () => resolve([]);
            widgetImg.onerror = () => { widgetLoaded=true; tryResolve(); };
            img.src = `data:image/png;base64,${imgB64}`;
            if (widgetB64) widgetImg.src = `data:image/png;base64,${widgetB64}`;
          });
        }, { imgB64: base64, widgetB64, icons: iconsRel });

        if (!det || !det.points || det.points.length === 0) {
          console.log(`⚠ Profile_${profileId}: Не удалось найти цели в изображении (итерация ${round+1})`);
          // Пробуем обновить и перейти к следующей итерации
          for (const rsel of refreshSelectors) { try { await target.click(rsel, { timeout: 200 }); } catch(e) {} }
          await page.waitForTimeout(600);
          continue;
        }

        // Берем до 8 крупных мишеней как пул кандидатов
        const candidates = det.points.slice(0, Math.min(8, det.points.length));
        // Логирование оттенков кандидатов для отладки
        try {
          const hues = candidates.map(p => Math.round(p.hue || 0)).join(', ');
          console.log(`🎯 Profile_${profileId}: Кандидаты=${candidates.length}, оттенки: [${hues}]`);
        } catch (_) {}

        // Коэффициенты перевода координат из canvas (device pixels) в DOM (CSS px)
        const scaleX = det.width > 0 ? (det.width / imgBoxClient.width) : 1;
        const scaleY = det.height > 0 ? (det.height / imgBoxClient.height) : 1;

        // Формируем набор последовательностей для нескольких длин на случай ложного определения requiredTargets
        const ks = [];
        // нормализуем требуемое число кликов (минимум 1)
        const normRequired = Math.max(1, Math.min(candidates.length, requiredTargets || 3));
        // пробуем вокруг требуемого
        ks.push(normRequired);
        ks.push(normRequired + 1);
        ks.push(normRequired - 1);
        // дополнительные безопасные значения
        ks.push(3, 2, 1);
        // валидируем и уникализируем
        const uniqKs = Array.from(new Set(ks.filter(k => k >= 1 && k <= Math.max(1, candidates.length))))
          .sort((a,b)=>a-b);

        let sequences = [];
        // Сначала пытаемся использовать порядок по иконкам, если удалось сопоставить
        if (Array.isArray(det.iconOrder) && det.iconOrder.length >= 1) {
          const mapped = det.iconOrder
            .filter(idx => idx >=0 && idx < candidates.length)
            .map(idx => candidates[idx]);
          if (mapped.length >= 1) {
            // ограничиваем до близкого к требуемому числа
            sequences.push(mapped.slice(0, Math.min(mapped.length, normRequired)));
          }
        }
        for (const k of uniqKs) {
          const kseq = kPermutations(candidates, Math.min(k, candidates.length));
          // Эвристика слева-направо — добавляем как приоритетную для каждой длины
          if (candidates.length >= k) {
            const leftToRight = candidates.slice(0, k).sort((a,b)=>a.x-b.x);
            sequences.unshift(leftToRight);
          }
          sequences.push(...kseq);
        }
        // Ограничиваем общее количество последовательностей
        if (sequences.length > 200) sequences = sequences.slice(0, 200);

        if (sequences.length === 0) {
          // крайний фолбэк: кликнем слева-направо по 1-3 крупнейшим
          const fallbackK = Math.min(3, Math.max(1, candidates.length));
          const leftToRight = candidates.slice().sort((a,b)=>a.x-b.x).slice(0, fallbackK);
          sequences.push(leftToRight);
          console.log(`⚙️ Profile_${profileId}: Фолбэк — формируем ${fallbackK} клика(ов) слева-направо`);
        }

        console.log(`🔧 Profile_${profileId}: Кандидатов: ${candidates.length}, пробуем последовательностей: ${sequences.length} (итерация ${round+1})`);

        if (sequences.length === 0) {
          console.log(`❌ Profile_${profileId}: Нет последовательностей для кликов — пропускаем итерацию`);
          continue;
        }

        // elementFromPoint и мышь работают в client-координатах; scroll не нужен

        for (let attempt = 0; attempt < Math.min(sequences.length, 120); attempt++) {
          if (page.isClosed && page.isClosed()) { console.log(`⚠ Profile_${profileId}: Страница закрыта во время попытки ${attempt+1}`); return false; }
          if (page.context && page.context().isClosed && page.context().isClosed()) { console.log(`⚠ Profile_${profileId}: Контекст закрыт во время попытки ${attempt+1}`); return false; }
          const seq = sequences[attempt];
          console.log(`🔧 Profile_${profileId}: Попытка последовательности ${attempt+1}/${sequences.length} (итерация ${round+1})`);
          if (!seq || !Array.isArray(seq) || seq.length === 0) {
            console.log(`⚠ Profile_${profileId}: Пустая последовательность — пропуск`);
            continue;
          }

          // Кликаем по центрам с небольшим джиттером, строго внутри изображения
          for (const p of seq) {
            if (page.isClosed && page.isClosed()) {
              console.log(`⚠ Profile_${profileId}: Страница закрыта во время клика`);
              return false;
            }
            try {
              const relX = p.x / (scaleX || 1);
              const relY = p.y / (scaleY || 1);
              let clickX = imgBoxClient.x + relX + (Math.random()*4-2);
              let clickY = imgBoxClient.y + relY + (Math.random()*4-2);
              clickX = Math.max(imgBoxClient.x + 5, Math.min(imgBoxClient.x + imgBoxClient.width - 5, clickX));
              clickY = Math.max(imgBoxClient.y + 5, Math.min(imgBoxClient.y + imgBoxClient.height - 5, clickY));

              // Guard: убедимся, что цель под курсором принадлежит капче (client coords)
              const inside = await target.evaluate(({cx, cy}) => {
                const el = document.elementFromPoint(cx, cy);
                const box = document.querySelector('.geetest_box');
                return !!(el && box && (el === box || box.contains(el)));
              }, { cx: Math.round(clickX - frameOffsetClient.x), cy: Math.round(clickY - frameOffsetClient.y) });
              if (!inside) {
                // Сдвигаем точку ближе к центру изображения и пробуем еще раз
                const centerX = imgBoxClient.x + imgBoxClient.width/2;
                const centerY = imgBoxClient.y + imgBoxClient.height/2;
                clickX = (clickX + centerX) / 2;
                clickY = (clickY + centerY) / 2;
              }
              console.log(`🖱️ Profile_${profileId}: клик по (${Math.round(clickX)}, ${Math.round(clickY)}) [inside=${inside}]`);
              // Попробуем гарантировать фокус окна/фрейма перед кликом
              try { await target.evaluate(() => { if (document && document.body) document.body.focus(); }); } catch (_) {}
              await page.mouse.move(clickX, clickY, { steps: 6 });
              await page.waitForTimeout(160 + Math.random()*120);
              await page.mouse.click(clickX, clickY, { delay: 30 + Math.random()*60 });
              await page.waitForTimeout(220 + Math.random()*160);
            } catch (e) {
              const msg = e && e.message ? e.message : '';
              if (/closed/i.test(msg)) {
                console.log(`⚠ Profile_${profileId}: Клик прерван — контекст/страница закрыты`);
                return false;
              }
              console.log(`⚠ Profile_${profileId}: Ошибка клика: ${msg}`);
            }
          }

          // Жмем OK (если видна соответствующая кнопка внутри виджета)
          try {
            const okSel = await target.evaluate((sels) => {
              for (const s of sels) {
                const el = document.querySelector(s);
                if (!el) continue;
                const r = el.getBoundingClientRect();
                const st = window.getComputedStyle(el);
                const visible = r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden';
                const box = document.querySelector('.geetest_box');
                if (visible && box && (el === box || box.contains(el))) return s;
              }
              return null;
            }, okButtonSelectors);
            if (okSel) { await target.click(okSel, { timeout: 300 }); }
          } catch (e) {}

          // Ждем результата/исчезновения
          await page.waitForTimeout(850);
          try {
            await target.waitForSelector('.geetest_box', { state: 'detached', timeout: 4500 });
            console.log(`✅ Profile_${profileId}: Geetest пройдена (select-in-order)`);
            return true;
          } catch (_) {}

          // Если явно просит повторить — обновляем и прерываем внутренний цикл, чтобы пересчитать цели
          try {
            const hint = await target.$('text=Please try again');
            if (hint) { for (const rsel of refreshSelectors) { try { await target.click(rsel, { timeout: 200 }); } catch(e) {} } break; }
          } catch (e) {}
        }
      }

      // Если дошли сюда — не удалось
      console.log(`⚠ Profile_${profileId}: Локальный решатель Geetest v4 не справился`);
      // Отправим дебаг-скриншот области в Telegram (если бот подключен)
      try {
        if (this.telegramBot && latestCroppedScreenshot) {
          await this.telegramBot.sendPhoto(config.telegramBot.chatId, latestCroppedScreenshot, {
            caption: `⚠ Profile_${profileId}: Не удалось пройти select-in-order. Нужна настройка порогов.`,
            filename: `gtv4_fail_${profileId}_${Date.now()}.png`
          });
        }
      } catch (e) {
        // игнорируем ошибки отправки
      }
      return false;
    } catch (error) {
      console.error(`✗ Profile_${profileId}: Ошибка локального решения Geetest v4:`, error.message);
      return false;
    }
  }

  // Активация промокода (с таймаутом и отладкой)
  async activatePromoCode(page, profileId, promoCode) {
    try {
      console.log(`🎯 Profile_${profileId}: Активация промокода: ${promoCode}`);
      console.log(`🔧 Отладка: Profile_${profileId}: Начинаем активацию промокода ${promoCode}`);

      // Проверяем, что поле ввода существует (с таймаутом)
      const inputSelector = 'input[data-testid="voucher-form-promocode"]';
      console.log(`🔧 Отладка: Profile_${profileId}: Ищем поле ввода с селектором: ${inputSelector}`);
      
      const inputExists = await page.$(inputSelector, { timeout: 5000 });
      
      if (!inputExists) {
        console.log(`⚠ Profile_${profileId}: Поле ввода промокода не найдено`);
        console.log(`🔧 Отладка: Profile_${profileId}: Поле ввода не найдено, возможно страница не загружена`);
        return false;
      }

      console.log(`🔧 Profile_${profileId}: Поле ввода найдено, вводим промокод`);
      console.log(`🔧 Отладка: Profile_${profileId}: Вводим промокод: ${promoCode}`);
      
      // Очищаем поле и вводим промокод (с таймаутом)
      await page.fill(inputSelector, promoCode, { timeout: 5000 });
      console.log(`🔧 Profile_${profileId}: Промокод введен в поле`);
      console.log(`🔧 Отладка: Profile_${profileId}: Промокод успешно введен`);

      // Проверяем, что кнопка активации существует - используем правильный XPath
      const buttonXPath = '/html/body/div[1]/div[3]/div/div/div[2]/div[2]/div/form/button/div/div';
      console.log(`🔧 Отладка: Profile_${profileId}: Ищем кнопку активации с XPath: ${buttonXPath}`);
      
      const buttonExists = await page.$(`xpath=${buttonXPath}`, { timeout: 5000 });
      
      if (!buttonExists) {
        console.log(`⚠ Profile_${profileId}: Кнопка активации не найдена по XPath`);
        console.log(`🔧 Отладка: Profile_${profileId}: Пробуем альтернативный селектор`);
        
        // Пробуем альтернативный селектор
        const altButton = await page.$('div.base_content-NnRvn', { timeout: 5000 });
        if (!altButton) {
          console.log(`⚠ Profile_${profileId}: Кнопка активации не найдена ни одним селектором`);
          console.log(`🔧 Отладка: Profile_${profileId}: Кнопка активации не найдена, возможно страница изменилась`);
          return false;
        }
        console.log(`🔧 Profile_${profileId}: Кнопка активации найдена альтернативным селектором`);
        console.log(`🔧 Отладка: Profile_${profileId}: Нажимаем кнопку активации (альтернативный селектор)`);
        await page.click('div.base_content-NnRvn', { timeout: 5000 });
      } else {
        console.log(`🔧 Profile_${profileId}: Кнопка активации найдена по XPath, нажимаем`);
        console.log(`🔧 Отладка: Profile_${profileId}: Нажимаем кнопку активации (XPath)`);
        await page.click(`xpath=${buttonXPath}`, { timeout: 5000 });
      }

      console.log(`🔧 Profile_${profileId}: Кнопка активации нажата, начинаем поиск капчи...`);
      
      // Поиск капчи каждые 0.001 секунды
      let captchaFound = false;
      let attempts = 0;
      const maxAttempts = 5000; // Максимум 5 секунд поиска
      
      while (!captchaFound && attempts < maxAttempts) {
        try {
          const captchaElement = await page.$('.geetest_box');
          if (captchaElement) {
            console.log(`🔐 Profile_${profileId}: Обнаружена Geetest CAPTCHA (попытка ${attempts}), начинаем прохождение...`);
            captchaFound = true;
            
            // Сначала пробуем AI-решатель для Geetest v4 select-in-order
            let captchaSolved = await this.solveGeetestV4SelectOrder(page, profileId);
            if (!captchaSolved) {
              // Фолбэк на слайдер
              captchaSolved = await this.solveGeetestCaptcha(page, profileId);
            }
            
            if (captchaSolved) {
              console.log(`✅ Profile_${profileId}: Промокод ${promoCode} активирован с прохождением капчи`);
            } else {
              console.log(`⚠ Profile_${profileId}: Не удалось пройти капчу для промокода ${promoCode}`);
              return false;
            }
            break;
          }
        } catch (error) {
          // Игнорируем ошибки поиска
        }
        
        attempts++;
        await page.waitForTimeout(1); // Ждем 0.001 секунды
      }
      
      if (!captchaFound) {
        // Капча не появилась, промокод активирован без капчи
        console.log(`✅ Profile_${profileId}: Промокод ${promoCode} активирован без капчи (капча не обнаружена за ${attempts} попыток)`);
      }
      
      console.log(`✓ Profile_${profileId}: Промокод ${promoCode} активирован`);
      console.log(`🔧 Отладка: Profile_${profileId}: Активация промокода ${promoCode} завершена успешно`);
      
      // Ждем 2.1 секунды и делаем скриншот
      setTimeout(async () => {
        try {
          const activationTime = new Date().toLocaleString('ru-RU');
          console.log(`📸 Profile_${profileId}: Делаем скриншот после активации...`);
          
          // Делаем скриншот
          const screenshot = await page.screenshot({ 
            type: 'png',
            fullPage: false,
            clip: { x: 0, y: 0, width: 1920, height: 1080 }
          });

          // Отправляем уведомление с фото
          if (this.telegramBot) {
            const message = `🎯 Промокод активирован!\n\n` +
              `👤 Профиль: ${profileId}\n` +
              `🎫 Промокод: ${promoCode}\n` +
              `⏱️ Время активации: ${activationTime}\n` +
              `📅 Дата: ${new Date().toLocaleString('ru-RU')}`;

            await this.telegramBot.sendPhoto(config.telegramBot.chatId, screenshot, {
              caption: message,
              filename: `activation_${profileId}_${Date.now()}.png`
            });
            console.log(`📤 Profile_${profileId}: Уведомление с фото отправлено в Telegram`);
          }
        } catch (error) {
          console.log(`⚠ Profile_${profileId}: Ошибка отправки уведомления:`, error.message);
        }
      }, 2100); // 2.1 секунды
      
      return true;
    } catch (error) {
      console.error(`✗ Profile_${profileId}: Ошибка активации промокода ${promoCode}:`, error.message);
      console.log(`🔧 Отладка: Profile_${profileId}: Полная ошибка активации:`, error);
      return false;
    }
  }

  // Мониторинг промокодов и их активация через EventHandler
  async monitorPromoCodes() {
    console.log('🔍 Запуск REAL-TIME мониторинга через EventHandler...');
    
    // Функция активации промокодов (полностью неблокирующая)
    const activatePromoCodes = (promoCodes) => {
      if (promoCodes.length > 0) {
        console.log(`📨 Получено ${promoCodes.length} новых промокодов:`, promoCodes);
        console.log(`🔧 Отладка: Количество активных браузеров: ${this.pages.length}`);

        // Активируем промокоды во всех браузерах МГНОВЕННО (полностью неблокирующе)
        for (const { page, profileId } of this.pages) {
          console.log(`🔧 Отладка: Обрабатываем браузер Profile_${profileId}`);
          
          for (const promoCode of promoCodes) {
            console.log(`🎯 МГНОВЕННО активируем промокод ${promoCode} в Profile_${profileId}`);
            console.log(`🔧 Отладка: Запускаем активацию промокода ${promoCode} в фоне...`);
            
            // Запускаем активацию в фоне, НЕ ЖДЕМ завершения
            setImmediate(() => {
              this.activatePromoCode(page, profileId, promoCode).then(result => {
                console.log(`🔧 Отладка: Активация промокода ${promoCode} в Profile_${profileId} завершена с результатом:`, result);
              }).catch(error => {
                console.log(`⚠ Ошибка активации промокода ${promoCode} в Profile_${profileId}:`, error.message);
                console.log(`🔧 Отладка: Полная ошибка активации:`, error);
              });
            });
          }
        }
        
        console.log(`🔧 Отладка: Все промокоды отправлены на активацию`);
      } else {
        console.log(`🔧 Отладка: Нет промокодов для активации`);
      }
    };

    // Функция обработки новых сообщений
    const handleNewMessage = async (message) => {
      try {
        console.log('🔧 Отладка: Новое сообщение получено:', message.id, message.message);
        console.log('🔧 Отладка: Текущий lastMessageId:', this.lastMessageId);
        
        if (message.id > this.lastMessageId) {
          console.log('🔧 Отладка: Обновляем lastMessageId с', this.lastMessageId, 'на', message.id);
          this.lastMessageId = message.id;
          const text = message.message || '';
          
          // КАЖДОЕ СООБЩЕНИЕ = ВАУЧЕР (без паттернов)
          console.log('🔧 Отладка: Анализируем текст сообщения:', text);
          
          // Убираем лишние пробелы и берем весь текст как ваучер
          const promoCode = text.trim();
          
          if (promoCode && promoCode.length > 0) {
            console.log('🎯 Найден ваучер в real-time:', promoCode);
            console.log('🔧 Отладка: Запускаем активацию ваучера...');
            activatePromoCodes([promoCode]); // Убираем await - неблокирующий вызов
            console.log('🔧 Отладка: Активация ваучера запущена в фоне');
          } else {
            console.log('🔧 Отладка: Пустое сообщение, пропускаем');
          }
        } else {
          console.log('🔧 Отладка: Сообщение уже обработано (ID <= lastMessageId)');
        }
      } catch (error) {
        console.log('⚠ Ошибка обработки сообщения:', error.message);
        console.log('🔧 Отладка: Полная ошибка:', error);
      }
    };

    // Настраиваем обработчик новых сообщений
    this.telegramClient.addEventHandler(async (event) => {
      if (event.className === 'UpdateNewChannelMessage') {
        const message = event.message;
        console.log('🔧 Отладка: UpdateNewChannelMessage получено, message:', message);
        
        if (message && message.peerId) {
          console.log('🔧 Отладка: peerId:', message.peerId);
          
          if (message.peerId.channelId) {
            // Проверяем, что сообщение из нашего канала
            const channelId = message.peerId.channelId.toString();
            console.log('🔧 Отладка: Получено обновление из канала:', channelId, 'Ожидаем:', this.channelId);
            
            if (channelId === this.channelId) {
              console.log('✅ Сообщение из нужного канала!');
              await handleNewMessage(message);
            } else {
              console.log('⚠ Сообщение из другого канала, игнорируем');
            }
          } else {
            console.log('⚠ Сообщение не из канала, игнорируем');
          }
        } else {
          console.log('⚠ Нет message или peerId в событии');
        }
      }
    });

    console.log('🔄 REAL-TIME мониторинг запущен. Ожидаем новые сообщения...');
  }

  // Закрытие всех браузеров
  async closeAllBrowsers() {
    console.log('Закрытие всех браузеров...');
    
    // Сначала сохраняем все куки (если включено в конфиге)
    if (config.cookies.saveOnClose) {
      for (let i = 0; i < this.pages.length; i++) {
        try {
          const { context, profileId, cookiesPath, page } = this.pages[i];
          
          // Принудительное сохранение куки перед закрытием
          console.log(`Сохранение куки для Profile_${profileId}...`);
          
          // Пробуем получить куки напрямую из браузера
          try {
            const cookies = await context.cookies();
            if (cookies && cookies.length > 0) {
              await fs.ensureDir(path.dirname(cookiesPath));
              await fs.writeJson(cookiesPath, cookies, { spaces: 2 });
              console.log(`✓ Сохранено ${cookies.length} куки в ${path.basename(cookiesPath)}`);
            }
          } catch (error) {
            console.log(`⚠ Не удалось сохранить куки: ${error.message}`);
          }
        } catch (error) {
          console.error(`✗ Ошибка сохранения куки Profile_${i + 1}:`, error.message);
        }
      }
    }
    
    // Затем закрываем все браузеры
    for (let i = 0; i < this.browsers.length; i++) {
      try {
        const { profileId } = this.pages[i];
        await this.browsers[i].close();
        console.log(`✓ Браузер Profile_${profileId} закрыт`);
      } catch (error) {
        console.error(`✗ Ошибка закрытия браузера ${i + 1}:`, error.message);
      }
    }
  }

  // Основной метод запуска
  async start() {
    try {
      console.log('=== Запуск скрипта mellstroy loot ===');

      // Сначала инициализируем Telegram
      console.log('📱 Инициализация Telegram...');
      const telegramConnected = await this.initTelegram();
      if (!telegramConnected) {
        console.log('⚠ Telegram не подключен, но продолжаем работу...');
      }

      // Инициализируем Telegram бота
      console.log('🤖 Инициализация Telegram бота...');
      const botConnected = await this.initTelegramBot();
      if (!botConnected) {
        console.log('⚠ Telegram бот не подключен, но продолжаем работу...');
      }

      // Создание директорий профилей
      await this.createProfileDirectories();

      // Запуск всех браузеров
      await this.launchAllBrowsers();

      if (this.pages.length === 0) {
        throw new Error('Не удалось запустить ни одного браузера');
      }

      // Переход на mellstroy
      await this.navigateToMellstroy();

      // Запуск мониторинга промокодов (если Telegram подключен)
      if (telegramConnected) {
        await this.monitorPromoCodes();
      } else {
        console.log('⚠ Мониторинг промокодов отключен (Telegram не подключен)');
      }
      
      console.log('=== Скрипт запущен успешно ===');
      console.log(`Активных браузеров: ${this.pages.length}`);
      console.log('Нажмите Ctrl+C для остановки...');

      // Отправляем статус в Telegram при запуске
      if (botConnected) {
        setTimeout(() => {
          this.sendStatusMessage();
        }, 3000); // Ждем 3 секунды после запуска
      }
      
      // Обработка различных сигналов завершения
      const gracefulShutdown = async (signal) => {
        console.log(`\nПолучен сигнал ${signal}...`);
        console.log('Закрытие браузеров...');
        await this.closeAllBrowsers();
        console.log('Скрипт завершен.');
        process.exit(0);
      };
      
      // Обработка Ctrl+C (SIGINT)
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      
      // Обработка завершения процесса (SIGTERM)
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      
      // Обработка необработанных исключений
      process.on('uncaughtException', async (error) => {
        console.error('Необработанное исключение:', error);
        await this.closeAllBrowsers();
        process.exit(1);
      });
      
      // Обработка необработанных промисов
      process.on('unhandledRejection', async (reason, promise) => {
        console.error('Необработанное отклонение промиса:', reason);
        await this.closeAllBrowsers();
        process.exit(1);
      });
      
    } catch (error) {
      console.error('Критическая ошибка:', error);
      await this.closeAllBrowsers();
      process.exit(1);
    }
  }
}

// Запуск скрипта
const script = new MellstroyLootScript();
script.start().catch(console.error);
 