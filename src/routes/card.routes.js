const express = require('express');
const CardController = require('../controllers/card.controller');
const { validateCreateCard } = require('../middleware/validation.middleware');

const router = express.Router();

// POST /api/cards - Criar cartão
router.post('/',
    validateCreateCard,
    CardController.createCard.bind(CardController)
);

module.exports = router;
