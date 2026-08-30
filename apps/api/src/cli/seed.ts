import { runSeeds } from "../db/seed";
import { getLogger } from "../lib/logger";

runSeeds()
  .then(() => {
    getLogger().info("seeds aplicadas");
    process.exit(0);
  })
  .catch((error) => {
    getLogger().error({ err: error }, "falha ao aplicar seeds");
    process.exit(1);
  });
