const PagarmeService = require('../services/pagarme.service');

class CustomerController {
  /**
   * Criar cliente na Pagar.me
   * POST /api/customers
   */
  async createCustomer(req, res) {
    try {
      const customerData = req.validatedData;

      // Criar cliente na Pagar.me
      const pagarmeCustomer = await PagarmeService.createCustomer(customerData);

      res.status(201).json({
        success: true,
        message: 'Cliente criado com sucesso',
        data: {
          pagarme_customer_id: pagarmeCustomer.id
        }
      });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obter cliente por ID
   * GET /api/customers/:id
   */
  async getCustomer(req, res) {
    try {
      const { id } = req.params;
      const customer = await PagarmeService.getCustomer(id);

      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      console.error('Erro ao obter cliente:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
}

module.exports = new CustomerController();

