const axios = require('axios');

class PagarmeService {
  constructor() {
    this.apiKey = process.env.PAGARME_API_KEY;
    this.baseURL = process.env.PAGARME_BASE_URL || 'https://api.pagar.me/core/v5';

    console.log('🔑 Pagar.me Service Config:');
    console.log('   API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('   Base URL:', this.baseURL);

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    // Interceptar respostas para logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`📡 Pagar.me API - ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      (error) => {
        console.error(`❌ Pagar.me API Error:`, error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Criar pedido com pagamento via cartão de crédito
   */
  async createCreditCardPayment(paymentData) {
    try {
      const {
        amount,
        card_token,
        installments = 1,
        customer_name,
        customer_email,
        customer_document,
        description
      } = paymentData;

      const payload = {
        items: [{
          amount: amount,
          description: description || 'Pagamento',
          quantity: 1
        }],
        customer: {
          name: customer_name,
          email: customer_email,
          document: customer_document,
          type: 'individual'
        },
        payments: [{
          payment_method: 'credit_card',
          credit_card: {
            card_token: card_token,
            installments: installments
          }
        }]
      };

      const response = await this.client.post('/orders', payload);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao criar pagamento com cartão: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Criar pedido com pagamento via PIX
   */
  async createPixPayment(paymentData) {
    try {
      const {
        amount,
        customer_name,
        customer_email,
        customer_document,
        customer_phone,
        description
      } = paymentData;

      const payload = {
        items: [{
          amount: amount,
          description: description || 'Pagamento PIX',
          quantity: 1
        }],
        customer: {
          name: customer_name,
          email: customer_email,
          document: customer_document,
          type: 'individual',
          phones: {
            mobile_phone: {
              country_code: customer_phone.country_code || '55',
              area_code: customer_phone.area_code,
              number: customer_phone.number
            }
          }
        },
        payments: [{
          payment_method: 'pix',
          pix: {
            expires_in: 3600 // 1 hora
          }
        }]
      };

      const response = await this.client.post('/orders', payload);
      
      // Log detalhado da resposta
      console.log('✅ PIX Order criado:', response.data.id);
      console.log('📊 Status:', response.data.status);
      if (response.data.charges && response.data.charges.length > 0) {
        console.log('💳 Charge Status:', response.data.charges[0].status);
        console.log('💳 Charge Gateway Response:', response.data.charges[0].gateway_response);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro detalhado PIX:', error.response?.data);
      throw new Error(`Erro ao criar pagamento PIX: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Obter pedido por ID
   */
  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter pedido: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Capturar cobrança (para cartões)
   */
  async captureCharge(chargeId, amount = null) {
    try {
      const payload = amount ? { amount } : {};
      const response = await this.client.post(`/charges/${chargeId}/capture`, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao capturar cobrança: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cancelar cobrança
   */
  async cancelCharge(chargeId) {
    try {
      const response = await this.client.delete(`/charges/${chargeId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao cancelar cobrança: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Criar token do cartão (para testes)
   */
  async createCardToken(cardData) {
    try {
      const payload = {
        card: {
          number: cardData.number,
          holder_name: cardData.holder_name,
          exp_month: cardData.exp_month,
          exp_year: cardData.exp_year,
          cvv: cardData.cvv,
          billing_address: cardData.billing_address || {
            line_1: 'Rua Exemplo, 123',
            zip_code: '01234000',
            city: 'São Paulo',
            state: 'SP',
            country: 'BR'
          }
        }
      };

      const response = await this.client.post('/tokens', payload);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao criar token do cartão: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Listar métodos de pagamento disponíveis
   */
  async getPaymentMethods() {
    try {
      const response = await this.client.get('/payment_methods');
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter métodos de pagamento: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Validar webhook (futuro)
   */
  validateWebhookSignature(payload, signature) {
    // Implementação futura para validação de webhooks
    return true;
  }
}

module.exports = new PagarmeService();
