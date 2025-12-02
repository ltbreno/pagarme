-- Tabela para armazenar informações dos pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  pagarme_id VARCHAR(255) UNIQUE,
  amount INTEGER NOT NULL, -- valor em centavos
  currency VARCHAR(3) DEFAULT 'BRL',
  payment_method VARCHAR(50) NOT NULL, -- 'credit_card' ou 'pix'
  status VARCHAR(50) NOT NULL, -- pending, paid, failed, cancelled, refunded
  description TEXT,

  -- Dados específicos do cartão de crédito
  card_token VARCHAR(255),
  installments INTEGER DEFAULT 1,

  -- Dados específicos do PIX
  pix_qr_code TEXT,
  pix_qr_code_url VARCHAR(500),

  -- Metadados da transação
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_document VARCHAR(20),

  -- Respostas da API Pagar.me
  pagarme_response JSONB,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payments_pagarme_id ON payments(pagarme_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Tabela para logs de transações (opcional, para auditoria)
CREATE TABLE IF NOT EXISTS payment_logs (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para logs
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);
