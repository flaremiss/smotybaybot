const axios = require('axios');
const config = require('./config');

class CryptoBotAPI {
  constructor() {
    this.token = config.cryptoBot.token;
    this.apiUrl = config.cryptoBot.apiUrl;
    this.platinumPriceRub = config.cryptoBot.platinumPriceRub;
    this.supportedCurrencies = config.cryptoBot.supportedCurrencies;
    this.defaultCurrency = config.cryptoBot.defaultCurrency;
    this.exchangeRates = null;
  }

  // Получить актуальные курсы валют
  async updateExchangeRates() {
    try {
      const response = await axios.get(`${this.apiUrl}/getExchangeRates`, {
        headers: {
          'Crypto-Pay-API-Token': this.token
        }
      });

      if (response.data.ok) {
        this.exchangeRates = response.data.result;
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [CryptoBot] Ошибка получения курсов:', error.message);
      return false;
    }
  }

  // Получить курс валюты к рублю
  getCurrencyRate(currencyCode) {
    if (!this.exchangeRates) {
      // Используем статичные курсы из конфига
      const currency = this.supportedCurrencies.find(c => c.code === currencyCode);
      return currency ? currency.rate : 1;
    }

    const rate = this.exchangeRates.find(r => 
      r.source === currencyCode && r.target === 'RUB' && r.is_valid
    );
    return rate ? parseFloat(rate.rate) : 1;
  }

  // Рассчитать сумму в выбранной валюте
  calculateAmount(currencyCode) {
    const rate = this.getCurrencyRate(currencyCode);
    const amount = this.platinumPriceRub / rate;
    
    // Округляем до разумного количества знаков
    if (amount < 0.01) {
      return Math.ceil(amount * 1000000) / 1000000; // 6 знаков для очень малых сумм
    } else if (amount < 1) {
      return Math.ceil(amount * 1000) / 1000; // 3 знака для малых сумм
    } else {
      return Math.ceil(amount * 100) / 100; // 2 знака для обычных сумм
    }
  }

  // Получить список доступных валют
  getAvailableCurrencies() {
    return this.supportedCurrencies.map(currency => ({
      ...currency,
      amount: this.calculateAmount(currency.code),
      rate: this.getCurrencyRate(currency.code)
    }));
  }

  // Создать счет для оплаты платины
  async createPlatinumInvoice(userId, username = 'Пользователь', currencyCode = null) {
    try {
      // Обновляем курсы валют
      await this.updateExchangeRates();
      
      // Выбираем валюту
      const currency = currencyCode || this.defaultCurrency;
      const amount = this.calculateAmount(currency);
      const currencyInfo = this.supportedCurrencies.find(c => c.code === currency);
      
      // CryptoBot API требует параметры в URL, а не в теле запроса
      const params = new URLSearchParams({
        asset: currency,
        amount: amount.toString(),
        description: `${currencyInfo?.emoji || '💎'} Платина для @${username} (${this.platinumPriceRub}₽)`,
        hidden_message: `Покупка привилегии Платина для пользователя ${userId}`,
        paid_btn_name: 'openBot',
        paid_btn_url: `https://t.me/${config.marketBot.name.replace(' ', '_')}`,
        payload: JSON.stringify({
          type: 'platinum_purchase',
          userId: userId,
          username: username,
          currency: currency
        })
      });

      const response = await axios.post(`${this.apiUrl}/createInvoice?${params}`, {}, {
        headers: {
          'Crypto-Pay-API-Token': this.token
        }
      });

      console.log('🔍 [CryptoBot] Ответ API:', JSON.stringify(response.data, null, 2));
      
      if (response.data.ok) {
        return {
          success: true,
          invoiceId: response.data.result.invoice_id,
          payUrl: response.data.result.pay_url,
          amount: amount,
          currency: currency,
          currencyName: currencyInfo?.name || currency,
          currencyEmoji: currencyInfo?.emoji || '💎',
          amountRub: this.platinumPriceRub
        };
      } else {
        console.error('❌ [CryptoBot] Ошибка API:', response.data.error);
        return {
          success: false,
          error: response.data.error?.message || 'Ошибка создания счета'
        };
      }
    } catch (error) {
      console.error('❌ [CryptoBot] Ошибка создания счета:', error.message);
      if (error.response) {
        console.error('❌ [CryptoBot] Статус:', error.response.status);
        console.error('❌ [CryptoBot] Данные ошибки:', error.response.data);
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Проверить статус счета
  async checkInvoiceStatus(invoiceId) {
    try {
      const params = new URLSearchParams({
        invoice_ids: invoiceId
      });

      const response = await axios.get(`${this.apiUrl}/getInvoices?${params}`, {
        headers: {
          'Crypto-Pay-API-Token': this.token
        }
      });

      if (response.data.ok && response.data.result.items.length > 0) {
        const invoice = response.data.result.items[0];
        return {
          success: true,
          status: invoice.status,
          paid: invoice.status === 'paid',
          amount: invoice.amount,
          currency: invoice.asset
        };
      } else {
        return {
          success: false,
          error: 'Счет не найден'
        };
      }
    } catch (error) {
      console.error('❌ [CryptoBot] Ошибка проверки счета:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Получить информацию о боте
  async getMe() {
    try {
      const response = await axios.get(`${this.apiUrl}/getMe`, {
        headers: {
          'Crypto-Pay-API-Token': this.token
        }
      });

      if (response.data.ok) {
        return {
          success: true,
          bot: response.data.result
        };
      } else {
        return {
          success: false,
          error: response.data.error?.message || 'Ошибка получения информации'
        };
      }
    } catch (error) {
      console.error('❌ [CryptoBot] Ошибка получения информации:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Получить курсы валют
  async getExchangeRates() {
    try {
      const response = await axios.get(`${this.apiUrl}/getExchangeRates`, {
        headers: {
          'Crypto-Pay-API-Token': this.token
        }
      });

      if (response.data.ok) {
        return {
          success: true,
          rates: response.data.result
        };
      } else {
        return {
          success: false,
          error: response.data.error?.message || 'Ошибка получения курсов'
        };
      }
    } catch (error) {
      console.error('❌ [CryptoBot] Ошибка получения курсов:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CryptoBotAPI();
