const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database URL:', DATABASE_URL.replace(/:[^:]*@/, ':****@'));
    
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    console.log('PostgreSQL version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('\nExisting tables:', tables.rows.map(r => r.table_name).join(', '));
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Database connection test passed!');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('Error code:', err.code);
    process.exit(1);
  }
}

testConnection();
