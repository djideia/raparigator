import { serve } from "@hono/node-server";
import { getConfig } from "./config";
import { createApp } from "./app";
import { createDatabase } from "./db/client";
import { runMigrations } from "./db/migrate";
import { runSeeds } from "./db/seed";
import { createAdminAuth, createUserAuth } from "./lib/auth";
import { getLogger } from "./lib/logger";
import { MemoryRateLimiter, NoopRateLimiter } from "./lib/rate-limit";
import { initSentry } from "./lib/sentry";
import { createFakeBillingProvider } from "./lib/billing/fake-provider";
import { createPgNotifyChatEventBus } from "./lib/chat-events";
import { createInlineQueue, createPgBossQueue } from "./lib/jobs";
import { createS3Storage } from "./lib/storage";
import { registerMediaJobs } from "./modules/media/jobs";
import { registerBillingJobs } from "./modules/premium/jobs";
import { registerReviewJobs } from "./modules/reviews/service";
import { createServices } from "./services";
import type { AppDeps } from "./deps";

async function main() {
  const config = getConfig();
  const logger = getLogger();
  initSentry(config);

  if (config.MIGRATE_ON_BOOT) {
    await runMigrations();
    logger.info("migrations aplicadas no boot");
  }
  if (config.SEED_ON_BOOT) {
    await runSeeds();
    logger.info("seeds aplicadas no boot");
  }

  const { db, pool } = createDatabase(config);
  let ready = false;

  const storage = createS3Storage(config);
  const jobs = config.JOBS_ENABLED
    ? createPgBossQueue(config.DATABASE_URL, logger)
    : createInlineQueue(logger);
  const chatEvents = createPgNotifyChatEventBus(config.DATABASE_URL, logger);
  const billing = createFakeBillingProvider(config.BILLING_WEBHOOK_SECRET);
  await jobs.start();
  await chatEvents.start();

  const deps: AppDeps = {
    config,
    db,
    logger,
    auth: createUserAuth(db, config),
    adminAuth: createAdminAuth(db, config),
    rateLimiter: config.RATE_LIMIT_ENABLED ? new MemoryRateLimiter() : new NoopRateLimiter(),
    billing,
    jobs,
    services: createServices({ config, db, logger, storage, jobs, chatEvents, billing }),
    ready: () => ready,
  };

  await registerMediaJobs({ db, storage, jobs, logger });
  await registerReviewJobs({ jobs, logger });
  await registerBillingJobs({ db, premium: deps.services.premium, billing, jobs, logger });
  await jobs.work("premium.expire", async () => {
    await deps.services.premium.expireDueSubscriptions();
  });
  await jobs.schedule("premium.expire", "0 * * * *");

  const app = createApp(deps);
  const server = serve({ fetch: app.fetch, port: config.PORT, hostname: config.HOST }, (info) => {
    ready = true;
    logger.info({ port: info.port, host: config.HOST, env: config.NODE_ENV }, "API no ar");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "encerrando");
    ready = false;
    server.close();
    await chatEvents.stop();
    await jobs.stop();
    await pool.end();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  getLogger().fatal({ err: error }, "falha ao subir a API");
  process.exit(1);
});
