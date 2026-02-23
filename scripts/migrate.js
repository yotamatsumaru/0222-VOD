require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
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

    const migrationsDir = path.join(__dirname, '../prisma/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // ファイル名でソート（0001, 0002, ...）
    
    if (migrationFiles.length === 0) {
      console.error('❌ No migration files found in:', migrationsDir);
      process.exit(1);
    }
    
    console.log(`📂 Found ${migrationFiles.length} migration file(s)`);

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      console.log(`🚀 Running migration: ${file}...`);
      await client.query(sql);
      console.log(`✅ ${file} completed!`);
    }
    
    console.log('✅ All migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
