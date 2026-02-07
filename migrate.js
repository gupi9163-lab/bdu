const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://bdus_1be8_user:Ap7bFxafa9S0gpFm0H1C9qB8mmrf4c@dpg-d831174e80s73becsig-a.oregon-postgres.render.com/bdus_1be8',
  ssl: {
    rejectUnauthorized: false
  }
});

const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('🔄 Database migration başlayır...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_initial_schema.sql'),
      'utf-8'
    );

    await pool.query(migrationSQL);

    console.log('✅ Migration uğurla tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration xətası:', error);
    process.exit(1);
  }
}

runMigrations();
