// Database connection - PostgreSQL only
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Railway provides DATABASE_PUBLIC_URL, fallback to DATABASE_URL for other platforms
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or DATABASE_PUBLIC_URL must be set. Did you forget to provision a database?",
  );
}

// Validate it's a PostgreSQL connection string
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error(
    `Invalid DATABASE_URL: must be a PostgreSQL connection string (postgresql://...)\nReceived: ${databaseUrl.substring(0, 30)}...`,
  );
}

console.log('🔵 Using PostgreSQL database');
console.log(`   Connection: ${databaseUrl.substring(0, 30)}...`);

// Determine if we're in production (Railway) or local development
const isProduction = process.env.NODE_ENV === 'production';

// Railway and other cloud platforms require SSL
const useSSL = isProduction || databaseUrl.includes('railway') || databaseUrl.includes('neon') || databaseUrl.includes('supabase');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSSL ? { rejectUnauthorized: false } : false
});

const db = drizzle(pool, { schema });

export { db, pool };
