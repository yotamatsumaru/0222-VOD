require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
  }
  
  console.log('📊 Database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // RDS用のSSL設定
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const seedPath = path.join(__dirname, '../prisma/seed.sql');
    
    if (!fs.existsSync(seedPath)) {
      console.error('❌ Seed file not found:', seedPath);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(seedPath, 'utf8');

    console.log('🌱 Running seed...');
    await client.query(sql);
    console.log('✅ Seed completed successfully!');

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
