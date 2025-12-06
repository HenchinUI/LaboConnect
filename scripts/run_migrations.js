const fs = require('fs');
const path = require('path');
const db = require('../db');

async function run() {
  try {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found:', migrationsDir);
      process.exit(0);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (!files.length) {
      console.log('No .sql files in migrations folder');
      process.exit(0);
    }

    console.log('Found migrations:', files);

    const client = await db.connect();
    try {
      for (const file of files) {
        const full = path.join(migrationsDir, file);
        console.log('Running migration:', file);
        const sql = fs.readFileSync(full, 'utf8');
        // Execute as a single query. If migration contains multiple statements,
        // pg will execute them as a batch.
        await client.query(sql);
        console.log('Applied:', file);
      }
      console.log('All migrations applied');
    } finally {
      client.release();
    }
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
