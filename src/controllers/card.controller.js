const PagarmeService = require('../services/pagarme.service');

class CardController {
    /**
     * Criar cartão para um cliente
     * POST /api/cards
     */
    async createCard(req, res) {
        try {
            console.log('📥 CardController - Recebendo requisição de criação de cartão');
            console.log('📥 Body recebido:', JSON.stringify(req.body, null, 2));

            const { customer_id } = req.validatedData;
            const cardData = req.validatedData;

            const card = await PagarmeService.createCard(customer_id, cardData);

            res.status(201).json(card);
        } catch (error) {
            console.error('Erro ao criar cartão:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erro ao criar cartão'
            });
        }
    }

    /**
     * Listar cartões de um cliente
     * GET /api/customers/:id/cards
     */
    async listCards(req, res) {
        try {
            const { id } = req.params;
            const cards = await PagarmeService.getCards(id);

            res.status(200).json(cards);
        } catch (error) {
            console.error('Erro ao listar cartões:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erro ao listar cartões'
            });
        }
    }
}

module.exports = new CardController();
