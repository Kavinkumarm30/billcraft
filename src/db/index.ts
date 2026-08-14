import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Function to create a new connection pool with reliable Supabase defaults
export const createPool = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (connectionString) {
    console.log("Connecting PostgreSQL pool using DATABASE_URL");
    return new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
  }

  const sqlHost = process.env.SQL_HOST || 'db.ikdacyqhpwwxxxjkuicd.supabase.co';
  const sqlUser = process.env.SQL_USER || 'postgres';
  const sqlPassword = process.env.SQL_PASSWORD || '#Akshay0107';
  const sqlDbName = process.env.SQL_DB_NAME || 'postgres';
  const sqlPort = process.env.SQL_PORT ? parseInt(process.env.SQL_PORT) : 5432;
  const isSsl = process.env.SQL_SSL === 'true' || sqlHost.includes('supabase');

  console.log(`Connecting PostgreSQL pool to host: ${sqlHost}:${sqlPort}`);

  return new Pool({
    host: sqlHost,
    port: sqlPort,
    user: sqlUser,
    password: sqlPassword,
    database: sqlDbName,
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
