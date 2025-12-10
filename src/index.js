require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Importar rotas
const paymentRoutes = require('./routes/payment.routes');
const customerRoutes = require('./routes/customer.routes');
const recipientRoutes = require('./routes/recipient.routes');
const transferRoutes = require('./routes/transfer.routes');
const cardRoutes = require('./routes/card.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rotas
app.use('/api/payments', paymentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/cards', cardRoutes);

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
