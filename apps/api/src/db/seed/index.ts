import { getConfig } from "../../config";
import { createDatabase } from "../client";
import { seedCatalogs } from "./catalogs";
import { seedDevData } from "./dev-data";
import { seedDevUsers } from "./users";

export async function runSeeds(options: { devData?: boolean } = {}) {
  const config = getConfig();
  const { db, pool } = createDatabase({ DATABASE_URL: config.DATABASE_URL, DATABASE_POOL_MAX: 2 });
  try {
    await seedCatalogs(db);
    if (options.devData ?? !config.isProduction) {
      await seedDevUsers(db);
      await seedDevData(db);
    }
  } finally {
    await pool.end();
  }
}
