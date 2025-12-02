const Joi = require('joi');

// Schema de validação para pagamento com cartão de crédito
const creditCardPaymentSchema = Joi.object({
  amount: Joi.number().integer().min(100).max(100000000).required() // mínimo 1 real, máximo 1 milhão
    .messages({
      'number.min': 'O valor deve ser no mínimo R$ 1,00',
      'number.max': 'O valor deve ser no máximo R$ 1.000.000,00',
      'any.required': 'O valor é obrigatório'
    }),

  card_token: Joi.string().required()
    .messages({
      'any.required': 'O token do cartão é obrigatório'
    }),

  installments: Joi.number().integer().min(1).max(12).default(1)
    .messages({
      'number.min': 'O número de parcelas deve ser no mínimo 1',
      'number.max': 'O número de parcelas deve ser no máximo 12'
    }),

  customer_name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'O nome deve ter pelo menos 2 caracteres',
      'string.max': 'O nome deve ter no máximo 255 caracteres',
      'any.required': 'O nome do cliente é obrigatório'
    }),

  customer_email: Joi.string().email().required()
    .messages({
      'string.email': 'E-mail inválido',
      'any.required': 'O e-mail é obrigatório'
    }),

  customer_document: Joi.string().pattern(/^\d{11}|\d{14}$/).required()
    .messages({
      'string.pattern.base': 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos',
      'any.required': 'O documento (CPF/CNPJ) é obrigatório'
    }),

  description: Joi.string().max(500).optional()
    .messages({
      'string.max': 'A descrição deve ter no máximo 500 caracteres'
    })
});

// Schema de validação para pagamento PIX
const pixPaymentSchema = Joi.object({
  amount: Joi.number().integer().min(100).max(100000000).required()
    .messages({
      'number.min': 'O valor deve ser no mínimo R$ 1,00',
      'number.max': 'O valor deve ser no máximo R$ 1.000.000,00',
      'any.required': 'O valor é obrigatório'
    }),

  customer_name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'O nome deve ter pelo menos 2 caracteres',
      'string.max': 'O nome deve ter no máximo 255 caracteres',
      'any.required': 'O nome do cliente é obrigatório'
    }),

  customer_email: Joi.string().email().required()
    .messages({
      'string.email': 'E-mail inválido',
      'any.required': 'O e-mail é obrigatório'
    }),

  customer_document: Joi.string().pattern(/^\d{11}|\d{14}$/).required()
    .messages({
      'string.pattern.base': 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos',
      'any.required': 'O documento (CPF/CNPJ) é obrigatório'
    }),

  customer_phone: Joi.object({
    country_code: Joi.string().default('55'),
    area_code: Joi.string().pattern(/^\d{2}$/).required()
      .messages({
        'string.pattern.base': 'DDD deve ter 2 dígitos',
        'any.required': 'DDD é obrigatório'
      }),
    number: Joi.string().pattern(/^\d{8,9}$/).required()
      .messages({
        'string.pattern.base': 'Telefone deve ter 8 ou 9 dígitos',
        'any.required': 'Número de telefone é obrigatório'
      })
  }).required()
    .messages({
      'any.required': 'Telefone é obrigatório'
    }),

  description: Joi.string().max(500).optional()
    .messages({
      'string.max': 'A descrição deve ter no máximo 500 caracteres'
    })
});

