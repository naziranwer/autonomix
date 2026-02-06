import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = fs.readFileSync(
    path.join(__dirname, '../migrations/001_initial.sql'),
    'utf-8'
  );
  await pool.query(sql);
  console.log('Migration complete');
  await pool.end();
  process.exit(0);
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err);
  await pool.end();
  process.exit(1);
});
