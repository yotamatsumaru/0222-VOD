const { Pool } = require('pg');

async function testDB(dbName) {
  const DATABASE_URL = `postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/${dbName}`;
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log(`\n📡 Testing connection to database: ${dbName}...`);
    const client = await pool.connect();
    console.log(`✅ Connected to ${dbName}!`);
    
    const result = await client.query('SELECT current_database()');
    console.log('Current database:', result.rows[0].current_database);
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));
    
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.error(`❌ Failed to connect to ${dbName}:`, err.message);
    await pool.end();
    return false;
  }
}

async function main() {
  console.log('Testing both possible database names...\n');
  
  const db1 = await testDB('streaming');
  const db2 = await testDB('streaming_platform');
  
  if (db1) {
    console.log('\n✅ Correct DATABASE_URL:');
    console.log('DATABASE_URL=postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming');
  } else if (db2) {
    console.log('\n✅ Correct DATABASE_URL:');
    console.log('DATABASE_URL=postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform');
  } else {
    console.log('\n❌ Neither database name worked. Possible issues:');
    console.log('1. Password is incorrect');
    console.log('2. RDS security group does not allow connection from this IP');
    console.log('3. Database name is different');
    console.log('4. RDS instance is not publicly accessible');
  }
}

main();
