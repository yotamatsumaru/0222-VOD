const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function seed() {
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

    const seedPath = path.join(__dirname, '../prisma/seed.sql');
    const sql = fs.readFileSync(seedPath, 'utf8');

    console.log('Running seed...');
    await client.query(sql);
    console.log('Seed completed successfully!');

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
