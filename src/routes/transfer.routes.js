const express = require('express');
const TransferController = require('../controllers/transfer.controller');
const { validateTransfer } = require('../middleware/validation.middleware');

const router = express.Router();

// POST /api/transfers - Criar transferência
router.post('/',
  validateTransfer,
  TransferController.createTransfer.bind(TransferController)
);

module.exports = router;

