const axios = require('axios');
const config = require('./config');

class CryptoBot {
  constructor() {
    this.token = config.cryptoBot.token;
    this.apiUrl = config.cryptoBot.apiUrl;
    this.supportedCurrencies = config.cryptoBot.supportedCurrencies;
    this.platinumPriceRub = config.cryptoBot.platinumPriceRub;
  }

  // Получить доступные валюты для оплаты
  getAvailableCurrencies() {
    return this.supportedCurrencies.map(currency => {
      const amount = (this.platinumPriceRub / (currency.rate || 1)).toFixed(6);
      return {
        code: currency.code,
        name: currency.name,
        emoji: currency.emoji,
        amount: amount,
        rate: currency.rate
      };
    });
  }

  // Обновить курсы валют (заглушка - в реальности нужно API)
  async updateExchangeRates() {
    try {
      // Здесь должен быть код для получения актуальных курсов
      // Пока возвращаем успех без изменений
      return true;
    } catch (error) {
      console.error('Ошибка обновления курсов:', error);
      return false;
    }
  }

  // Создать счет для оплаты платины
  async createPlatinumInvoice(userId, username, currencyCode) {
    try {
      const currency = this.supportedCurrencies.find(c => c.code === currencyCode);
      if (!currency) {
        return { success: false, error: 'Валюта не найдена' };
      }

      const amount = (this.platinumPriceRub / currency.rate).toFixed(6);
      
      // Заглушка - в реальности здесь API CryptoBot
      const invoiceId = `inv_${Date.now()}_${userId}`;
      
      return {
        success: true,
        invoiceId: invoiceId,
        amount: amount,
        currency: currencyCode,
        currencyName: currency.name,
        currencyEmoji: currency.emoji,
        amountRub: this.platinumPriceRub,
        payUrl: `https://t.me/CryptoBot?start=pay-${invoiceId}`
      };
    } catch (error) {
      console.error('Ошибка создания счета:', error);
      return { success: false, error: error.message };
    }
  }

  // Проверить статус счета
  async checkInvoiceStatus(invoiceId) {
    try {
      // Заглушка - в реальности здесь API CryptoBot
      // Возвращаем статус "не оплачено" для демонстрации
      return {
        success: true,
        paid: false,
        status: 'active'
      };
    } catch (error) {
      console.error('Ошибка проверки счета:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CryptoBot();