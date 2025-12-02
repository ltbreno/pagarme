require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query } = require('./database');

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Executar o SQL
    await query(sql);

    console.log('✅ Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
