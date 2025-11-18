import { defineConfig } from "drizzle-kit";

// Railway provides DATABASE_PUBLIC_URL, fallback to DATABASE_URL for other platforms
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DATABASE_PUBLIC_URL must be set. Ensure the database is provisioned");
}

const isProduction = process.env.NODE_ENV === 'production';

// Use PostgreSQL for production, SQLite for local development
const dialect = (isProduction || databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) ? 'postgresql' : 'sqlite';

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: dialect as 'postgresql' | 'sqlite',
  dbCredentials: dialect === 'postgresql'
    ? { url: databaseUrl }
    : { url: databaseUrl.replace('file:', '') },
});
