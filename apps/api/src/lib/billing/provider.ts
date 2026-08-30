import type { PremiumBillingCycle } from "@sigillus/contracts";

export type CheckoutRequest = {
  subscriptionId: string;
  userId: string;
  email: string;
  cycle: PremiumBillingCycle;
  amount: number;
  currency: "BRL";
};

export type CheckoutResult = {
  providerRef: string;
  checkoutUrl: string | null;
};

export type BillingWebhookEvent =
  | { type: "payment_confirmed"; externalId: string; providerRef: string; occurredAt: Date }
  | {
      type: "payment_failed";
      externalId: string;
      providerRef: string;
      occurredAt: Date;
      reason?: string;
    }
  | { type: "renewed"; externalId: string; providerRef: string; occurredAt: Date }
  | { type: "canceled"; externalId: string; providerRef: string; occurredAt: Date };

export interface BillingProvider {
  readonly name: string;
  createCheckout(request: CheckoutRequest): Promise<CheckoutResult>;
  cancelSubscription(providerRef: string): Promise<void>;
  verifyWebhook(rawBody: string, headers: Headers): Promise<BillingWebhookEvent | null>;
}
