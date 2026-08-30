import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { webhookDeliveries } from "../../db/schema";
import type { BillingProvider, BillingWebhookEvent } from "../../lib/billing/provider";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { PremiumService } from "./service";

export type BillingJobsDeps = {
  db: Database;
  premium: PremiumService;
  billing: BillingProvider;
  jobs: JobQueue;
  logger: Logger;
};

export type StoredWebhookEvent = {
  type: BillingWebhookEvent["type"];
  externalId: string;
  providerRef: string;
  occurredAt: string;
  reason?: string;
};

export type WebhookDeliveryPayload = {
  event: StoredWebhookEvent;
  body: unknown;
};

export function toStoredWebhookEvent(event: BillingWebhookEvent): StoredWebhookEvent {
  return {
    type: event.type,
    externalId: event.externalId,
    providerRef: event.providerRef,
    occurredAt: event.occurredAt.toISOString(),
    ...(event.type === "payment_failed" && event.reason ? { reason: event.reason } : {}),
  };
}

function readStoredEvent(payload: Record<string, unknown>): StoredWebhookEvent | null {
  const event = payload.event as Partial<StoredWebhookEvent> | undefined;
  if (!event || !event.type || !event.externalId || !event.providerRef || !event.occurredAt) {
    return null;
  }
  return event as StoredWebhookEvent;
}

export async function registerBillingJobs(deps: BillingJobsDeps) {
  const { db, premium, jobs, logger } = deps;

  await jobs.work("billing.webhook", async ({ deliveryId }) => {
    const [delivery] = await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.id, deliveryId))
      .limit(1);
    if (!delivery) {
      logger.warn({ deliveryId }, "webhook delivery não encontrada");
      return;
    }
    if (delivery.processedAt) {
      return;
    }
    const markError = (error: string) =>
      db
        .update(webhookDeliveries)
        .set({ error, processedAt: new Date() })
        .where(eq(webhookDeliveries.id, deliveryId));

    const event = readStoredEvent(delivery.payload);
    if (!event) {
      await markError("payload_invalido");
      logger.warn({ deliveryId }, "webhook delivery com payload inválido");
      return;
    }
    const subscription = await premium.findByProviderRef(delivery.provider, event.providerRef);
    if (!subscription) {
      await markError("assinatura_nao_encontrada");
      logger.warn({ deliveryId, provider: delivery.provider }, "webhook sem assinatura");
      return;
    }
    try {
      await premium.applyEvent(subscription.id, {
        type: event.type,
        idempotencyKey: `${delivery.provider}:${event.externalId}`,
        payload: event.reason ? { reason: event.reason } : {},
        occurredAt: new Date(event.occurredAt),
      });
      await db
        .update(webhookDeliveries)
        .set({ processedAt: new Date(), error: null })
        .where(eq(webhookDeliveries.id, deliveryId));
    } catch (error) {
      await db
        .update(webhookDeliveries)
        .set({ error: error instanceof Error ? error.message : String(error) })
        .where(eq(webhookDeliveries.id, deliveryId));
      throw error;
    }
  });
}
