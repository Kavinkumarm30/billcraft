import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME || "postgres";
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;
const port = process.env.SQL_PORT ? parseInt(process.env.SQL_PORT) : 5432;
const isSsl = process.env.SQL_SSL === 'true' || sqlHost?.includes('supabase');

if (!sqlHost) {
  throw new Error("SQL_HOST must be set in environment variables.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: sqlHost,
    port: port,
    user: user!,
    password: password!,
    database: sqlDbName,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
  },
  verbose: true,
});
