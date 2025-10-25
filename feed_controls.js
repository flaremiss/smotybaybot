const ZERO = '\u200B';

function buildFeedKeyboard(ownerOnly = false, postLike = false) {
  const keyboard = ownerOnly
    ? [[{ text: '💤' }]]
    : (postLike
        ? [[{ text: '🚀' }, { text: '❤️' }, { text: '👎' }, { text: '💤' }]]
        : [[{ text: '❤️' }, { text: '👎' }, { text: '💤' }]]);
  return {
    reply_markup: {
      keyboard,
      resize_keyboard: true,
      selective: false,
      is_persistent: true
    }
  };
}

async function showBase(bot, chatId) {
  try { await bot.sendMessage(chatId, ZERO, buildFeedKeyboard(false, false)); } catch (_) {}
}

async function showPostLike(bot, chatId) {
  console.log('🚀 [DEBUG] showPostLike вызвана для chatId:', chatId);
  try {
    // Telegram требует текст, поэтому отправляем невидимый символ
    const invisibleChar = '\u2063'; // INVISIBLE SEPARATOR
    console.log('🚀 [DEBUG] Отправляем клавиатуру с ракетой...');
    await bot.sendMessage(chatId, invisibleChar, buildFeedKeyboard(false, true));
    console.log('🚀 [DEBUG] Клавиатура с ракетой отправлена!');
  } catch (e) {
    console.log('🚀 [ERROR] Ошибка в showPostLike:', e.message);
  }
}

async function enablePostLike(bot, chatId, users, uid, writeUsers) {
  await showPostLike(bot, chatId);
  const u = users[uid] || {};
  u.feed = u.feed || {};
  u.feed.mode = 'post_like';
  users[uid] = u;
  try { await writeUsers(users); } catch (_) {}
}

async function resetModeAndShowBase(bot, chatId, users, uid, writeUsers) {
  const u = users[uid] || {};
  if (u.feed) u.feed.mode = null;
  users[uid] = u;
  try { await writeUsers(users); } catch (_) {}
  await showBase(bot, chatId);
}

async function applyFromState(bot, chatId, users, uid) {
  const mode = users[uid] && users[uid].feed ? users[uid].feed.mode : null;
  try { await bot.sendMessage(chatId, ZERO, buildFeedKeyboard(false, mode === 'post_like')); } catch (_) {}
}

module.exports = {
  buildFeedKeyboard,
  showBase,
  showPostLike,
  enablePostLike,
  resetModeAndShowBase,
  applyFromState,
};


