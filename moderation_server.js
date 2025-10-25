const express = require('express');
const session = require('express-session');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Пути к данным
const dataDir = path.resolve('./data');
const usersPath = path.join(dataDir, 'users.json');
const listingsPath = path.join(dataDir, 'listings.json');
const searchesPath = path.join(dataDir, 'searches.json');
const blockedUsersPath = path.join(dataDir, 'blocked_users.json');

// Функции для работы с данными
async function readListings() {
  try {
    return await fs.readJson(listingsPath);
  } catch (_) {
    return [];
  }
}

async function writeListings(listings) {
  await fs.writeJson(listingsPath, listings, { spaces: 2 });
}

async function readUsers() {
  try {
    return await fs.readJson(usersPath);
  } catch (_) {
    return {};
  }
}

async function writeUsers(users) {
  await fs.writeJson(usersPath, users, { spaces: 2 });
}

async function readSearches() {
  try {
    return await fs.readJson(searchesPath);
  } catch (_) {
    return [];
  }
}

async function readBlockedUsers() {
  try {
    return await fs.readJson(blockedUsersPath);
  } catch (_) {
    return [];
  }
}

async function writeBlockedUsers(blockedUsers) {
  await fs.writeJson(blockedUsersPath, blockedUsers, { spaces: 2 });
}


