const PagarmeService = require('../services/pagarme.service');

class TransferController {
  /**
   * Criar transferência na Pagar.me
   * POST /api/transfers
   */
  async createTransfer(req, res) {
    try {
      const transferData = req.validatedData;

      // Criar transferência na Pagar.me
      const pagarmeTransfer = await PagarmeService.createTransfer(transferData);

      res.status(201).json({
        success: true,
        message: 'Transferência criada com sucesso',
        data: {
          transfer_id: pagarmeTransfer.id
        }
      });
    } catch (error) {
      console.error('Erro ao criar transferência:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
}

module.exports = new TransferController();

