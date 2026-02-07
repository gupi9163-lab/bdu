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
    console.log('📍 Database: bdus_1be8');

    // Test connection
    console.log('🔄 Bağlantı yoxlanılır...');
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Bağlantı uğurlu:', testResult.rows[0].now);

    // Read migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_initial_schema.sql'),
      'utf-8'
    );

    console.log('🔄 Tables yaradılır...');
    await pool.query(migrationSQL);

    console.log('✅ Migration uğurla tamamlandı!');
    console.log('');
    console.log('📊 Yaradılan tables:');
    console.log('  - users (istifadəçilər)');
    console.log('  - session (sessiyalar)');
    console.log('  - faculties (16 fakultə)');
    console.log('  - chat_rooms (chat otaqları)');
    console.log('  - messages (qrup mesajları)');
    console.log('  - private_messages (şəxsi mesajlar)');
    console.log('  - blocks (əngəlləmələr)');
    console.log('  - reports (şikayətlər)');
    console.log('  - admin_settings (parametrlər)');
    console.log('  - admins (adminlər)');
    console.log('');
    console.log('🎉 Artıq serveri başlada bilərsiniz: npm start');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration xətası:', error.message);
    console.error('');
    console.error('🔍 Ətraflı məlumat:');
    console.error(error);
    console.error('');
    console.error('💡 Həll yolları:');
    console.error('  1. Database bağlantı məlumatlarını yoxlayın');
    console.error('  2. Database-in external bağlantılara açıq olduğundan əmin olun');
    console.error('  3. Render.com Shell-dən icra edin (internal network)');
    process.exit(1);
  }
}

runMigrations();