// Главная страница
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Модерация Shomy Bay</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 2.5em;
                font-weight: 300;
            }
            .nav {
                display: flex;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
            }
            .nav-item {
                flex: 1;
                padding: 20px;
                text-align: center;
                text-decoration: none;
                color: #495057;
                font-weight: 500;
                transition: all 0.3s;
                border-right: 1px solid #e9ecef;
            }
            .nav-item:last-child {
                border-right: none;
            }
            .nav-item:hover {
                background: #e9ecef;
                color: #667eea;
            }
            .nav-item.active {
                background: #667eea;
                color: white;
            }
            .content {
                padding: 30px;
            }
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                border-left: 4px solid #667eea;
            }
            .stat-number {
                font-size: 2em;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 5px;
            }
            .stat-label {
                color: #6c757d;
                font-size: 0.9em;
            }
            .btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s;
                text-decoration: none;
                display: inline-block;
                margin: 5px;
            }
            .btn:hover {
                background: #5a6fd8;
                transform: translateY(-2px);
            }
            .btn-danger {
                background: #dc3545;
            }
            .btn-danger:hover {
                background: #c82333;
            }
            .btn-success {
                background: #28a745;
            }
            .btn-success:hover {
                background: #218838;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 Shomy Bay Модерация</h1>
                <p>Панель управления объявлениями и пользователями</p>
            </div>
            <div class="nav">
                <a href="/" class="nav-item active">📊 Статистика</a>
                <a href="/listings" class="nav-item">📝 Объявления</a>
                <a href="/users" class="nav-item">👥 Пользователи</a>
                <a href="/searches" class="nav-item">🔍 Поиски</a>
            </div>
            <div class="content">
                <div class="stats" id="stats">
                    <div class="stat-card">
                        <div class="stat-number" id="total-listings">-</div>
                        <div class="stat-label">Всего объявлений</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="total-users">-</div>
                        <div class="stat-label">Пользователей</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="total-searches">-</div>
                        <div class="stat-label">Поисковых запросов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="recent-listings">-</div>
                        <div class="stat-label">За последние 24ч</div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="/listings" class="btn">📝 Управление объявлениями</a>
                    <a href="/users" class="btn">👥 Управление пользователями</a>
                </div>
            </div>
        </div>
        <script>
            // Загружаем статистику
            fetch('/api/stats')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('total-listings').textContent = data.listings;
                    document.getElementById('total-users').textContent = data.users;
                    document.getElementById('total-searches').textContent = data.searches;
                    document.getElementById('recent-listings').textContent = data.recentListings;
                })
                .catch(error => console.error('Ошибка загрузки статистики:', error));
        </script>
    </body>
    </html>
  `);
});

// Страница управления пользователями
app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html'));
});

// Serve sell listings page
app.get('/sell', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sell.html'));
});

// Serve seek listings page
app.get('/seek', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'seek.html'));
});

// API для статистики
app.get('/api/stats', async (req, res) => {
  try {
    const listings = await readListings();
    const users = await readUsers();
    const searches = await readSearches();
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentListings = listings.filter(l => {
      const createdAt = new Date(l.createdAt);
      return createdAt > yesterday;
    }).length;
    
    res.json({
      success: true,
      stats: {
        totalListings: listings.length,
        todayListings: recentListings,
        totalUsers: Object.keys(users).length,
        totalSearches: searches.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Страница объявлений
app.get('/listings', async (req, res) => {
  try {
    const listings = await readListings();
    const users = await readUsers();
    
    const listingsHtml = listings.map(listing => {
      const user = users[listing.userId] || {};
      const createdAt = new Date(listing.createdAt).toLocaleString('ru-RU');
      
      return `
        <div class="listing-card" style="border: 1px solid #e9ecef; border-radius: 10px; padding: 20px; margin-bottom: 20px; background: white;">
          <div style="display: flex; gap: 20px;">
            ${listing.photos && listing.photos.length > 0 ? 
              `<img src="https://api.telegram.org/file/bot7549540016:AAEuxl7RZbz7xLEbXrI3pF099doTN7Wsu58/${listing.photos[0]}" 
                   style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px;" 
                   onerror="this.style.display='none'">` : 
              '<div style="width: 150px; height: 150px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6c757d;">Нет фото</div>'
            }
            <div style="flex: 1;">
              <h3 style="margin: 0 0 10px 0; color: #333;">${listing.title || 'Без названия'}</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Стиль:</strong> ${listing.style || 'Не указан'}</p>
                     <p style="margin: 5px 0; color: #666;"><strong>Цена:</strong> ${listing.price ? `${listing.price} ₽` : 'Не указана'}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Описание:</strong> ${listing.description || 'Нет описания'}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Продавец:</strong> ${listing.username || listing.userId}</p>
              <p style="margin: 5px 0; color: #999; font-size: 0.9em;"><strong>Создано:</strong> ${createdAt}</p>
              <div style="margin-top: 15px;">
                <button class="btn btn-success" onclick="approveListing('${listing.id}')">✅ Одобрить</button>
                <button class="btn btn-danger" onclick="rejectListing('${listing.id}')">❌ Отклонить</button>
                <button class="btn" onclick="viewListing('${listing.id}')">👁️ Подробнее</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    res.send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Объявления - Shomy Bay</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
              }
              .container {
                  max-width: 1200px;
                  margin: 0 auto;
                  background: white;
                  border-radius: 15px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                  overflow: hidden;
              }
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
              }
              .nav {
                  display: flex;
                  background: #f8f9fa;
                  border-bottom: 1px solid #e9ecef;
              }
              .nav-item {
                  flex: 1;
                  padding: 20px;
                  text-align: center;
                  text-decoration: none;
                  color: #495057;
                  font-weight: 500;
                  transition: all 0.3s;
                  border-right: 1px solid #e9ecef;
              }
              .nav-item:last-child {
                  border-right: none;
              }
              .nav-item:hover {
                  background: #e9ecef;
                  color: #667eea;
              }
              .nav-item.active {
                  background: #667eea;
                  color: white;
              }
              .content {
                  padding: 30px;
              }
              .btn {
                  background: #667eea;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 16px;
                  transition: all 0.3s;
                  text-decoration: none;
                  display: inline-block;
                  margin: 5px;
              }
              .btn:hover {
                  background: #5a6fd8;
                  transform: translateY(-2px);
              }
              .btn-danger {
                  background: #dc3545;
              }
              .btn-danger:hover {
                  background: #c82333;
              }
              .btn-success {
                  background: #28a745;
              }
              .btn-success:hover {
                  background: #218838;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>📝 Управление объявлениями</h1>
                  <p>Модерация и управление объявлениями пользователей</p>
              </div>
              <div class="nav">
                  <a href="/" class="nav-item">📊 Статистика</a>
                  <a href="/listings" class="nav-item active">📝 Объявления</a>
                  <a href="/users" class="nav-item">👥 Пользователи</a>
                  <a href="/searches" class="nav-item">🔍 Поиски</a>
              </div>
              <div class="content">
                  <div style="margin-bottom: 20px;">
                      <a href="/" class="btn">← Назад к статистике</a>
                  </div>
                  <div id="listings">
                      ${listingsHtml || '<p>Объявлений пока нет</p>'}
                  </div>
              </div>
          </div>
          <script>
              function approveListing(id) {
                  if (confirm('Одобрить это объявление? Пользователь получит уведомление.')) {
                      fetch('/api/listings/' + id + '/approve', { method: 'POST' })
                          .then(response => response.json())
                          .then(data => {
                              alert('Объявление одобрено! Пользователь уведомлен.');
                              location.reload();
                          })
                          .catch(error => {
                              alert('Ошибка: ' + error.message);
                          });
                  }
              }
              
              function rejectListing(id) {
                  const reason = prompt('Укажите причину отклонения (необязательно):', 'не соответствует правилам размещения');
                  if (reason !== null) {
                      fetch('/api/listings/' + id + '/reject', { 
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ reason: reason || 'не соответствует правилам размещения' })
                      })
                          .then(response => response.json())
                          .then(data => {
                              alert('Объявление отклонено! Пользователь получил уведомление.');
                              location.reload();
                          })
                          .catch(error => {
                              alert('Ошибка: ' + error.message);
                          });
                  }
              }
              
              function viewListing(id) {
                  alert('Функция просмотра в разработке для ID: ' + id);
              }
          </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Ошибка загрузки объявлений: ' + error.message);
  }
});

