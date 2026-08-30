import type { AppConfig } from "./config";
import type { Database } from "./db/client";
import type { AdminAuth, UserAuth } from "./lib/auth";
import type { BillingProvider } from "./lib/billing/provider";
import type { JobQueue } from "./lib/jobs";
import type { Logger } from "./lib/logger";
import type { RateLimiter } from "./lib/rate-limit";
import type { Services } from "./services";

export type AppDeps = {
  config: AppConfig;
  db: Database;
  logger: Logger;
  auth: UserAuth;
  adminAuth: AdminAuth;
  rateLimiter: RateLimiter;
  billing: BillingProvider;
  jobs: JobQueue;
  services: Services;
  ready: () => boolean;
};
