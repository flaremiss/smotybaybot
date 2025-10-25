class FeedControls {
  constructor() {
    this.userStates = new Map();
  }

  // Построение клавиатуры для ленты
  buildFeedKeyboard(ownerOnly = false, postLike = false) {
    if (ownerOnly) {
      return {
        reply_markup: {
          keyboard: [[{ text: '💤' }]],
          resize_keyboard: true,
          remove_keyboard: false
        }
      };
    }

    if (postLike) {
      return {
        reply_markup: {
          keyboard: [
            [{ text: '🚀' }],
            [{ text: '💤' }]
          ],
          resize_keyboard: true
        }
      };
    }

    return {
      reply_markup: {
        keyboard: [
          [{ text: '👎' }, { text: '❤️' }],
          [{ text: '💤' }]
        ],
        resize_keyboard: true
      }
    };
  }

  // Включение режима после лайка
  async enablePostLike(bot, chatId, users, uid, writeUsers) {
    users[uid] = users[uid] || { profile: {}, platinum: false };
    users[uid].feed = users[uid].feed || {};
    users[uid].feed.mode = 'post_like';
    await writeUsers(users);
    
    await bot.sendMessage(chatId, 'Нажмите 🚀 чтобы увидеть новое объявление', this.buildFeedKeyboard(false, true));
  }

  // Сброс режима и показ базовой клавиатуры
  async resetModeAndShowBase(bot, chatId, users, uid, writeUsers) {
    users[uid] = users[uid] || { profile: {}, platinum: false };
    if (users[uid].feed) {
      users[uid].feed.mode = null;
    }
    await writeUsers(users);
    
    await bot.sendMessage(chatId, '\u200B', this.buildFeedKeyboard(false, false));
  }

  // Применение состояния из сессии
  async applyFromState(bot, chatId, users, uid) {
    const user = users[uid];
    if (!user || !user.feed) return;

    const ownerOnly = !!(user.feed.filters && user.feed.filters.ownerOnly);
    const postLike = user.feed.mode === 'post_like';

    try {
      await bot.sendMessage(chatId, '\u200B', this.buildFeedKeyboard(ownerOnly, postLike));
    } catch (error) {
      // Игнорируем ошибки дублирования сообщений
      if (!error.message.includes('message is not modified')) {
        console.error('Ошибка применения состояния:', error);
      }
    }
  }

  // Начало создания объявления
  async startAdCreation(bot, chatId) {
    this.userStates.set(chatId, { step: 'style' });
    
    const styles = require('./config').marketBot.styles;
    const buttons = styles.map(style => [{ text: style, callback_data: `style_${style}` }]);
    
    await bot.sendMessage(chatId, '🎨 Выберите стиль одежды:', {
      reply_markup: { inline_keyboard: buttons }
    });
  }

  // Показать ленту объявлений
  async showFeed(bot, chatId) {
    await bot.sendMessage(chatId, '📋 Лента объявлений:\n\nПока здесь пусто...', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Обновить', callback_data: 'refresh_feed' }],
          [{ text: '◀️ Назад', callback_data: 'back_to_main' }]
        ]
      }
    });
  }
}

module.exports = new FeedControls();