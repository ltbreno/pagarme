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
        data: {
          pagarme_customer_id: pagarmeCustomer.id,
          name: pagarmeCustomer.name,
          email: pagarmeCustomer.email,
          document: pagarmeCustomer.document,
          type: pagarmeCustomer.type,
          created_at: pagarmeCustomer.created_at
        }
      });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);

      res.status(500).json({
        success: false,
        error: error.message || 'Erro interno do servidor',
        details: error.response?.errors || null
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
