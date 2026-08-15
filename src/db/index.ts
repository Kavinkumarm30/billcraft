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

  // Enterprise-grade pool configuration
  const poolConfig = {
    max: parseInt(process.env.DB_POOL_MAX || '20'),           // Max connections (match Supabase pooler limit)
    min: parseInt(process.env.DB_POOL_MIN || '2'),            // Keep 2 warm connections
    idleTimeoutMillis: 30000,                                  // Release idle connections after 30s
    connectionTimeoutMillis: 5000,                             // Fail fast if pool exhausted (not 15s)
    statement_timeout: 10000,                                  // Kill queries stuck >10s
    ssl: { rejectUnauthorized: false } as any,
  };

  if (connectionString) {
    console.log("Connecting PostgreSQL pool using connection string");
    return new Pool({
      connectionString,
      ...poolConfig,
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

  console.log(`Connecting PostgreSQL pool to host: ${sqlHost}:${sqlPort} (max: ${poolConfig.max}, min: ${poolConfig.min})`);

  return new Pool({
    host: sqlHost,
    port: sqlPort,
    user: sqlUser,
    password: sqlPassword,
    database: sqlDbName,
    ...poolConfig,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
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

// Export pool for health checks
export { pool };

// Auto-ensure database schema columns and indexes on startup
(async () => {
  try {
    await pool.query(`
      -- Schema migrations
      ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS dedicated_api_key TEXT;

      -- Performance indexes for enterprise-scale queries
      CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
      CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
      CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
      CREATE INDEX IF NOT EXISTS idx_invoices_org_date ON invoices(org_id, date);
      CREATE INDEX IF NOT EXISTS idx_customers_org_id ON customers(org_id);
      CREATE INDEX IF NOT EXISTS idx_customers_org_name ON customers(org_id, name);
      CREATE INDEX IF NOT EXISTS idx_company_settings_org_id ON company_settings(org_id);
      CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_org_id ON payments(org_id);
      CREATE INDEX IF NOT EXISTS idx_custom_layout_requests_org_id ON custom_layout_requests(org_id);
      CREATE INDEX IF NOT EXISTS idx_custom_layout_requests_status ON custom_layout_requests(status);
    `);
    console.log('✅ Database schema migrations and indexes applied successfully');
  } catch (err: any) {
    console.warn('Auto-migration warning:', err.message || err);
  }
})();
