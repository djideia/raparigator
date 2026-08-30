import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import path from "node:path";
import { Client } from "pg";
import { createDatabase, type Database } from "../../src/db/client";

const TEST_DB_NAME = process.env.TEST_DB_NAME ?? "sigillus_test";

function adminUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.pathname = "/postgres";
  return url.toString();
}

export function testDatabaseUrl() {
  const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!base) {
    throw new Error("Defina DATABASE_URL ou TEST_DATABASE_URL para os testes de integração.");
  }
  const url = new URL(base);
  url.pathname = `/${TEST_DB_NAME}`;
  return url.toString();
}

export async function ensureTestDatabase() {
  const target = testDatabaseUrl();
  const client = new Client({ connectionString: adminUrl(target) });
  await client.connect();
  try {
    const { rows } = await client.query("select 1 from pg_database where datname = $1", [
      TEST_DB_NAME,
    ]);
    if (rows.length === 0) {
      await client.query(`create database ${TEST_DB_NAME}`);
    }
  } finally {
    await client.end();
  }
  const { db, pool } = createDatabase({ DATABASE_URL: target, DATABASE_POOL_MAX: 1 });
  try {
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
  } finally {
    await pool.end();
  }
  return target;
}

export async function truncateAll(db: Database) {
  await db.execute(sql`
    do $$ declare r record;
    begin
      for r in (
        select tablename from pg_tables
        where schemaname = 'public' and tablename not like '__drizzle%'
      ) loop
        execute 'truncate table ' || quote_ident(r.tablename) || ' cascade';
      end loop;
    end $$;
  `);
}
