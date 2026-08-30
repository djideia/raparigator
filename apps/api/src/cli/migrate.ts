import { runMigrations } from "../db/migrate";
import { getLogger } from "../lib/logger";

runMigrations()
  .then(() => {
    getLogger().info("migrations aplicadas");
    process.exit(0);
  })
  .catch((error) => {
    getLogger().error({ err: error }, "falha ao aplicar migrations");
    process.exit(1);
  });
