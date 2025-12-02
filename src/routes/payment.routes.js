const express = require('express');
const PaymentController = require('../controllers/payment.controller');
const {
  validateCreditCardPayment,
  validatePixPayment,
  validateCardToken,
  validatePagarmeToken
} = require('../middleware/validation.middleware');

const router = express.Router();

// POST /api/payments - Criar pagamento com cartão de crédito
router.post('/',
  validateCreditCardPayment,
  PaymentController.createCreditCardPayment.bind(PaymentController)
);

// POST /api/payments/pix - Criar pagamento com PIX
router.post('/pix',
  validatePixPayment,
  PaymentController.createPixPayment.bind(PaymentController)
);

// POST /api/payments/card-token - Criar token de cartão (apenas para testes)
router.post('/card-token',
  validateCardToken,
  PaymentController.createCardToken.bind(PaymentController)
);

// POST /api/payments/tokens - Receber token criado no frontend
router.post('/tokens', (req, res) => {
  // Recebe tokens criados no frontend com chave pública
  // Apenas valida e confirma recebimento
  PaymentController.validateCardToken(req, res);
});

// POST /api/payments/validate-token - Validar token antes de usar
router.post('/validate-token', (req, res) => {
  PaymentController.validateCardToken(req, res);
});

// GET /api/payments/:id - Obter pagamento por ID
router.get('/:id',
  PaymentController.getPayment.bind(PaymentController)
);

// GET /api/payments - Listar pagamentos
router.get('/',
  PaymentController.listPayments.bind(PaymentController)
);

// GET /api/payments/stats/summary - Obter estatísticas de pagamentos
router.get('/stats/summary',
  PaymentController.getPaymentStats.bind(PaymentController)
);

// POST /api/payments/webhook - Webhook para notificações da Pagar.me
router.post('/webhook',
  PaymentController.handleWebhook.bind(PaymentController)
);

module.exports = router;
