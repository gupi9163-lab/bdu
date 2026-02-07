const { Pool } = require('pg');

// Render.com PostgreSQL məlumatlarınız
const pool = new Pool({
  host: process.env.DB_HOST || 'dpg-d831174e80s73becsig-a',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bdus_1be8',
  user: process.env.DB_USER || 'bdus_1be8_user',
  password: process.env.DB_PASSWORD || 'Ap7bFxafa9S0gpFm0H1C9qB8mmrf4c',
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database bağlantısı uğurlu');
});

pool.on('error', (err) => {
  console.error('❌ Database xətası:', err);
});

module.exports = pool;
