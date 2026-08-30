import { afterAll, beforeAll, beforeEach } from "vitest";
import { createApp } from "../../src/app";
import { loadConfig, type AppConfig } from "../../src/config";
import { createDatabase, type Database } from "../../src/db/client";
import { seedCatalogs } from "../../src/db/seed/catalogs";
import { createAdminAuth, createUserAuth } from "../../src/lib/auth";
import { createLogger } from "../../src/lib/logger";
import { MemoryRateLimiter } from "../../src/lib/rate-limit";
import { createFakeBillingProvider } from "../../src/lib/billing/fake-provider";
import { createMemoryChatEventBus } from "../../src/lib/chat-events";
import { createInlineQueue } from "../../src/lib/jobs";
import { createMemoryStorage } from "../../src/lib/storage";
import { createServices } from "../../src/services";
import type { AppDeps } from "../../src/deps";
import { ensureTestDatabase, truncateAll } from "./db";

export type TestHarness = {
  deps: AppDeps;
  db: Database;
  config: AppConfig;
  storage: ReturnType<typeof createMemoryStorage>;
  jobs: ReturnType<typeof createInlineQueue>;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
  rpc: <T>(
    path: string,
    input?: unknown,
    headers?: Record<string, string>,
  ) => Promise<{
    status: number;
    body: T;
    headers: Headers;
  }>;
};

export function createTestHarness(): TestHarness {
  const harness = {} as TestHarness;
  let pool: { end(): Promise<void> } | null = null;

  beforeAll(async () => {
    const databaseUrl = await ensureTestDatabase();
    const config = loadConfig({ ...process.env, DATABASE_URL: databaseUrl, NODE_ENV: "test" });
    const database = createDatabase(config);
    pool = database.pool;
    const logger = createLogger({ level: "fatal", pretty: false });
    const storage = createMemoryStorage();
    const jobs = createInlineQueue(logger);
    const deps: AppDeps = {
      config,
      db: database.db,
      logger,
      auth: createUserAuth(database.db, config),
      adminAuth: createAdminAuth(database.db, config),
      rateLimiter: new MemoryRateLimiter(),
      billing: createFakeBillingProvider(config.BILLING_WEBHOOK_SECRET),
      jobs,
      services: createServices({
        config,
        db: database.db,
        logger,
        storage,
        jobs,
        chatEvents: createMemoryChatEventBus(),
        billing: createFakeBillingProvider(config.BILLING_WEBHOOK_SECRET),
      }),
      ready: () => true,
    };
    const app = createApp(deps);
    harness.deps = deps;
    harness.db = database.db;
    harness.config = config;
    harness.storage = storage;
    harness.jobs = jobs;
    harness.fetch = async (input, init) =>
      app.request(new Request(new URL(input, config.API_ORIGIN), init));
    harness.rpc = async (path, input, headers) => {
      const response = await harness.fetch(`/rpc/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify({ json: input ?? {} }),
      });
      const text = await response.text();
      const parsed = text ? (JSON.parse(text) as { json?: unknown }) : {};
      const body = parsed && typeof parsed === "object" && "json" in parsed ? parsed.json : parsed;
      return {
        status: response.status,
        body: body as never,
        headers: response.headers,
      };
    };
  });

  beforeEach(async () => {
    await truncateAll(harness.db);
    await seedCatalogs(harness.db);
  });

  afterAll(async () => {
    await pool?.end();
  });

  return harness;
}
