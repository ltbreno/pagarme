const { query } = require('../config/database');

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
      pagarme_response
    } = paymentData;

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
    return result.rows[0];
  }

  // Buscar pagamento por ID
  static async findById(id) {
    const sql = 'SELECT * FROM payments WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Buscar pagamento por ID do Pagar.me
  static async findByPagarmeId(pagarmeId) {
    const sql = 'SELECT * FROM payments WHERE pagarme_id = $1';
    const result = await query(sql, [pagarmeId]);
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
    let sql, values;

    if (pagarmeResponse) {
      sql = 'UPDATE payments SET status = $1, pagarme_response = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
      values = [status, JSON.stringify(pagarmeResponse), id];
    } else {
      sql = 'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
      values = [status, id];
    }

    const result = await query(sql, values);
    return result.rows[0];
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
