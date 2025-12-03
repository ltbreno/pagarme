const PaymentModel = require('../models/payment.model');
const PagarmeService = require('../services/pagarme.service');
const SupabaseService = require('../services/supabase.service');

class PaymentController {
  /**
   * Criar pagamento com cartão de crédito
   */
  async createCreditCardPayment(req, res) {
    try {
      const paymentData = req.validatedData;

      // Criar pedido na Pagar.me
      const pagarmeOrder = await PagarmeService.createCreditCardPayment(paymentData);

      // Salvar no banco de dados
      const payment = await PaymentModel.create({
        pagarme_id: pagarmeOrder.id,
        amount: paymentData.amount,
        payment_method: 'credit_card',
        status: pagarmeOrder.status,
        description: paymentData.description,
        card_token: paymentData.card_token,
        installments: paymentData.installments,
        customer_name: paymentData.customer_name,
        customer_email: paymentData.customer_email,
        customer_document: paymentData.customer_document,
        proposal_id: paymentData.proposal_id, // Recebe do frontend
        pagarme_response: pagarmeOrder
      });

      res.status(201).json({
        success: true,
        message: 'Pagamento com cartão criado com sucesso',
        data: {
          payment_id: payment.id,
          pagarme_order_id: pagarmeOrder.id,
          status: pagarmeOrder.status,
          amount: paymentData.amount,
          installments: paymentData.installments
        }
      });
    } catch (error) {
      console.error('Erro ao criar pagamento com cartão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Criar pagamento com PIX
   */
  async createPixPayment(req, res) {
    try {
      const paymentData = req.validatedData;

      // Criar pedido na Pagar.me
      const pagarmeOrder = await PagarmeService.createPixPayment(paymentData);

      console.log('🔍 Pagar.me PIX Response:', JSON.stringify(pagarmeOrder, null, 2));

      // Encontrar dados do PIX na resposta
      const pixCharge = pagarmeOrder.charges?.find(charge => charge.payment_method === 'pix');
      const pixData = pixCharge?.last_transaction;

      console.log('🔍 PIX Charge:', pixCharge);
      console.log('🔍 PIX Data:', pixData);

      // Salvar no banco de dados
      const payment = await PaymentModel.create({
        pagarme_id: pagarmeOrder.id,
        amount: paymentData.amount,
        payment_method: 'pix',
        status: pagarmeOrder.status,
        description: paymentData.description,
        pix_qr_code: pixData?.qr_code,
        pix_qr_code_url: pixData?.qr_code_url,
        customer_name: paymentData.customer_name,
        customer_email: paymentData.customer_email,
        customer_document: paymentData.customer_document,
        proposal_id: paymentData.proposal_id, // Recebe do frontend
        pagarme_response: pagarmeOrder
      });

      // Log completo para debug
      console.log('📊 Status do pedido:', pagarmeOrder.status);
      console.log('📊 Charges:', pagarmeOrder.charges);

      res.status(201).json({
        success: true,
        message: 'Pagamento PIX criado com sucesso',
        data: {
          payment_id: payment.id,
          pagarme_order_id: pagarmeOrder.id,
          status: pagarmeOrder.status,
          amount: paymentData.amount,
          pix: {
            qr_code: pixData?.qr_code,
            qr_code_url: pixData?.qr_code_url,
            expires_at: pixData?.expires_at
          },
          // DEBUG: Retornar resposta completa da Pagar.me
          debug: {
            order_status: pagarmeOrder.status,
            charges_count: pagarmeOrder.charges?.length || 0,
            first_charge_status: pagarmeOrder.charges?.[0]?.status
          }
        }
      });
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obter pagamento por ID
   */
  async getPayment(req, res) {
    try {
      const { id } = req.params;
      const payment = await PaymentModel.findById(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Pagamento não encontrado'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Erro ao obter pagamento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar pagamentos
   */
  async listPayments(req, res) {
    try {
      const { status, payment_method, limit = 50, offset = 0 } = req.query;

      let payments;

      if (status) {
        payments = await PaymentModel.findByStatus(status, limit, offset);
      } else if (payment_method) {
        payments = await PaymentModel.findByPaymentMethod(payment_method, limit, offset);
      } else {
        payments = await PaymentModel.findAll(limit, offset);
      }

      res.json({
        success: true,
        data: payments,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter estatísticas de pagamentos
   */
  async getPaymentStats(req, res) {
    try {
      const stats = await PaymentModel.getStats();

      // Contar por status
      const paidCount = await PaymentModel.countByStatus('paid');
      const pendingCount = await PaymentModel.countByStatus('pending');
      const failedCount = await PaymentModel.countByStatus('failed');

      res.json({
        success: true,
        data: {
          ...stats,
          counts: {
            paid: paidCount,
            pending: pendingCount,
            failed: failedCount
          }
        }
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Criar token de cartão (apenas para testes)
   */
  async createCardToken(req, res) {
    try {
      const cardData = req.validatedData;

      const tokenData = await PagarmeService.createCardToken(cardData);

      res.json({
        success: true,
        message: 'Token do cartão criado com sucesso',
        data: {
          token: tokenData.id,
          card: {
            brand: tokenData.card.brand,
            last_four_digits: tokenData.card.last_four_digits
          }
        }
      });
    } catch (error) {
      console.error('Erro ao criar token do cartão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Validar token de cartão (recebido do frontend)
   * O token deve ser criado no frontend usando a chave pública
   */
  async validateCardToken(req, res) {
    try {
      const { card_token } = req.body;

      if (!card_token) {
        return res.status(400).json({
          success: false,
          error: 'Token do cartão é obrigatório'
        });
      }

      // Aqui você pode validar o token fazendo uma chamada de teste
      // ou simplesmente confirmar que foi recebido
      // A validação real acontece quando tentamos criar o pedido

      res.json({
        success: true,
        message: 'Token validado com sucesso',
        data: {
          token: card_token,
          valid: true
        }
      });
    } catch (error) {
      console.error('Erro ao validar token:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Webhook para receber notificações da Pagar.me
   * Eventos: order.paid, order.payment_failed, charge.paid, etc.
   */
  async handleWebhook(req, res) {
    try {
      const webhookData = req.body;
      
      console.log('📡 ============================================');
      console.log('📡 Webhook recebido da Pagar.me');
      console.log('📡 ============================================');
      console.log('📊 Payload completo:', JSON.stringify(webhookData, null, 2));

      // Extrair dados do webhook
      const { id, type, data } = webhookData;

      if (!id || !type) {
        console.error('❌ Webhook inválido - faltando id ou type');
        return res.status(400).json({
          success: false,
          error: 'Webhook inválido'
        });
      }

      console.log(`📌 Evento: ${type}`);
      console.log(`📌 ID: ${id}`);

      // Processar diferentes tipos de eventos
      switch (type) {
        case 'order.paid':
          console.log('✅ Pedido PAGO!');
          await this.handleOrderPaid(data);
          break;

        case 'order.payment_failed':
          console.log('❌ Pagamento FALHOU!');
          await this.handleOrderFailed(data);
          break;

        case 'charge.paid':
          console.log('✅ Cobrança PAGA!');
          await this.handleChargePaid(data);
          break;

        case 'charge.pending':
          console.log('⏳ Cobrança PENDENTE');
          await this.handleChargePending(data);
          break;

        case 'charge.refunded':
          console.log('💰 Cobrança REEMBOLSADA');
          await this.handleChargeRefunded(data);
          break;

        default:
          console.log(`ℹ️ Evento não tratado: ${type}`);
      }

      // Sempre responder 200 OK para confirmar recebimento
      res.status(200).json({
        success: true,
        message: 'Webhook processado com sucesso',
        event_type: type
      });

    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      
      // Mesmo com erro, responder 200 para evitar reenvios
      res.status(200).json({
        success: false,
        error: 'Erro ao processar webhook',
        message: error.message
      });
    }
  }

  /**
   * Processar pedido pago
   */
  async handleOrderPaid(orderData) {
    try {
      const orderId = orderData.id;
      console.log(`💰 Processando pedido pago: ${orderId}`);

      // Buscar pagamento no banco pelo ID do pedido Pagar.me
      const payment = await PaymentModel.findByPagarmeId(orderId);

      if (!payment) {
        console.error(`❌ Pagamento não encontrado para order: ${orderId}`);
        return;
      }

      // Atualizar status para 'paid'
      await PaymentModel.updateStatus(payment.id, 'paid', orderData);
      console.log(`✅ Pagamento ${payment.id} atualizado para PAID`);

      // Atualizar no Supabase usando proposal_id se disponível
      // Pode vir do payment ou dos metadados do orderData
      const proposalId = payment.proposal_id || orderData.metadata?.proposal_id;
      
      if (proposalId) {
        try {
          await SupabaseService.updatePaymentStatusByProposalId(
            proposalId,
            'paid',
            orderData
          );
          console.log(`✅ Status atualizado no Supabase via proposal_id: ${proposalId}`);
        } catch (error) {
          console.error('⚠️ Erro ao atualizar Supabase por proposal_id:', error.message);
        }
      } else {
        console.log('ℹ️ proposal_id não encontrado, atualização no Supabase será feita via pagarme_order_id');
      }

      // Aqui você pode adicionar lógica adicional:
      // - Enviar email de confirmação
      // - Liberar produto/serviço
      // - Atualizar estoque
      // - Notificar outros sistemas

    } catch (error) {
      console.error('❌ Erro ao processar pedido pago:', error);
      throw error;
    }
  }

  /**
   * Processar pedido com falha
   */
  async handleOrderFailed(orderData) {
    try {
      const orderId = orderData.id;
      console.log(`❌ Processando pedido com falha: ${orderId}`);

      const payment = await PaymentModel.findByPagarmeId(orderId);

      if (!payment) {
        console.error(`❌ Pagamento não encontrado para order: ${orderId}`);
        return;
      }

      await PaymentModel.updateStatus(payment.id, 'failed', orderData);
      console.log(`❌ Pagamento ${payment.id} atualizado para FAILED`);

      // Atualizar no Supabase usando proposal_id se disponível
      const proposalId = payment.proposal_id || orderData.metadata?.proposal_id;
      
      if (proposalId) {
        try {
          await SupabaseService.updatePaymentStatusByProposalId(
            proposalId,
            'failed',
            orderData
          );
          console.log(`✅ Status atualizado no Supabase via proposal_id: ${proposalId}`);
        } catch (error) {
          console.error('⚠️ Erro ao atualizar Supabase por proposal_id:', error.message);
        }
      } else {
        console.log('ℹ️ proposal_id não encontrado, atualização no Supabase será feita via pagarme_order_id');
      }

      // Lógica adicional para falha:
      // - Notificar cliente
      // - Liberar estoque reservado
      // - Registrar tentativa de pagamento

    } catch (error) {
      console.error('❌ Erro ao processar pedido com falha:', error);
      throw error;
    }
  }

  /**
   * Processar cobrança paga (PIX, boleto, etc)
   */
  async handleChargePaid(chargeData) {
    try {
      console.log(`💰 Cobrança paga: ${chargeData.id}`);
      
      // Para PIX, a cobrança pode ser paga antes do pedido
      // Buscar pelo charge ID ou order ID
      const orderId = chargeData.order?.id;
      
      if (orderId) {
        const payment = await PaymentModel.findByPagarmeId(orderId);
        
        if (payment) {
          await PaymentModel.updateStatus(payment.id, 'paid', chargeData);
          console.log(`✅ Pagamento ${payment.id} atualizado via charge.paid`);

          // Atualizar no Supabase usando proposal_id se disponível
          const proposalId = payment.proposal_id || chargeData.metadata?.proposal_id || chargeData.order?.metadata?.proposal_id;
          
          if (proposalId) {
            try {
              const SupabaseService = require('../services/supabase.service');
              await SupabaseService.updatePaymentStatusByProposalId(
                proposalId,
                'paid',
                chargeData
              );
              console.log(`✅ Status atualizado no Supabase via proposal_id: ${proposalId}`);
            } catch (error) {
              console.error('⚠️ Erro ao atualizar Supabase por proposal_id:', error.message);
            }
          } else {
            console.log('ℹ️ proposal_id não encontrado, atualização no Supabase será feita via pagarme_order_id');
          }
        }
      }

    } catch (error) {
      console.error('❌ Erro ao processar cobrança paga:', error);
      throw error;
    }
  }

  /**
   * Processar cobrança pendente
   */
  async handleChargePending(chargeData) {
    try {
      console.log(`⏳ Cobrança pendente: ${chargeData.id}`);
      
      const orderId = chargeData.order?.id;
      
      if (orderId) {
        const payment = await PaymentModel.findByPagarmeId(orderId);
        
        if (payment && payment.status !== 'paid') {
          await PaymentModel.updateStatus(payment.id, 'pending', chargeData);
          console.log(`⏳ Pagamento ${payment.id} mantido como PENDING`);

          // Atualizar no Supabase usando proposal_id se disponível
          const proposalId = payment.proposal_id || chargeData.metadata?.proposal_id || chargeData.order?.metadata?.proposal_id;
          
          if (proposalId) {
            try {
              const SupabaseService = require('../services/supabase.service');
              await SupabaseService.updatePaymentStatusByProposalId(
                proposalId,
                'pending',
                chargeData
              );
              console.log(`✅ Status atualizado no Supabase via proposal_id: ${proposalId}`);
            } catch (error) {
              console.error('⚠️ Erro ao atualizar Supabase por proposal_id:', error.message);
            }
          } else {
            console.log('ℹ️ proposal_id não encontrado, atualização no Supabase será feita via pagarme_order_id');
          }
        }
      }

    } catch (error) {
      console.error('❌ Erro ao processar cobrança pendente:', error);
      throw error;
    }
  }

  /**
   * Processar reembolso
   */
  async handleChargeRefunded(chargeData) {
    try {
      console.log(`💰 Reembolso processado: ${chargeData.id}`);
      
      const orderId = chargeData.order?.id;
      
      if (orderId) {
        const payment = await PaymentModel.findByPagarmeId(orderId);
        
        if (payment) {
          await PaymentModel.updateStatus(payment.id, 'refunded', chargeData);
          console.log(`💰 Pagamento ${payment.id} atualizado para REFUNDED`);

          // Atualizar no Supabase usando proposal_id se disponível
          const proposalId = payment.proposal_id || chargeData.metadata?.proposal_id || chargeData.order?.metadata?.proposal_id;
          
          if (proposalId) {
            try {
              const SupabaseService = require('../services/supabase.service');
              await SupabaseService.updatePaymentStatusByProposalId(
                proposalId,
                'refunded',
                chargeData
              );
              console.log(`✅ Status atualizado no Supabase via proposal_id: ${proposalId}`);
            } catch (error) {
              console.error('⚠️ Erro ao atualizar Supabase por proposal_id:', error.message);
            }
          } else {
            console.log('ℹ️ proposal_id não encontrado, atualização no Supabase será feita via pagarme_order_id');
          }
        }
      }

    } catch (error) {
      console.error('❌ Erro ao processar reembolso:', error);
      throw error;
    }
  }
}

module.exports = new PaymentController();
