const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // RDS用のSSL設定
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    const migrationPath = path.join(__dirname, '../prisma/migrations/0001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
