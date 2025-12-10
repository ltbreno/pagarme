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
    }),

  proposal_id: Joi.string().uuid().optional()
    .messages({
      'string.uuid': 'proposal_id deve ser um UUID válido'
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
    }),

  proposal_id: Joi.string().uuid().optional()
    .messages({
      'string.uuid': 'proposal_id deve ser um UUID válido'
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
    console.log(`🔍 [Middleware] Validando ${req.method} ${req.originalUrl}`);
    console.log('📥 [Middleware] Body:', JSON.stringify(req.body, null, 2));

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      console.error('❌ [Middleware] Erro de validação:', JSON.stringify(error.details.map(d => d.message), null, 2));
      
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

// Schema de validação para criar cliente (Pagar.me v5)
const customerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'O nome deve ter pelo menos 2 caracteres',
      'string.max': 'O nome deve ter no máximo 255 caracteres',
      'any.required': 'O nome é obrigatório'
    }),

  email: Joi.string().email().required()
    .messages({
      'string.email': 'E-mail inválido',
      'any.required': 'O e-mail é obrigatório'
    }),

  code: Joi.string().max(52).optional()
    .messages({
      'string.max': 'O código deve ter no máximo 52 caracteres'
    }),

  document: Joi.string().pattern(/^\d{11}|\d{14}$/).required()
    .messages({
      'string.pattern.base': 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos',
      'any.required': 'O documento (CPF/CNPJ) é obrigatório'
    }),

  type: Joi.string().valid('individual', 'company').default('individual')
    .messages({
      'any.only': 'Tipo deve ser "individual" ou "company"'
    }),

  document_type: Joi.string().valid('CPF', 'CNPJ', 'PASSPORT').default('CPF')
    .messages({
      'any.only': 'Tipo de documento deve ser "CPF", "CNPJ" ou "PASSPORT"'
    }),

  gender: Joi.string().valid('male', 'female').optional()
    .messages({
      'any.only': 'Gênero deve ser "male" ou "female"'
    }),

  birthdate: Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/).optional()
    .messages({
      'string.pattern.base': 'Data de nascimento deve estar no formato DD/MM/AAAA'
    }),

  address: Joi.object({
    line_1: Joi.string().max(256).required()
      .messages({
        'any.required': 'Endereço linha 1 é obrigatório',
        'string.max': 'Endereço linha 1 deve ter no máximo 256 caracteres'
      }),
    line_2: Joi.string().max(256).optional(),
    zip_code: Joi.string().pattern(/^\d{8}$/).required()
      .messages({
        'string.pattern.base': 'CEP deve ter 8 dígitos',
        'any.required': 'CEP é obrigatório'
      }),
    city: Joi.string().max(64).required()
      .messages({
        'any.required': 'Cidade é obrigatória'
      }),
    state: Joi.string().length(2).required()
      .messages({
        'string.length': 'Estado deve ter 2 caracteres',
        'any.required': 'Estado é obrigatório'
      }),
    country: Joi.string().length(2).default('BR')
  }).optional(),

  phones: Joi.object({
    home_phone: Joi.object({
      country_code: Joi.string().default('55'),
      area_code: Joi.string().pattern(/^\d{2}$/).required()
        .messages({
          'string.pattern.base': 'DDD deve ter 2 dígitos'
        }),
      number: Joi.string().pattern(/^\d{8,9}$/).required()
        .messages({
          'string.pattern.base': 'Telefone deve ter 8 ou 9 dígitos'
        })
    }).optional(),
    mobile_phone: Joi.object({
      country_code: Joi.string().default('55'),
      area_code: Joi.string().pattern(/^\d{2}$/).required()
        .messages({
          'string.pattern.base': 'DDD deve ter 2 dígitos'
        }),
      number: Joi.string().pattern(/^\d{8,9}$/).required()
        .messages({
          'string.pattern.base': 'Telefone deve ter 8 ou 9 dígitos'
        })
    }).optional()
  }).optional(),

  metadata: Joi.object().optional()
});

// Schema de validação para criar recebedor
const recipientSchema = Joi.object({
  name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'O nome deve ter pelo menos 2 caracteres',
      'string.max': 'O nome deve ter no máximo 255 caracteres',
      'any.required': 'O nome é obrigatório'
    }),

  email: Joi.string().email().required()
    .messages({
      'string.email': 'E-mail inválido',
      'any.required': 'O e-mail é obrigatório'
    }),

  document: Joi.string().pattern(/^\d{11}|\d{14}$/).required()
    .messages({
      'string.pattern.base': 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos',
      'any.required': 'O documento (CPF/CNPJ) é obrigatório'
    }),

  bank_account: Joi.object({
    holder_name: Joi.string().required(),
    holder_type: Joi.string().valid('individual', 'company').required(),
    holder_document: Joi.string().pattern(/^\d{11}|\d{14}$/).required(),
    bank: Joi.string().required(),
    account_number: Joi.string().required(),
    account_type: Joi.string().valid('checking', 'savings').required(),
    branch_number: Joi.string().required()
  }).required()
    .messages({
      'any.required': 'Conta bancária é obrigatória'
    })
});

// Schema de validação para criar transferência
const transferSchema = Joi.object({
  recipient_id: Joi.string().required()
    .messages({
      'any.required': 'ID do recebedor é obrigatório'
    }),

  amount: Joi.number().integer().min(100).max(100000000).required()
    .messages({
      'number.min': 'O valor deve ser no mínimo R$ 1,00',
      'number.max': 'O valor deve ser no máximo R$ 1.000.000,00',
      'any.required': 'O valor é obrigatório'
    }),

  order_id: Joi.string().optional()
    .messages({
      'string.base': 'ID do pedido deve ser uma string'
    }),

  metadata: Joi.object().optional()
});

// Schema de validação para criar cartão
const createCardSchema = Joi.object({
  customer_id: Joi.string().required()
    .messages({
      'any.required': 'ID do cliente é obrigatório'
    }),

  card_token: Joi.string().optional(),

  number: Joi.string().pattern(/^\d{13,19}$/).optional(),
  holder_name: Joi.string().optional(),
  exp_month: Joi.number().integer().min(1).max(12).optional(),
  exp_year: Joi.number().integer().optional(),
  cvv: Joi.string().pattern(/^\d{3,4}$/).optional(),

  billing_address: Joi.object({
    line_1: Joi.string().required(),
    zip_code: Joi.string().pattern(/^\d{8}$/).required(),
    city: Joi.string().required(),
    state: Joi.string().length(2).required(),
    country: Joi.string().default('BR')
  }).optional()
}).or('card_token', 'number') // Deve ter token OU número
  .messages({
    'object.missing': 'É necessário fornecer card_token OU dados do cartão (number, etc)'
  });

module.exports = {
  validateCreditCardPayment: validate(creditCardPaymentSchema),
  validatePixPayment: validate(pixPaymentSchema),
  validateCardToken: validate(cardTokenSchema),
  validatePagarmeToken: validate(pagarmeTokenSchema),
  validateCustomer: validate(customerSchema),
  validateRecipient: validate(recipientSchema),
  validateTransfer: validate(transferSchema),
  validateCreateCard: validate(createCardSchema),
  validate
};
