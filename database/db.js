const { Pool } = require('pg');

// Render.com PostgreSQL məlumatlarınız
// External URL ilə bağlantı
const connectionString = process.env.DATABASE_URL || 
  'postgresql://bdus_1be8_user:Ap7bFxafa9S0gpFm0H1C9qB8mmrf4c@dpg-d831174e80s73becsig-a.oregon-postgres.render.com/bdus_1be8';

const pool = new Pool({
  connectionString,
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
