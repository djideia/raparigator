import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { getConfig } from "../config";
import { createDatabase } from "./client";

export async function runMigrations(databaseUrl?: string) {
  const config = getConfig();
  const { db, pool } = createDatabase({
    DATABASE_URL: databaseUrl ?? config.DATABASE_URL,
    DATABASE_POOL_MAX: 1,
  });
  const migrationsFolder = process.env.MIGRATIONS_DIR ?? path.resolve(process.cwd(), "drizzle");
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }
}
