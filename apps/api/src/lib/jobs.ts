import { PgBoss } from "pg-boss";
import type { Logger } from "./logger";

export type JobPayloads = {
  "media.process": { assetId: string };
  "media.moderate": { assetId: string };
  "review-invite.expire": { inviteId: string };
  "billing.webhook": { deliveryId: string };
  "premium.expire": Record<string, never>;
};

export type JobName = keyof JobPayloads;

export type JobHandler<TName extends JobName> = (payload: JobPayloads[TName]) => Promise<void>;

export interface JobQueue {
  schedule(name: JobName, cron: string): Promise<void>;
  enqueue<TName extends JobName>(
    name: TName,
    payload: JobPayloads[TName],
    options?: { startAfter?: Date; singletonKey?: string },
  ): Promise<void>;
  work<TName extends JobName>(name: TName, handler: JobHandler<TName>): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createPgBossQueue(databaseUrl: string, logger: Logger): JobQueue {
  const boss = new PgBoss({ connectionString: databaseUrl, schema: "pgboss" });
  boss.on("error", (error) => logger.error({ err: error }, "pg-boss"));
  let started = false;

  return {
    async start() {
      if (!started) {
        await boss.start();
        started = true;
      }
    },
    async stop() {
      if (started) {
        await boss.stop({ graceful: true });
        started = false;
      }
    },
    async schedule(name, cron) {
      await boss.createQueue(name).catch(() => undefined);
      await boss.schedule(name, cron, {}, { retryLimit: 1 });
    },
    async enqueue(name, payload, options) {
      await boss.createQueue(name).catch(() => undefined);
      await boss.send(name, payload, {
        retryLimit: 5,
        retryDelay: 30,
        retryBackoff: true,
        ...(options?.startAfter ? { startAfter: options.startAfter } : {}),
        ...(options?.singletonKey ? { singletonKey: options.singletonKey } : {}),
      });
    },
    async work(name, handler) {
      await boss.createQueue(name).catch(() => undefined);
      await boss.work(name, async (jobs) => {
        for (const job of jobs) {
          await handler(job.data as never);
        }
      });
    },
  };
}

export function createInlineQueue(logger?: Logger): JobQueue & {
  enqueued: Array<{ name: JobName; payload: unknown }>;
} {
  const handlers = new Map<JobName, JobHandler<JobName>>();
  const enqueued: Array<{ name: JobName; payload: unknown }> = [];
  return {
    enqueued,
    async schedule() {},
    async start() {},
    async stop() {},
    async enqueue(name, payload) {
      enqueued.push({ name, payload });
      const handler = handlers.get(name);
      if (handler) {
        try {
          await handler(payload as never);
        } catch (error) {
          logger?.error({ err: error, job: name }, "job inline falhou");
        }
      }
    },
    async work(name, handler) {
      handlers.set(name, handler as JobHandler<JobName>);
    },
  };
}
