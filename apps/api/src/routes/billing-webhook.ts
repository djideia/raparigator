import { Hono } from "hono";
import type { Database } from "../db/client";
import { webhookDeliveries } from "../db/schema";
import type { BillingProvider } from "../lib/billing/provider";
import { newId } from "../lib/ids";
import type { JobQueue } from "../lib/jobs";
import type { Logger } from "../lib/logger";
import { toStoredWebhookEvent, type WebhookDeliveryPayload } from "../modules/premium/jobs";

export type BillingWebhookRouteDeps = {
  db: Database;
  billing: BillingProvider;
  jobs: JobQueue;
  logger: Logger;
};

export const BILLING_WEBHOOK_PATH = "/api/billing/webhook";

function parseBody(rawBody: string): unknown {
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return rawBody;
  }
}

export function createBillingWebhookRoute(deps: BillingWebhookRouteDeps) {
  const { db, billing, jobs, logger } = deps;
  const app = new Hono();

  app.post(BILLING_WEBHOOK_PATH, async (c) => {
    const rawBody = await c.req.text();
    const event = await billing.verifyWebhook(rawBody, c.req.raw.headers);
    if (!event) {
      logger.warn({ provider: billing.name }, "webhook de billing rejeitado");
      return c.json({ error: "invalid_signature" }, 401);
    }
    const payload: WebhookDeliveryPayload = {
      event: toStoredWebhookEvent(event),
      body: parseBody(rawBody),
    };
    const deliveryId = newId();
    const inserted = await db
      .insert(webhookDeliveries)
      .values({
        id: deliveryId,
        provider: billing.name,
        externalId: event.externalId,
        payload,
      })
      .onConflictDoNothing({
        target: [webhookDeliveries.provider, webhookDeliveries.externalId],
      })
      .returning({ id: webhookDeliveries.id });
    if (inserted.length === 0) {
      logger.info({ provider: billing.name }, "webhook de billing duplicado");
      return c.json({ duplicate: true }, 200);
    }
    await jobs.enqueue("billing.webhook", { deliveryId });
    logger.info({ provider: billing.name, deliveryId, type: event.type }, "webhook enfileirado");
    return c.json({ accepted: true, deliveryId }, 202);
  });

  return app;
}