// Schema para criação de token de cartão (formato antigo)
const cardTokenSchema = Joi.object({
  number: Joi.string().pattern(/^\d{13,19}$/).required()
    .messages({
      'string.pattern.base': 'Número do cartão deve ter entre 13 e 19 dígitos',
      'any.required': 'O número do cartão é obrigatório'
    }),

  holder_name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'O nome do titular deve ter pelo menos 2 caracteres',
      'string.max': 'O nome do titular deve ter no máximo 255 caracteres',
      'any.required': 'O nome do titular é obrigatório'
    }),

  exp_month: Joi.number().integer().min(1).max(12).required()
    .messages({
      'number.min': 'Mês de expiração deve ser entre 1 e 12',
      'number.max': 'Mês de expiração deve ser entre 1 e 12',
      'any.required': 'O mês de expiração é obrigatório'
    }),

  exp_year: Joi.number().integer().min(new Date().getFullYear()).required()
    .messages({
      'number.min': 'Ano de expiração deve ser válido',
      'any.required': 'O ano de expiração é obrigatório'
    }),

  cvv: Joi.string().pattern(/^\d{3,4}$/).required()
    .messages({
      'string.pattern.base': 'CVV deve ter 3 ou 4 dígitos',
      'any.required': 'O CVV é obrigatório'
    }),

  billing_address: Joi.object({
    line_1: Joi.string().required(),
    zip_code: Joi.string().pattern(/^\d{8}$/).required(),
    city: Joi.string().required(),
    state: Joi.string().length(2).required(),
    country: Joi.string().default('BR')
  }).optional()
});

// Schema para criação de token de cartão (formato compatível com SDK Pagar.me)
const pagarmeTokenSchema = Joi.object({
  card: Joi.object({
    number: Joi.string().pattern(/^\d{13,19}$/).required()
      .messages({
        'string.pattern.base': 'Número do cartão deve ter entre 13 e 19 dígitos',
        'any.required': 'O número do cartão é obrigatório'
      }),

    holder_name: Joi.string().min(2).max(255).required()
      .messages({
        'string.min': 'O nome do titular deve ter pelo menos 2 caracteres',
        'string.max': 'O nome do titular deve ter no máximo 255 caracteres',
        'any.required': 'O nome do titular é obrigatório'
      }),

    holder_document: Joi.string().pattern(/^\d{11}|\d{14}$/).optional()
      .messages({
        'string.pattern.base': 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos'
      }),

    exp_month: Joi.alternatives().try(
      Joi.number().integer().min(1).max(12),
      Joi.string().pattern(/^\d{1,2}$/).custom((value) => {
        const num = parseInt(value);
        if (num < 1 || num > 12) throw new Error('Mês inválido');
        return num;
      })
    ).required()
      .messages({
        'number.min': 'Mês de expiração deve ser entre 1 e 12',
        'number.max': 'Mês de expiração deve ser entre 1 e 12',
        'any.required': 'O mês de expiração é obrigatório'
      }),

    exp_year: Joi.alternatives().try(
      Joi.number().integer().min(new Date().getFullYear()),
      Joi.string().pattern(/^\d{2,4}$/).custom((value) => {
        const num = parseInt(value);
        const currentYear = new Date().getFullYear();
        // Permitir anos de 2 dígitos (YY) ou 4 dígitos (YYYY)
        const fullYear = num < 100 ? 2000 + num : num;
        if (fullYear < currentYear) throw new Error('Ano expirado');
        return fullYear;
      })
    ).required()
      .messages({
        'number.min': 'Ano de expiração deve ser válido',
        'any.required': 'O ano de expiração é obrigatório',
        'alternatives.match': 'Ano de expiração deve ser um número válido'
      }),

    cvv: Joi.string().pattern(/^\d{3,4}$/).required()
      .messages({
        'string.pattern.base': 'CVV deve ter 3 ou 4 dígitos',
        'any.required': 'O CVV é obrigatório'
      }),

    label: Joi.string().optional() // Campo opcional do SDK
  }).required()
    .messages({
      'any.required': 'Dados do cartão são obrigatórios'
    }),

  type: Joi.string().valid('card').required()
    .messages({
      'any.only': 'Tipo deve ser "card"',
      'any.required': 'Tipo é obrigatório'
    }),

  // appId será passado no header ou query param
});

// Middleware para validar dados
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errors
      });
    }

    req.validatedData = value;
    next();
  };
};

module.exports = {
  validateCreditCardPayment: validate(creditCardPaymentSchema),
  validatePixPayment: validate(pixPaymentSchema),
  validateCardToken: validate(cardTokenSchema),
  validatePagarmeToken: validate(pagarmeTokenSchema),
  validate
};
