const express = require('express');
const RecipientController = require('../controllers/recipient.controller');
const { validateRecipient } = require('../middleware/validation.middleware');

const router = express.Router();

// POST /api/recipients - Criar recebedor
router.post('/',
  validateRecipient,
  RecipientController.createRecipient.bind(RecipientController)
);

// GET /api/recipients/:id - Obter recebedor por ID
router.get('/:id',
  RecipientController.getRecipient.bind(RecipientController)
);

module.exports = router;