// API для одобрения объявления
app.post('/api/listings/:id/approve', async (req, res) => {
  try {
    const listings = await readListings();
    const listing = listings.find(l => l.id === req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }
    
    // Добавляем поле одобрения
    listing.approved = true;
    listing.approvedAt = new Date().toISOString();
    
    await writeListings(listings);
    
    // Отправляем уведомление пользователю о одобрении
    try {
      const axios = require('axios');
      const botToken = '7549540016:AAEuxl7RZbz7xLEbXrI3pF099doTN7Wsu58';
      const message = `✅ Ваше объявление "${listing.title || 'Без названия'}" одобрено модератором!\n\nТеперь оно видно всем пользователям в ленте. Удачи в продаже! 🎉`;
      
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: listing.userId,
        text: message
      });
      
      console.log(`📤 Уведомление об одобрении отправлено пользователю ${listing.userId} для объявления ${listing.id}`);
    } catch (notificationError) {
      console.log('Не удалось отправить уведомление об одобрении:', notificationError.message);
    }
    
    res.json({ success: true, message: 'Объявление одобрено. Пользователь уведомлен.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для отклонения объявления
app.post('/api/listings/:id/reject', async (req, res) => {
  try {
    const listings = await readListings();
    const listingIndex = listings.findIndex(l => l.id === req.params.id);
    if (listingIndex === -1) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }
    
    const listing = listings[listingIndex];
    const userId = listing.userId;
    const reason = req.body.reason || 'не соответствует правилам размещения';
    
    // Удаляем объявление
    listings.splice(listingIndex, 1);
    await writeListings(listings);
    
    // Отправляем уведомление пользователю через бота
    try {
      const axios = require('axios');
      const botToken = '7549540016:AAEuxl7RZbz7xLEbXrI3pF099doTN7Wsu58';
      const message = `❌ Ваше объявление "${listing.title || 'Без названия'}" не прошло модерацию и было удалено.\n\nПричина: ${reason}\n\nПопробуйте создать новое объявление, соблюдая требования.`;
      
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: userId,
        text: message
      });
      
      console.log(`📤 Уведомление отправлено пользователю ${userId} о отклонении объявления ${listing.id}`);
    } catch (notificationError) {
      console.log('Не удалось отправить уведомление пользователю:', notificationError.message);
    }
    
    res.json({ success: true, message: 'Объявление отклонено и удалено. Пользователь уведомлен.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Страница пользователей
app.get('/users', async (req, res) => {
  try {
    const users = await readUsers();
    const listings = await readListings();
    
    const blockedUsers = await readBlockedUsers();
    
    const usersHtml = Object.entries(users).map(([userId, userData]) => {
      const userListings = listings.filter(l => String(l.userId) === userId);
      const lastActivity = userData.feed ? 
        new Date(Math.max(...(userData.feed.seen || []).map(id => {
          const listing = listings.find(l => l.id === id);
          return listing ? new Date(listing.createdAt).getTime() : 0;
        }))).toLocaleString('ru-RU') : 'Неизвестно';
      
      const isBlocked = blockedUsers.includes(userId);
      const blockStatus = isBlocked ? 
        '<span style="color: #dc3545; font-weight: bold;">🚫 ЗАБЛОКИРОВАН</span>' : 
        '<span style="color: #28a745; font-weight: bold;">✅ АКТИВЕН</span>';
      
      const blockButton = isBlocked ? 
        `<button class="btn btn-success" onclick="unbanUser('${userId}')">🔓 Разблокировать</button>` :
        `<button class="btn btn-danger" onclick="banUser('${userId}')">🚫 Заблокировать</button>`;
      
      const username = userData.profile?.username || userData.username || 'Неизвестно';
      const firstName = userData.profile?.firstName || userData.first_name || 'Неизвестно';
      
      return `
        <div class="user-card" style="border: 1px solid #e9ecef; border-radius: 10px; padding: 20px; margin-bottom: 20px; background: white; ${isBlocked ? 'opacity: 0.7; background: #f8f9fa;' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h3 style="margin: 0 0 10px 0; color: #333;">ID: ${userId} ${blockStatus}</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Username:</strong> @${username}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Имя:</strong> ${firstName}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Объявлений:</strong> ${userListings.length}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Последняя активность:</strong> ${lastActivity}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Статус сессии:</strong> ${userData.session ? userData.session.flow : 'Нет активной сессии'}</p>
              ${userData.feed ? `
                <p style="margin: 5px 0; color: #666;"><strong>В ленте:</strong> ${userData.feed.list ? userData.feed.list.length : 0} объявлений</p>
                <p style="margin: 5px 0; color: #666;"><strong>Просмотрено:</strong> ${userData.feed.seen ? userData.feed.seen.length : 0} объявлений</p>
              ` : ''}
              ${isBlocked && userData.blockedAt ? `<p style="margin: 5px 0; color: #dc3545;"><strong>Заблокирован:</strong> ${new Date(userData.blockedAt).toLocaleString('ru-RU')}</p>` : ''}
            </div>
            <div>
              <button class="btn" onclick="viewUserListings('${userId}')">📝 Объявления</button>
              <button class="btn" onclick="viewUserFeed('${userId}')">👁️ Лента</button>
              ${blockButton}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    res.send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Пользователи - Shomy Bay</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
              }
              .container {
                  max-width: 1200px;
                  margin: 0 auto;
                  background: white;
                  border-radius: 15px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                  overflow: hidden;
              }
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
              }
              .nav {
                  display: flex;
                  background: #f8f9fa;
                  border-bottom: 1px solid #e9ecef;
              }
              .nav-item {
                  flex: 1;
                  padding: 20px;
                  text-align: center;
                  text-decoration: none;
                  color: #495057;
                  font-weight: 500;
                  transition: all 0.3s;
                  border-right: 1px solid #e9ecef;
              }
              .nav-item:last-child {
                  border-right: none;
              }
              .nav-item:hover {
                  background: #e9ecef;
                  color: #667eea;
              }
              .nav-item.active {
                  background: #667eea;
                  color: white;
              }
              .content {
                  padding: 30px;
              }
              .btn {
                  background: #667eea;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 16px;
                  transition: all 0.3s;
                  text-decoration: none;
                  display: inline-block;
                  margin: 5px;
              }
              .btn:hover {
                  background: #5a6fd8;
                  transform: translateY(-2px);
              }
              .btn-danger {
                  background: #dc3545;
              }
              .btn-danger:hover {
                  background: #c82333;
              }
              .btn-success {
                  background: #28a745;
              }
              .btn-success:hover {
                  background: #218838;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>👥 Управление пользователями</h1>
                  <p>Просмотр и управление пользователями бота</p>
              </div>
              <div class="nav">
                  <a href="/" class="nav-item">📊 Статистика</a>
                  <a href="/listings" class="nav-item">📝 Объявления</a>
                  <a href="/users" class="nav-item active">👥 Пользователи</a>
                  <a href="/searches" class="nav-item">🔍 Поиски</a>
              </div>
              <div class="content">
                  <div style="margin-bottom: 20px;">
                      <a href="/" class="btn">← Назад к статистике</a>
                      <button class="btn btn-primary" onclick="updateUserData()" style="margin-left: 10px;">
                          🔄 Обновить данные пользователей
                      </button>
                  </div>
                  <div id="users">
                      ${usersHtml || '<p>Пользователей пока нет</p>'}
                  </div>
              </div>
          </div>
          <script>
              function viewUserListings(userId) {
                  alert('Объявления пользователя ' + userId + ' (функция в разработке)');
              }
              
              function viewUserFeed(userId) {
                  alert('Лента пользователя ' + userId + ' (функция в разработке)');
              }
              
              async function banUser(userId) {
                  if (confirm('Заблокировать пользователя ' + userId + '?')) {
                      try {
                          const response = await fetch('/api/users/' + userId + '/block', { 
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' }
                          });
                          const data = await response.json();
                          
                          if (data.success) {
                              alert('✅ Пользователь заблокирован!');
                              location.reload();
                          } else {
                              alert('❌ ' + data.message);
                          }
                      } catch (error) {
                          alert('❌ Ошибка: ' + error.message);
                      }
                  }
              }
              
              async function unbanUser(userId) {
                  if (confirm('Разблокировать пользователя ' + userId + '?')) {
                      try {
                          const response = await fetch('/api/users/' + userId + '/unblock', { 
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' }
                          });
                          const data = await response.json();
                          
                          if (data.success) {
                              alert('✅ Пользователь разблокирован!');
                              location.reload();
                          } else {
                              alert('❌ ' + data.message);
                          }
                      } catch (error) {
                          alert('❌ Ошибка: ' + error.message);
                      }
                  }
              }
              
              async function updateUserData() {
                  if (confirm('Обновить данные пользователей из Telegram? Это может занять некоторое время.')) {
                      try {
                          const button = event.target;
                          button.disabled = true;
                          button.textContent = '🔄 Обновление...';
                          
                          const response = await fetch('/api/users/update-from-telegram', { 
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' }
                          });
                          const data = await response.json();
                          
                          if (data.success) {
                              alert('✅ ' + data.message);
                              location.reload();
                          } else {
                              alert('❌ ' + data.message);
                          }
                      } catch (error) {
                          alert('❌ Ошибка: ' + error.message);
                      } finally {
                          const button = event.target;
                          button.disabled = false;
                          button.textContent = '🔄 Обновить данные пользователей';
                      }
                  }
              }
          </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Ошибка загрузки пользователей: ' + error.message);
  }
});

// Страница поисковых запросов
app.get('/searches', async (req, res) => {
  try {
    const searches = await readSearches();
    
    const searchesHtml = searches.map(search => {
      const createdAt = new Date(search.createdAt).toLocaleString('ru-RU');
      
      return `
        <div class="search-card" style="border: 1px solid #e9ecef; border-radius: 10px; padding: 20px; margin-bottom: 20px; background: white;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${search.query}</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Пользователь:</strong> ${search.username || search.userId}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Детали:</strong> ${search.details || 'Нет дополнительной информации'}</p>
          <p style="margin: 5px 0; color: #999; font-size: 0.9em;"><strong>Создано:</strong> ${createdAt}</p>
          <div style="margin-top: 15px;">
            <button class="btn" onclick="viewSearch('${search.id}')">👁️ Подробнее</button>
            <button class="btn btn-danger" onclick="deleteSearch('${search.id}')">🗑️ Удалить</button>
          </div>
        </div>
      `;
    }).join('');
    
    res.send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Поиски - Shomy Bay</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
              }
              .container {
                  max-width: 1200px;
                  margin: 0 auto;
                  background: white;
                  border-radius: 15px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                  overflow: hidden;
              }
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
              }
              .nav {
                  display: flex;
                  background: #f8f9fa;
                  border-bottom: 1px solid #e9ecef;
              }
              .nav-item {
                  flex: 1;
                  padding: 20px;
                  text-align: center;
                  text-decoration: none;
                  color: #495057;
                  font-weight: 500;
                  transition: all 0.3s;
                  border-right: 1px solid #e9ecef;
              }
              .nav-item:last-child {
                  border-right: none;
              }
              .nav-item:hover {
                  background: #e9ecef;
                  color: #667eea;
              }
              .nav-item.active {
                  background: #667eea;
                  color: white;
              }
              .content {
                  padding: 30px;
              }
              .btn {
                  background: #667eea;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 16px;
                  transition: all 0.3s;
                  text-decoration: none;
                  display: inline-block;
                  margin: 5px;
              }
              .btn:hover {
                  background: #5a6fd8;
                  transform: translateY(-2px);
              }
              .btn-danger {
                  background: #dc3545;
              }
              .btn-danger:hover {
                  background: #c82333;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🔍 Поисковые запросы</h1>
                  <p>Управление поисковыми запросами пользователей</p>
              </div>
              <div class="nav">
                  <a href="/" class="nav-item">📊 Статистика</a>
                  <a href="/listings" class="nav-item">📝 Объявления</a>
                  <a href="/users" class="nav-item">👥 Пользователи</a>
                  <a href="/searches" class="nav-item active">🔍 Поиски</a>
              </div>
              <div class="content">
                  <div style="margin-bottom: 20px;">
                      <a href="/" class="btn">← Назад к статистике</a>
                  </div>
                  <div id="searches">
                      ${searchesHtml || '<p>Поисковых запросов пока нет</p>'}
                  </div>
              </div>
          </div>
          <script>
              function viewSearch(id) {
                  alert('Детали поиска ' + id + ' (функция в разработке)');
              }
              
              function deleteSearch(id) {
                  if (confirm('Удалить этот поисковый запрос?')) {
                      fetch('/api/searches/' + id, { method: 'DELETE' })
                          .then(response => response.json())
                          .then(data => {
                              alert('Поисковый запрос удален!');
                              location.reload();
                          })
                          .catch(error => {
                              alert('Ошибка: ' + error.message);
                          });
                  }
              }
          </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Ошибка загрузки поисков: ' + error.message);
  }
});

// API для удаления поискового запроса
app.delete('/api/searches/:id', async (req, res) => {
  try {
    const searches = await readSearches();
    const searchIndex = searches.findIndex(s => s.id === req.params.id);
    if (searchIndex === -1) {
      return res.status(404).json({ error: 'Поисковый запрос не найден' });
    }
    
    searches.splice(searchIndex, 1);
    await fs.writeJson(searchesPath, searches, { spaces: 2 });
    res.json({ success: true, message: 'Поисковый запрос удален' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для получения объявлений
app.get('/api/listings', async (req, res) => {
  try {
    const listings = await readListings();
    const users = await readUsers();
    const { type } = req.query; // Фильтр по типу: 'sell' или 'seek'
    
    // Фильтруем по типу, если указан
    let filteredListings = listings;
    if (type) {
      filteredListings = listings.filter(listing => listing.type === type);
    }
    
    // Добавляем информацию о платине к каждому объявлению
    const listingsWithPlatinum = filteredListings.map(listing => {
      const authorId = String(listing.userId);
      const author = users[authorId];
      const isPlatinum = author && author.platinum;
      
      return {
        ...listing,
        isPlatinum: isPlatinum || false,
        authorUsername: author?.profile?.username || 'Неизвестно',
        authorFirstName: author?.profile?.firstName || 'Пользователь',
        typeText: listing.type === 'seek' ? 'Поиск' : 'Продажа'
      };
    });
    
    res.json({
      success: true,
      listings: listingsWithPlatinum
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API для получения объявлений о продаже
app.get('/api/listings/sell', async (req, res) => {
  try {
    const listings = await readListings();
    const users = await readUsers();
    
    // Фильтруем только объявления о продаже (по умолчанию считаем старые объявления продажей)
    const sellListings = listings.filter(listing => !listing.type || listing.type === 'sell');
    
    // Добавляем информацию о платине к каждому объявлению
    const listingsWithPlatinum = sellListings.map(listing => {
      const authorId = String(listing.userId);
      const author = users[authorId];
      const isPlatinum = author && author.platinum;
      
      return {
        ...listing,
        isPlatinum: isPlatinum || false,
        authorUsername: author?.profile?.username || 'Неизвестно',
        authorFirstName: author?.profile?.firstName || 'Пользователь',
        typeText: 'Продажа'
      };
    });
    
    res.json({
      success: true,
      listings: listingsWithPlatinum
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API для получения объявлений о поиске
app.get('/api/listings/seek', async (req, res) => {
  try {
    const listings = await readListings();
    const users = await readUsers();
    
    // Фильтруем только объявления о поиске
    const seekListings = listings.filter(listing => listing.type === 'seek');
    
    // Добавляем информацию о платине к каждому объявлению
    const listingsWithPlatinum = seekListings.map(listing => {
      const authorId = String(listing.userId);
      const author = users[authorId];
      const isPlatinum = author && author.platinum;
      
      return {
        ...listing,
        isPlatinum: isPlatinum || false,
        authorUsername: author?.profile?.username || 'Неизвестно',
        authorFirstName: author?.profile?.firstName || 'Пользователь',
        typeText: 'Поиск'
      };
    });
    
    res.json({
      success: true,
      listings: listingsWithPlatinum
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API для получения пользователей
app.get('/api/users', async (req, res) => {
  try {
    const users = await readUsers();
    const usersList = Object.keys(users).map(userId => ({
      id: userId,
      username: users[userId].profile?.username || 'Неизвестно',
      firstName: users[userId].profile?.firstName || 'Пользователь',
      platinum: users[userId].platinum || false,
      platinumActivatedAt: users[userId].platinumActivatedAt || null,
      pendingInvoice: users[userId].pendingInvoice || null
    }));
    
    res.json({
      success: true,
      users: usersList
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API для выдачи/отзыва платины
app.post('/api/users/:userId/platinum', async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body; // action: 'grant' или 'revoke'
    
    const users = await readUsers();
    const user = users[userId];
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    if (action === 'grant') {
      users[userId].platinum = true;
      users[userId].platinumActivatedAt = Date.now();
      users[userId].platinumExpiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 дней в миллисекундах
      users[userId].platinumType = 'granted'; // Тип: purchased (куплено) или granted (выдано модератором)
      users[userId].platinumGrantedBy = 'moderator';
      users[userId].platinumGrantReason = reason || 'Выдано модератором';
      
      await writeUsers(users);
      
      // Отправляем уведомление пользователю о выдаче платины
      try {
        const axios = require('axios');
        const botToken = '7549540016:AAEuxl7RZbz7xLEbXrI3pF099doTN7Wsu58';
        const message = `🎉 **Поздравляем!**\n\n💎 Вам выдана привилегия Platinum!\n\n✨ Теперь ваши объявления:\n• Отображаются с приоритетом +30%\n• Показываются большему количеству людей\n• Имеют специальный значок 💎 Platinum\n\nПричина: ${reason || 'Выдано модератором'}\n\nСоздавайте объявления и получайте больше откликов!`;
        
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: userId,
          text: message,
          parse_mode: 'Markdown'
        });
        
        console.log(`📤 Уведомление о выдаче платины отправлено пользователю ${userId}`);
      } catch (notificationError) {
        console.log('Не удалось отправить уведомление о выдаче платины:', notificationError.message);
      }
      
      res.json({
        success: true,
        message: 'Платина успешно выдана пользователю',
        user: {
          id: userId,
          username: user.profile?.username || 'Неизвестно',
          platinum: true
        }
      });
    } else if (action === 'revoke') {
      users[userId].platinum = false;
      users[userId].platinumRevokedAt = Date.now();
      users[userId].platinumRevokedBy = 'moderator';
      users[userId].platinumRevokeReason = reason || 'Отозвано модератором';
      
      await writeUsers(users);
      
      // Отправляем уведомление пользователю об отзыве платины
      try {
        const axios = require('axios');
        const botToken = '7549540016:AAEuxl7RZbz7xLEbXrI3pF099doTN7Wsu58';
        const message = `⚠️ **Уведомление**\n\n💎 Привилегия Platinum была отозвана.\n\nПричина: ${reason || 'Отозвано модератором'}\n\nВаши объявления теперь отображаются как обычные. Если у вас есть вопросы, обратитесь к поддержке.`;
        
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: userId,
          text: message,
          parse_mode: 'Markdown'
        });
        
        console.log(`📤 Уведомление об отзыве платины отправлено пользователю ${userId}`);
      } catch (notificationError) {
        console.log('Не удалось отправить уведомление об отзыве платины:', notificationError.message);
      }
      
      res.json({
        success: true,
        message: 'Платина успешно отозвана у пользователя',
        user: {
          id: userId,
          username: user.profile?.username || 'Неизвестно',
          platinum: false
        }
      });
    } else {
      res.status(400).json({ success: false, error: 'Неверное действие. Используйте "grant" или "revoke"' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API для получения фотографий
app.get('/api/photo/:photoId', async (req, res) => {
  try {
    const photoId = req.params.photoId;
    
    // Получаем информацию о файле от Telegram
    const TelegramBot = require('node-telegram-bot-api');
    const config = require('./config');
    const bot = new TelegramBot(config.marketBot.token);
    
    try {
      const fileInfo = await bot.getFile(photoId);
      const fileUrl = `https://api.telegram.org/file/bot${config.marketBot.token}/${fileInfo.file_path}`;
      
      // Перенаправляем на файл Telegram
      res.redirect(fileUrl);
    } catch (telegramError) {
      // Если не удалось получить фото от Telegram, возвращаем заглушку
      res.status(404).json({ error: 'Photo not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для обновления данных пользователей из Telegram
app.post('/api/users/update-from-telegram', async (req, res) => {
  try {
    const TelegramBot = require('node-telegram-bot-api');
    const config = require('./config');
    const bot = new TelegramBot(config.marketBot.token);
    
    const users = await readUsers();
    let updatedCount = 0;
    
    for (const userId in users) {
      const user = users[userId];
      
      // Проверяем, нужно ли обновить данные пользователя
      if (!user.profile?.username || user.profile.username === 'Неизвестно') {
        try {
          const userInfo = await bot.getChat(userId);
          if (userInfo) {
            user.profile = user.profile || {};
            user.profile.username = userInfo.username || 'Неизвестно';
            user.profile.firstName = userInfo.first_name || 'Неизвестно';
            updatedCount++;
          }
        } catch (error) {
          console.log(`Не удалось получить данные для пользователя ${userId}:`, error.message);
        }
      }
    }
    
    await writeUsers(users);
    res.json({ success: true, updatedCount, message: `Обновлено ${updatedCount} пользователей` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для получения списка заблокированных пользователей
app.get('/api/blocked-users', async (req, res) => {
  try {
    const blockedUsers = await readBlockedUsers();
    const users = await readUsers();
    
    const blockedUsersWithInfo = blockedUsers.map(userId => {
      const userInfo = users[userId];
      return {
        userId,
        username: userInfo?.profile?.username || 'Неизвестно',
        firstName: userInfo?.profile?.firstName || 'Неизвестно',
        blockedAt: userInfo?.blockedAt || new Date().toISOString()
      };
    });
    
    res.json(blockedUsersWithInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для блокировки пользователя
app.post('/api/users/:userId/block', async (req, res) => {
  try {
    const { userId } = req.params;
    const blockedUsers = await readBlockedUsers();
    
    if (!blockedUsers.includes(userId)) {
      blockedUsers.push(userId);
      await writeBlockedUsers(blockedUsers);
      
      // Обновляем информацию о пользователе
      const users = await readUsers();
      if (users[userId]) {
        users[userId].blockedAt = new Date().toISOString();
        await writeUsers(users);
      }
      
      res.json({ success: true, message: 'Пользователь заблокирован' });
    } else {
      res.json({ success: false, message: 'Пользователь уже заблокирован' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для разблокировки пользователя
app.post('/api/users/:userId/unblock', async (req, res) => {
  try {
    const { userId } = req.params;
    const blockedUsers = await readBlockedUsers();
    const index = blockedUsers.indexOf(userId);
    
    if (index > -1) {
      blockedUsers.splice(index, 1);
      await writeBlockedUsers(blockedUsers);
      
      // Удаляем информацию о блокировке из профиля пользователя
      const users = await readUsers();
      if (users[userId]) {
        delete users[userId].blockedAt;
        await writeUsers(users);
      }
      
      res.json({ success: true, message: 'Пользователь разблокирован' });
    } else {
      res.json({ success: false, message: 'Пользователь не был заблокирован' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер модерации запущен на http://localhost:${PORT}`);
  console.log(`📊 Статистика: http://localhost:${PORT}`);
  console.log(`📝 Объявления: http://localhost:${PORT}/listings`);
});
