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

  /**
   * Criar cliente na Pagar.me
   */
  async createCustomer(customerData) {
    try {
      const {
        name,
        email,
        code,
        document,
        type = 'individual',
        document_type = 'CPF',
        gender,
        birthdate,
        address,
        phones,
        metadata
      } = customerData;

      // Limpar documento (apenas números)
      const cleanDocument = document.replace(/\D/g, '');

      // Montar payload base
      const payload = {
        name,
        email,
        document: cleanDocument,
        type,
        document_type
      };

      // Adicionar campos opcionais
      if (code) payload.code = code;
      if (gender) payload.gender = gender;

      // Formatar data de nascimento (DD/MM/YYYY -> MM/DD/YYYY)
      if (birthdate) {
        const [day, month, year] = birthdate.split('/');
        payload.birthdate = `${month}/${day}/${year}`;
      }

      if (metadata) payload.metadata = metadata;

      // Formatar endereço se fornecido
      if (address) {
        payload.address = {
          line_1: address.line_1,
          line_2: address.line_2 || '',
          zip_code: address.zip_code.replace(/\D/g, ''),
          city: address.city,
          state: address.state,
          country: address.country || 'BR'
        };
      }

      // Formatar telefones se fornecidos
      if (phones) {
        payload.phones = {};

        if (phones.mobile_phone) {
          payload.phones.mobile_phone = {
            country_code: phones.mobile_phone.country_code || '55',
            area_code: phones.mobile_phone.area_code,
            number: phones.mobile_phone.number.replace(/\D/g, '')
          };
        }

        if (phones.home_phone) {
          payload.phones.home_phone = {
            country_code: phones.home_phone.country_code || '55',
            area_code: phones.home_phone.area_code,
            number: phones.home_phone.number.replace(/\D/g, '')
          };
        }
      }

      console.log('📤 Criando customer na Pagar.me:', JSON.stringify(payload, null, 2));

      const response = await this.client.post('/customers', payload);

      console.log('✅ Customer criado:', response.data.id);

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar customer:', error.response?.data || error.message);
      throw new Error(`Erro ao criar cliente: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Criar recebedor na Pagar.me
   */
  async createRecipient(recipientData) {
    try {
      console.log('🔧 Pagar.me Service - createRecipient');
      console.log('📥 Dados recebidos:', JSON.stringify(recipientData, null, 2));

      const {
        name,
        email,
        document,
        type = 'individual',
        bank_account
      } = recipientData;

      console.log('📋 Dados extraídos:');
      console.log('   - Nome:', name);
      console.log('   - Email:', email);
      console.log('   - Documento:', document);
      console.log('   - Tipo:', type);
      console.log('   - Conta Bancária:', JSON.stringify(bank_account, null, 2));

      // Montar payload no formato correto da Pagar.me
      const payload = {
        name,
        email,
        document,
        type
      };

      // Adicionar conta bancária no formato correto
      if (bank_account) {
        payload.default_bank_account = {
          holder_name: bank_account.holder_name,
          holder_type: bank_account.holder_type,
          holder_document: bank_account.holder_document,
          bank: bank_account.bank,
          account_number: bank_account.account_number,
          account_type: bank_account.account_type,
          branch_number: bank_account.branch_number
        };
      }

      console.log('📤 Payload para Pagar.me:', JSON.stringify(payload, null, 2));
      console.log('🔄 Enviando requisição POST /recipients...');

      const response = await this.client.post('/recipients', payload);

      console.log('✅ Resposta da Pagar.me recebida');
      console.log('📊 Status:', response.status);
      console.log('📊 ID do recebedor:', response.data.id);
      console.log('📊 Resposta completa:', JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error) {
      console.error('❌ Erro no Pagar.me Service - createRecipient');
      console.error('❌ Erro completo:', error);
      if (error.response) {
        console.error('❌ Status HTTP:', error.response.status);
        console.error('❌ URL:', error.config?.url);

        // Tentar parsear o payload enviado
        try {
          const sentPayload = error.config?.data ? JSON.parse(error.config.data) : {};
          console.error('❌ Payload enviado:', JSON.stringify(sentPayload, null, 2));
        } catch (e) {
          console.error('❌ Payload enviado (raw):', error.config?.data);
        }

        console.error('❌ Dados do erro:', JSON.stringify(error.response.data, null, 2));

        // Mostrar erros de validação se existirem
        if (error.response.data?.errors) {
          console.error('❌ Erros de validação:');

          // Verificar se é array
          if (Array.isArray(error.response.data.errors)) {
            error.response.data.errors.forEach((err, index) => {
              console.error(`   ${index + 1}. Campo: ${err.field || err.parameter || 'N/A'}`);
              console.error(`      Mensagem: ${err.message || 'N/A'}`);
            });
          } else if (typeof error.response.data.errors === 'object') {
            // Se for objeto, iterar pelas chaves
            Object.keys(error.response.data.errors).forEach((key, index) => {
              const err = error.response.data.errors[key];
              console.error(`   ${index + 1}. Campo: ${key}`);
              if (Array.isArray(err)) {
                err.forEach((msg, i) => {
                  console.error(`      Mensagem ${i + 1}: ${msg}`);
                });
              } else {
                console.error(`      Mensagem: ${err}`);
              }
            });
          } else {
            console.error('   Erros:', error.response.data.errors);
          }
        }
      }

      // Extrair mensagem de erro de forma segura
      let errorMessage = error.message;
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          if (Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
            errorMessage = error.response.data.errors[0].message || error.response.data.errors[0];
          } else if (typeof error.response.data.errors === 'object') {
            const firstKey = Object.keys(error.response.data.errors)[0];
            const firstError = error.response.data.errors[firstKey];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          }
        }
      }

      throw new Error(`Erro ao criar recebedor: ${errorMessage}`);
    }
  }

  /**
   * Criar transferência na Pagar.me
   */
  async createTransfer(transferData) {
    try {
      const {
        recipient_id,
        amount,
        order_id,
        metadata = {}
      } = transferData;

      const payload = {
        amount,
        recipient_id
      };

      // Adicionar order_id ao metadata se fornecido
      if (order_id) {
        payload.metadata = {
          ...metadata,
          order_id
        };
      } else if (Object.keys(metadata).length > 0) {
        payload.metadata = metadata;
      }

      const response = await this.client.post('/transfers', payload);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao criar transferência: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Obter cliente por ID
   */
  async getCustomer(customerId) {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter cliente: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Obter recebedor por ID
   */
  async getRecipient(recipientId) {
    try {
      console.log('🔧 Pagar.me Service - getRecipient');
      console.log('📌 ID do recebedor:', recipientId);
      console.log('🔄 Enviando requisição GET /recipients/' + recipientId + '...');

      const response = await this.client.get(`/recipients/${recipientId}`);

      console.log('✅ Resposta da Pagar.me recebida');
      console.log('📊 Status:', response.status);
      console.log('📊 Dados do recebedor:', JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error) {
      console.error('❌ Erro no Pagar.me Service - getRecipient');
      console.error('❌ ID solicitado:', recipientId);
      console.error('❌ Erro completo:', error);
      if (error.response) {
        console.error('❌ Status HTTP:', error.response.status);
        console.error('❌ Dados do erro:', JSON.stringify(error.response.data, null, 2));

        // Mostrar erros de validação se existirem
        if (error.response.data?.errors) {
          console.error('❌ Erros de validação:');
          if (Array.isArray(error.response.data.errors)) {
            error.response.data.errors.forEach((err, index) => {
              console.error(`   ${index + 1}. Campo: ${err.field || err.parameter || 'N/A'}`);
              console.error(`      Mensagem: ${err.message || 'N/A'}`);
            });
          } else if (typeof error.response.data.errors === 'object') {
            Object.keys(error.response.data.errors).forEach((key, index) => {
              const err = error.response.data.errors[key];
              console.error(`   ${index + 1}. Campo: ${key}`);
              if (Array.isArray(err)) {
                err.forEach((msg, i) => {
                  console.error(`      Mensagem ${i + 1}: ${msg}`);
                });
              } else {
                console.error(`      Mensagem: ${err}`);
              }
            });
          }
        }
      }

      // Extrair mensagem de erro de forma segura
      let errorMessage = error.message;
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          if (Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
            errorMessage = error.response.data.errors[0].message || error.response.data.errors[0];
          } else if (typeof error.response.data.errors === 'object') {
            const firstKey = Object.keys(error.response.data.errors)[0];
            const firstError = error.response.data.errors[firstKey];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          }
        }
      }

      throw new Error(`Erro ao obter recebedor: ${errorMessage}`);
    }
  }
}

module.exports = new PagarmeService();
