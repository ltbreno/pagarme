const PagarmeService = require('../services/pagarme.service');

class RecipientController {
  /**
   * Criar recebedor na Pagar.me
   * POST /api/recipients
   */
  async createRecipient(req, res) {
    try {
      console.log('📥 ============================================');
      console.log('📥 POST /api/recipients - Criar Recebedor');
      console.log('📥 ============================================');
      console.log('📊 Request Body recebido:', JSON.stringify(req.body, null, 2));
      
      const recipientData = req.validatedData;
      console.log('✅ Dados validados:', JSON.stringify(recipientData, null, 2));

      console.log('🔄 Chamando Pagar.me Service...');
      // Criar recebedor na Pagar.me
      const pagarmeRecipient = await PagarmeService.createRecipient(recipientData);

      console.log('✅ Recebedor criado na Pagar.me:', pagarmeRecipient.id);
      console.log('📊 Resposta completa da Pagar.me:', JSON.stringify(pagarmeRecipient, null, 2));

      const response = {
        success: true,
        message: 'Recebedor criado com sucesso',
        data: {
          pagarme_recipient_id: pagarmeRecipient.id
        }
      };

      console.log('📤 Resposta enviada:', JSON.stringify(response, null, 2));
      console.log('✅ ============================================');

      res.status(201).json(response);
    } catch (error) {
      console.error('❌ ============================================');
      console.error('❌ Erro ao criar recebedor');
      console.error('❌ ============================================');
      console.error('❌ Erro completo:', error);
      console.error('❌ Stack:', error.stack);
      if (error.response) {
        console.error('❌ Response da API:', error.response.data);
        console.error('❌ Status:', error.response.status);
      }
      console.error('❌ ============================================');

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obter recebedor por ID
   * GET /api/recipients/:id
   */
  async getRecipient(req, res) {
    try {
      console.log('📥 ============================================');
      console.log('📥 GET /api/recipients/:id - Obter Recebedor');
      console.log('📥 ============================================');
      const { id } = req.params;
      console.log('📌 ID solicitado:', id);

      console.log('🔄 Chamando Pagar.me Service...');
      const recipient = await PagarmeService.getRecipient(id);

      console.log('✅ Recebedor encontrado:', recipient.id);
      console.log('📊 Dados do recebedor:', JSON.stringify(recipient, null, 2));

      const response = {
        success: true,
        data: recipient
      };

      console.log('📤 Resposta enviada');
      console.log('✅ ============================================');

      res.json(response);
    } catch (error) {
      console.error('❌ ============================================');
      console.error('❌ Erro ao obter recebedor');
      console.error('❌ ============================================');
      console.error('❌ ID solicitado:', req.params.id);
      console.error('❌ Erro completo:', error);
      console.error('❌ Stack:', error.stack);
      if (error.response) {
        console.error('❌ Response da API:', error.response.data);
        console.error('❌ Status:', error.response.status);
      }
      console.error('❌ ============================================');

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
}

module.exports = new RecipientController();

