const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    this.tableName = 'payments_pagarme'; // Nome da tabela no Supabase

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️ Supabase credentials not configured. Running without Supabase integration.');
      this.client = null;
      return;
    }

    this.client = createClient(this.supabaseUrl, this.supabaseKey);
    console.log('🔷 Supabase Service initialized');
    console.log('   URL:', this.supabaseUrl);
    console.log('   Table:', this.tableName);
  }

  /**
   * Verificar se o Supabase está configurado
   */
  isConfigured() {
    return this.client !== null;
  }

  /**
   * Mapear dados do formato interno para formato Supabase
   */
  mapToSupabaseFormat(paymentData) {
    const { pagarme_response } = paymentData;
    
    // Extrair dados do cartão se existirem
    let cardBrand = null;
    let cardLastFourDigits = null;
    let pagarmePaymentId = null;

    if (pagarme_response && pagarme_response.charges && pagarme_response.charges.length > 0) {
      const charge = pagarme_response.charges[0];
      pagarmePaymentId = charge.id;

      if (charge.last_transaction && charge.last_transaction.card) {
        cardBrand = charge.last_transaction.card.brand;
        cardLastFourDigits = charge.last_transaction.card.last_four_digits;
      }
    }

    return {
      pagarme_order_id: paymentData.pagarme_id,
      pagarme_payment_id: pagarmePaymentId,
      amount: paymentData.amount,
      total_amount: paymentData.amount,
      payment_method: paymentData.payment_method,
      status: paymentData.status,
      customer_name: paymentData.customer_name || null,
      customer_email: paymentData.customer_email || null,
      customer_document: paymentData.customer_document || null,
      card_brand: cardBrand,
      card_last_four_digits: cardLastFourDigits,
      pix_qr_code: paymentData.pix_qr_code || null,
      // Campos que podem vir do frontend ou permanecem null
      proposal_id: paymentData.proposal_id || null, // Recebe do frontend
      service_request_id: null,
      client_id: null,
      freelancer_id: null,
      platform_fee: null,
      retained_at: null,
      released_at: null
    };
  }

  /**
   * Criar pagamento no Supabase
   */
  async createPayment(paymentData) {
    if (!this.isConfigured()) {
      console.warn('⚠️ Supabase not configured, skipping Supabase insert');
      return null;
    }

    try {
      console.log('🔷 Salvando pagamento no Supabase...');
      
      const supabaseData = this.mapToSupabaseFormat(paymentData);
      console.log('📤 Dados mapeados para Supabase:', JSON.stringify(supabaseData, null, 2));

      const { data, error } = await this.client
        .from(this.tableName)
        .insert([supabaseData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar no Supabase:', error);
        throw error;
      }

      console.log('✅ Pagamento salvo no Supabase:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Erro no Supabase Service - createPayment:', error);
      throw error;
    }
  }

  /**
   * Buscar pagamento por ID no Supabase
   */
  async findPaymentById(id) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar no Supabase:', error);
      return null;
    }
  }

  /**
   * Buscar pagamento por pagarme_order_id
   */
  async findPaymentByPagarmeId(pagarmeId) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('pagarme_order_id', pagarmeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar no Supabase por pagarme_id:', error);
      return null;
    }
  }

  /**
   * Atualizar status do pagamento no Supabase
   */
  async updatePaymentStatus(pagarmeOrderId, status, pagarmeResponse = null) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      console.log(`🔷 Atualizando status no Supabase: ${pagarmeOrderId} -> ${status}`);

      // Primeiro verificar se o pagamento existe
      const existing = await this.findPaymentByPagarmeId(pagarmeOrderId);
      
      if (!existing) {
        console.warn(`⚠️ Pagamento não encontrado no Supabase: ${pagarmeOrderId}`);
        console.log('   Pode ter sido criado apenas no PostgreSQL ou ainda não sincronizado');
        return null;
      }

      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      // Se houver resposta da Pagar.me, extrair novos dados
      if (pagarmeResponse && pagarmeResponse.charges && pagarmeResponse.charges.length > 0) {
        const charge = pagarmeResponse.charges[0];
        
        if (!updateData.pagarme_payment_id && charge.id) {
          updateData.pagarme_payment_id = charge.id;
        }

        if (charge.last_transaction && charge.last_transaction.card) {
          if (!updateData.card_brand && charge.last_transaction.card.brand) {
            updateData.card_brand = charge.last_transaction.card.brand;
          }
          if (!updateData.card_last_four_digits && charge.last_transaction.card.last_four_digits) {
            updateData.card_last_four_digits = charge.last_transaction.card.last_four_digits;
          }
        }
      }

      // Atualizar sem usar .single() para evitar erro quando não há resultado
      const { data, error } = await this.client
        .from(this.tableName)
        .update(updateData)
        .eq('pagarme_order_id', pagarmeOrderId)
        .select();

      if (error) {
        console.error('❌ Erro ao atualizar no Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhum registro atualizado no Supabase');
        return null;
      }

      console.log('✅ Status atualizado no Supabase');
      return data[0];
    } catch (error) {
      console.error('❌ Erro no Supabase Service - updatePaymentStatus:', error);
      // Não quebrar a aplicação, apenas logar o erro
      return null;
    }
  }

  /**
   * Atualizar status do pagamento no Supabase usando proposal_id
   */
  async updatePaymentStatusByProposalId(proposalId, status, pagarmeResponse = null) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      console.log(`🔷 Atualizando status no Supabase por proposal_id: ${proposalId} -> ${status}`);

      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      // Se houver resposta da Pagar.me, extrair novos dados
      if (pagarmeResponse && pagarmeResponse.charges && pagarmeResponse.charges.length > 0) {
        const charge = pagarmeResponse.charges[0];
        
        if (!updateData.pagarme_payment_id && charge.id) {
          updateData.pagarme_payment_id = charge.id;
        }

        if (charge.last_transaction && charge.last_transaction.card) {
          if (!updateData.card_brand && charge.last_transaction.card.brand) {
            updateData.card_brand = charge.last_transaction.card.brand;
          }
          if (!updateData.card_last_four_digits && charge.last_transaction.card.last_four_digits) {
            updateData.card_last_four_digits = charge.last_transaction.card.last_four_digits;
          }
        }
      }

      // Atualizar usando proposal_id
      const { data, error } = await this.client
        .from(this.tableName)
        .update(updateData)
        .eq('proposal_id', proposalId)
        .select();

      if (error) {
        console.error('❌ Erro ao atualizar no Supabase por proposal_id:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn(`⚠️ Nenhum registro encontrado com proposal_id: ${proposalId}`);
        return null;
      }

      console.log(`✅ Status atualizado no Supabase para ${data.length} registro(s) com proposal_id: ${proposalId}`);
      return data[0];
    } catch (error) {
      console.error('❌ Erro no Supabase Service - updatePaymentStatusByProposalId:', error);
      return null;
    }
  }

  /**
   * Listar pagamentos
   */
  async listPayments(filters = {}, limit = 50, offset = 0) {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      let query = this.client
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao listar pagamentos no Supabase:', error);
      return [];
    }
  }
}

module.exports = new SupabaseService();

