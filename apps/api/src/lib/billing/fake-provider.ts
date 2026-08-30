import { createHmac, timingSafeEqual } from "node:crypto";
import type { BillingProvider, BillingWebhookEvent } from "./provider";

export const FAKE_SIGNATURE_HEADER = "x-sigillus-signature";

export function signFakeWebhook(secret: string, rawBody: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function createFakeBillingProvider(secret: string): BillingProvider {
  return {
    name: "fake",
    async createCheckout(request) {
      return {
        providerRef: `fake_${request.subscriptionId}`,
        checkoutUrl: null,
      };
    },
    async cancelSubscription() {},
    async verifyWebhook(rawBody, headers) {
      const provided = headers.get(FAKE_SIGNATURE_HEADER);
      if (!provided) {
        return null;
      }
      const expected = signFakeWebhook(secret, rawBody);
      const a = Buffer.from(provided);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return null;
      }
      let parsed: {
        type?: string;
        externalId?: string;
        providerRef?: string;
        occurredAt?: string;
        reason?: string;
      };
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        return null;
      }
      if (!parsed.type || !parsed.externalId || !parsed.providerRef) {
        return null;
      }
      const occurredAt = parsed.occurredAt ? new Date(parsed.occurredAt) : new Date();
      switch (parsed.type) {
        case "payment_confirmed":
        case "renewed":
        case "canceled":
          return {
            type: parsed.type,
            externalId: parsed.externalId,
            providerRef: parsed.providerRef,
            occurredAt,
          } satisfies BillingWebhookEvent;
        case "payment_failed":
          return {
            type: "payment_failed",
            externalId: parsed.externalId,
            providerRef: parsed.providerRef,
            occurredAt,
            reason: parsed.reason,
          };
        default:
          return null;
      }
    },
  };
}
