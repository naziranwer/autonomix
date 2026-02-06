import { Pool } from 'pg';
import { config } from './config.js';

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.query('SELECT NOW()').then(() => {
  console.log('Database connected');
}).catch((err) => {
  console.error('Database connection failed:', err);
  process.exit(1);
});
