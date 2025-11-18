// Database connection - dual mode: SQLite (dev) / PostgreSQL (production)
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import pg from 'pg';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Determine if we're in production (Railway) or local development
const isProduction = process.env.NODE_ENV === 'production';

// Railway provides DATABASE_PUBLIC_URL, fallback to DATABASE_URL for other platforms
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or DATABASE_PUBLIC_URL must be set. Did you forget to provision a database?",
  );
}

// Choose database based on environment
let db: any;
let pool: any = null;

// Production: Use PostgreSQL
if (isProduction || databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  console.log('🔵 Using PostgreSQL database (production)');
  console.log(`   Connection: ${databaseUrl.substring(0, 30)}...`);

  // Railway and other cloud platforms require SSL
  const useSSL = isProduction || databaseUrl.includes('railway') || databaseUrl.includes('neon') || databaseUrl.includes('supabase');

  pool = new Pool({
    connectionString: databaseUrl,
    ssl: useSSL ? { rejectUnauthorized: false } : false
  });

  db = drizzlePg(pool, { schema });
}
// Development: Use SQLite
else {
  console.log('🟢 Using SQLite database (local development)');

  // Extract path from file:// URL
  const dbPath = databaseUrl.replace('file:', '');
  const sqlite = new Database(dbPath);

  db = drizzleSqlite(sqlite, { schema });
}

export { db, pool };
