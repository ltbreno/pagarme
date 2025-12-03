const { query } = require('../config/database');
const SupabaseService = require('../services/supabase.service');

class PaymentModel {
  // Criar novo pagamento
  static async create(paymentData) {
    const {
      pagarme_id,
      amount,
      currency = 'BRL',
      payment_method,
      status,
      description,
      card_token,
      installments = 1,
      pix_qr_code,
      pix_qr_code_url,
      customer_name,
      customer_email,
      customer_document,
      proposal_id, // Recebe do frontend
      pagarme_response
    } = paymentData;

    let supabasePayment = null;
    let postgresPayment = null;

    console.log('💾 ============================================');
    console.log('💾 Salvando Pagamento - Dual Write');
    console.log('💾 ============================================');
    console.log('📊 Dados do pagamento:', {
      pagarme_id,
      amount,
      payment_method,
      status,
      customer_name,
      proposal_id
    });

    // Tentar salvar no Supabase primeiro (principal)
    try {
      if (SupabaseService.isConfigured()) {
        console.log('🔷 Tentando salvar no Supabase...');
        supabasePayment = await SupabaseService.createPayment(paymentData);
        console.log('✅ Pagamento salvo no Supabase com sucesso!');
        console.log('   ID Supabase:', supabasePayment?.id);
      } else {
        console.log('⚠️ Supabase não configurado, pulando...');
      }
    } catch (error) {
      console.error('❌ ============================================');
      console.error('❌ ERRO ao salvar no Supabase');
      console.error('❌ ============================================');
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Stack:', error.stack);
      console.error('❌ Continuando com PostgreSQL apenas...');
      console.error('❌ ============================================');
    }

    // Salvar no PostgreSQL (backup)
    try {
      console.log('🐘 Salvando no PostgreSQL (backup)...');
      const sql = `
        INSERT INTO payments (
          pagarme_id, amount, currency, payment_method, status, description,
          card_token, installments, pix_qr_code, pix_qr_code_url,
          customer_name, customer_email, customer_document, pagarme_response
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const values = [
        pagarme_id, amount, currency, payment_method, status, description,
        card_token, installments, pix_qr_code, pix_qr_code_url,
        customer_name, customer_email, customer_document, JSON.stringify(pagarme_response)
      ];

      const result = await query(sql, values);
      postgresPayment = result.rows[0];
      console.log('✅ Pagamento salvo no PostgreSQL com sucesso!');
      console.log('   ID PostgreSQL:', postgresPayment.id);
    } catch (error) {
      console.error('❌ ============================================');
      console.error('❌ ERRO ao salvar no PostgreSQL');
      console.error('❌ ============================================');
      console.error('❌ Mensagem:', error.message);
      console.error('❌ ============================================');
      // Se ambos falharem, lançar erro
      if (!supabasePayment) {
        throw error;
      }
    }

    console.log('💾 ============================================');
    console.log('💾 Resumo do Salvamento:');
    console.log('   🔷 Supabase:', supabasePayment ? `✅ ID ${supabasePayment.id}` : '❌ Não salvo');
    console.log('   🐘 PostgreSQL:', postgresPayment ? `✅ ID ${postgresPayment.id}` : '❌ Não salvo');
    console.log('💾 ============================================');

    // Retornar dados do Supabase se disponível, senão do PostgreSQL
    return supabasePayment || postgresPayment;
  }

  // Buscar pagamento por ID
  static async findById(id) {
    const sql = 'SELECT * FROM payments WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Buscar pagamento por ID do Pagar.me
  static async findByPagarmeId(pagarmeId) {
    // Tentar buscar no Supabase primeiro
    try {
      if (SupabaseService.isConfigured()) {
        const supabasePayment = await SupabaseService.findPaymentByPagarmeId(pagarmeId);
        if (supabasePayment) {
          console.log('🔷 Pagamento encontrado no Supabase');
          return supabasePayment;
        }
      }
    } catch (error) {
      console.error('⚠️ Erro ao buscar no Supabase, tentando PostgreSQL:', error.message);
    }

    // Fallback para PostgreSQL
    const sql = 'SELECT * FROM payments WHERE pagarme_id = $1';
    const result = await query(sql, [pagarmeId]);
    if (result.rows[0]) {
      console.log('🐘 Pagamento encontrado no PostgreSQL');
    }
    return result.rows[0];
  }

  // Buscar pagamentos por status
  static async findByStatus(status, limit = 50, offset = 0) {
    const sql = 'SELECT * FROM payments WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const result = await query(sql, [status, limit, offset]);
    return result.rows;
  }

  // Buscar pagamentos por método
  static async findByPaymentMethod(paymentMethod, limit = 50, offset = 0) {
    const sql = 'SELECT * FROM payments WHERE payment_method = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const result = await query(sql, [paymentMethod, limit, offset]);
    return result.rows;
  }

  // Listar todos os pagamentos
  static async findAll(limit = 50, offset = 0) {
    const sql = 'SELECT * FROM payments ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const result = await query(sql, [limit, offset]);
    return result.rows;
  }

  // Atualizar status do pagamento
  static async updateStatus(id, status, pagarmeResponse = null) {
    let supabaseUpdated = false;
    let postgresUpdated = false;

    // Se temos pagarmeResponse, extrair o pagarme_order_id
    let pagarmeOrderId = null;
    if (pagarmeResponse && pagarmeResponse.id) {
      pagarmeOrderId = pagarmeResponse.id;
    }

    // Tentar atualizar no Supabase primeiro
    if (pagarmeOrderId) {
      try {
        if (SupabaseService.isConfigured()) {
          const updated = await SupabaseService.updatePaymentStatus(pagarmeOrderId, status, pagarmeResponse);
          if (updated) {
            supabaseUpdated = true;
            console.log('✅ Status atualizado no Supabase');
          } else {
            console.log('⚠️ Pagamento não encontrado no Supabase (pode ter sido criado apenas no PostgreSQL)');
          }
        }
      } catch (error) {
        console.error('⚠️ Erro ao atualizar no Supabase:', error.message);
      }
    } else {
      console.log('ℹ️ Sem pagarme_order_id, pulando atualização no Supabase');
    }

    // Atualizar no PostgreSQL
    try {
      let sql, values;

      if (pagarmeResponse) {
        sql = 'UPDATE payments SET status = $1, pagarme_response = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
        values = [status, JSON.stringify(pagarmeResponse), id];
      } else {
        sql = 'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
        values = [status, id];
      }

      const result = await query(sql, values);
      postgresUpdated = true;
      console.log('✅ Status atualizado no PostgreSQL');
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao atualizar no PostgreSQL:', error.message);
      if (!supabaseUpdated) {
        throw error;
      }
      return null;
    }
  }

  // Atualizar dados do PIX
  static async updatePixData(id, pixQrCode, pixQrCodeUrl) {
    const sql = `
      UPDATE payments
      SET pix_qr_code = $1, pix_qr_code_url = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 RETURNING *
    `;
    const result = await query(sql, [pixQrCode, pixQrCodeUrl, id]);
    return result.rows[0];
  }

  // Deletar pagamento
  static async delete(id) {
    const sql = 'DELETE FROM payments WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Contar pagamentos por status
  static async countByStatus(status) {
    const sql = 'SELECT COUNT(*) as count FROM payments WHERE status = $1';
    const result = await query(sql, [status]);
    return parseInt(result.rows[0].count);
  }

  // Estatísticas gerais
  static async getStats() {
    const sql = `
      SELECT
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
        AVG(amount) as average_amount
      FROM payments
    `;
    const result = await query(sql);
    return result.rows[0];
  }
}

module.exports = PaymentModel;
