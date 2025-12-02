const { Pool } = require('pg');

// Configuração da conexão com PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST ,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // fechar conexões idle após 30 segundos
  connectionTimeoutMillis: 2000, // timeout para estabelecer conexão
});

// Testar conexão
pool.on('connect', () => {
  console.log('🔗 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('❌ Query error:', err);
    throw err;
  }
};

module.exports = {
  pool,
  query
};
