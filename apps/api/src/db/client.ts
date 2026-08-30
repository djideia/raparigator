import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { AppConfig } from "../config";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>["db"];

export function createDatabase(config: Pick<AppConfig, "DATABASE_URL" | "DATABASE_POOL_MAX">) {
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    max: config.DATABASE_POOL_MAX,
  });
  const db = drizzle({ client: pool, schema, casing: "snake_case" });
  return { db, pool };
}
