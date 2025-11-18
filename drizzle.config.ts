import { defineConfig } from "drizzle-kit";

// Railway provides DATABASE_PUBLIC_URL, fallback to DATABASE_URL for other platforms
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DATABASE_PUBLIC_URL must be set. Ensure the database is provisioned");
}

// Validate it's a PostgreSQL connection string
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error(
    `Invalid DATABASE_URL: must be a PostgreSQL connection string (postgresql://...)\nReceived: ${databaseUrl.substring(0, 30)}...`
  );
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl
  },
});
