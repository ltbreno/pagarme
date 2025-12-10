const express = require('express');
const CustomerController = require('../controllers/customer.controller');
const { validateCustomer } = require('../middleware/validation.middleware');

const router = express.Router();

// POST /api/customers - Criar cliente
router.post('/',
  validateCustomer,
  CustomerController.createCustomer.bind(CustomerController)
);

// GET /api/customers/:id - Obter cliente por ID
router.get('/:id',
  CustomerController.getCustomer.bind(CustomerController)
);

// GET /api/customers/:id/cards - Listar cartões do cliente
router.get('/:id/cards',
  require('../controllers/card.controller').listCards.bind(require('../controllers/card.controller'))
);

module.exports = router;

