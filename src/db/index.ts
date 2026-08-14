import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Function to create a new connection pool.
export const createPool = () => {
  const sqlHost = process.env.SQL_HOST || 'localhost';
  const isSsl = process.env.SQL_SSL === 'true' || sqlHost.includes('supabase');

  console.log(`Connecting PostgreSQL pool to host: ${sqlHost}:${process.env.SQL_PORT || 5432}`);

  return new Pool({
    host: sqlHost,
    port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT) : 5432,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 15000,
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
