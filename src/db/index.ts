import * as dotenv from 'dotenv';
try {
  dotenv.config();
  dotenv.config({ path: '.env.local' });
} catch (e) {}

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Function to create a new PostgreSQL connection pool securely from environment variables
export const createPool = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (connectionString) {
    console.log("Connecting PostgreSQL pool using connection string");
    return new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
  }

  // SECURITY: All credentials MUST come from environment variables — no hardcoded fallbacks
  const sqlHost = process.env.SQL_HOST;
  const sqlUser = process.env.SQL_USER;
  const sqlPassword = process.env.SQL_PASSWORD;
  const sqlDbName = process.env.SQL_DB_NAME || 'postgres';
  const sqlPort = process.env.SQL_PORT ? parseInt(process.env.SQL_PORT) : 6543;
  const isSsl = process.env.SQL_SSL !== 'false';

  if (!sqlHost || !sqlUser || !sqlPassword) {
    throw new Error(
      'Missing required database environment variables (SQL_HOST, SQL_USER, SQL_PASSWORD). ' +
      'Set them in your .env file or Vercel Environment Variables.'
    );
  }

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
