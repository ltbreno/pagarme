const { Pool } = require('pg');

// Configuração da conexão com PostgreSQL usando DATABASE_URL
// Formato: postgresql://user:password@host:port/database
const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      // Fallback para variáveis individuais (compatibilidade)
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

console.log('🔧 PostgreSQL Configuration:');
console.log('   Using DATABASE_URL:', !!process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  console.log('   Host:', process.env.DB_HOST);
  console.log('   Port:', process.env.DB_PORT);
  console.log('   Database:', process.env.DB_NAME);
}

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
