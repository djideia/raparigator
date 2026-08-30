import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { addBillingCycle } from "@sigillus/domain";
import { professionalProfiles, subscriptionEvents, webhookDeliveries } from "../src/db/schema";
import { createFakeBillingProvider, signFakeWebhook } from "../src/lib/billing/fake-provider";
import { registerBillingJobs } from "../src/modules/premium/jobs";
import { createPremiumService, type PremiumService } from "../src/modules/premium/service";
import { createBillingWebhookRoute } from "../src/routes/billing-webhook";
import { createTestHarness } from "./helpers/app";
import { signUp } from "./helpers/auth";

const harness = createTestHarness();

type Setup = {
  premium: PremiumService;
  webhook: (body: Record<string, unknown>, signature?: string) => Promise<Response>;
  userId: string;
  email: string;
  profileId: string;
};

async function setup(): Promise<Setup> {
  const billing = createFakeBillingProvider(harness.config.BILLING_WEBHOOK_SECRET);
  const premium = createPremiumService({
    db: harness.db,
    billing,
    config: harness.config,
    jobs: harness.jobs,
    logger: harness.deps.logger,
  });
  await registerBillingJobs({
    db: harness.db,
    premium,
    billing,
    jobs: harness.jobs,
    logger: harness.deps.logger,
  });
  const route = createBillingWebhookRoute({
    db: harness.db,
    billing,
    jobs: harness.jobs,
    logger: harness.deps.logger,
  });
  const pro = await signUp(harness, { email: "premium@teste.dev", role: "profissional" });
  const profile = await harness.deps.services.profiles.insert({
    id: "profile-premium",
    userId: pro.userId,
    slug: "premium-teste",
    artisticName: "Premium Teste",
  });
  return {
    premium,
    userId: pro.userId,
    email: pro.email,
    profileId: profile.id,
    webhook: async (body, signature) => {
      const raw = JSON.stringify(body);
      return route.request("/api/billing/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-sigillus-signature":
            signature ?? signFakeWebhook(harness.config.BILLING_WEBHOOK_SECRET, raw),
        },
        body: raw,
      });
    },
  };
}

async function adTierOf(profileId: string) {
  const [row] = await harness.db
    .select({ adTier: professionalProfiles.adTier })
    .from(professionalProfiles)
    .where(eq(professionalProfiles.id, profileId));
  return row?.adTier;
}

async function eventCount(subscriptionId: string) {
  const rows = await harness.db
    .select({ id: subscriptionEvents.id })
    .from(subscriptionEvents)
    .where(eq(subscriptionEvents.subscriptionId, subscriptionId));
  return rows.length;
}

describe("premium / billing", () => {
  it("lista planos e estado inicial standard", async () => {
    const { premium, userId } = await setup();
    expect(premium.plans().map((plan) => plan.cycle)).toEqual(["monthly", "semiannual"]);
    const state = await premium.getState(userId);
    expect(state.plan).toBe("standard");
    expect(state.subscription).toBeNull();
    expect(state.limits.photoLimit).toBe(10);
  });

  it("startSubscription cria pending e bloqueia segunda em andamento", async () => {
    const { premium, userId, email } = await setup();
    const result = await premium.startSubscription({ id: userId, email }, { cycle: "monthly" });
    expect(result.subscription.status).toBe("pending_payment");
    expect(result.subscription.provider).toBe("fake");
    expect(result.checkoutUrl).toBeNull();
    expect(await eventCount(result.subscription.id)).toBe(1);
    const state = await premium.getState(userId);
    expect(state.plan).toBe("standard");
    expect(state.subscription?.status).toBe("pending_payment");
    await expect(
      premium.startSubscription({ id: userId, email }, { cycle: "semiannual" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("confirmar pagamento ativa e sincroniza ad_tier premium", async () => {
    const { premium, userId, email, profileId } = await setup();
    expect(await adTierOf(profileId)).toBe("normal");
    const { subscription } = await premium.startSubscription(
      { id: userId, email },
      { cycle: "monthly" },
    );
    const confirmed = await premium.confirmFakePayment(subscription.id);
    expect(confirmed.status).toBe("active");
    expect(confirmed.currentPeriodStart).not.toBeNull();
    expect(new Date(confirmed.currentPeriodEnd!)).toEqual(
      addBillingCycle(new Date(confirmed.currentPeriodStart!), "monthly"),
    );
    expect(await adTierOf(profileId)).toBe("premium");
    const state = await premium.getState(userId);
    expect(state.plan).toBe("premium");
    expect(state.limits.photoLimit).toBe(100);
  });

  it("mesmo idempotencyKey duas vezes não gera dois eventos nem muda estado", async () => {
    const { premium, userId, email } = await setup();
    const { subscription } = await premium.startSubscription(
      { id: userId, email },
      { cycle: "monthly" },
    );
    const first = await premium.applyEvent(subscription.id, {
      type: "payment_confirmed",
      idempotencyKey: "fake:evt-1",
    });
    const second = await premium.applyEvent(subscription.id, {
      type: "payment_failed",
      idempotencyKey: "fake:evt-1",
    });
    expect(second).toEqual(first);
    expect(second.status).toBe("active");
    expect(await eventCount(subscription.id)).toBe(2);
  });

  it("webhook válido é processado; duplicado responde duplicate e não reprocessa", async () => {
    const { premium, userId, email, webhook, profileId } = await setup();
    const { subscription } = await premium.startSubscription(
      { id: userId, email },
      { cycle: "monthly" },
    );
    const body = {
      type: "payment_confirmed",
      externalId: "evt-100",
      providerRef: `fake_${subscription.id}`,
      occurredAt: new Date().toISOString(),
    };
    const first = await webhook(body);
    expect(first.status).toBe(202);
    expect(await adTierOf(profileId)).toBe("premium");
    const deliveries = await harness.db.select().from(webhookDeliveries);
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.processedAt).not.toBeNull();
    expect(deliveries[0]?.error).toBeNull();
    const enqueuedBefore = harness.jobs.enqueued.length;

    const duplicate = await webhook(body);
    expect(duplicate.status).toBe(200);
    expect(await duplicate.json()).toEqual({ duplicate: true });
    expect(harness.jobs.enqueued.length).toBe(enqueuedBefore);
    expect(await eventCount(subscription.id)).toBe(2);
  });

  it("webhook com HMAC errado responde 401 e não grava delivery", async () => {
    const { webhook } = await setup();
    const response = await webhook(
      { type: "payment_confirmed", externalId: "evt-x", providerRef: "fake_nada" },
      "deadbeef",
    );
    expect(response.status).toBe(401);
    expect(await harness.db.select().from(webhookDeliveries)).toHaveLength(0);
  });

  it("webhook sem assinatura de header responde 401", async () => {
    const { webhook } = await setup();
    const response = await webhook(
      { type: "payment_confirmed", externalId: "evt-y", providerRef: "fake_nada" },
      "",
    );
    expect(response.status).toBe(401);
  });

  it("cancel_requested mantém premium até o fim do período", async () => {
    const { premium, userId, email, profileId } = await setup();
    const { subscription } = await premium.startSubscription(
      { id: userId, email },
      { cycle: "semiannual" },
    );
    await premium.confirmFakePayment(subscription.id);
    const state = await premium.cancelSubscription(userId);
    expect(state.plan).toBe("premium");
    expect(state.subscription?.status).toBe("active");
    expect(state.subscription?.cancelAtPeriodEnd).toBe(true);
    expect(await adTierOf(profileId)).toBe("premium");
    const again = await premium.cancelSubscription(userId);
    expect(again.subscription?.cancelAtPeriodEnd).toBe(true);
    await expect(
      premium.startSubscription({ id: userId, email }, { cycle: "monthly" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("cancelar sem assinatura ativa é CONFLICT", async () => {
    const { premium, userId } = await setup();
    await expect(premium.cancelSubscription(userId)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("expireDueSubscriptions expira vencidas e volta ad_tier para normal", async () => {
    const { premium, userId, email, profileId } = await setup();
    const { subscription } = await premium.startSubscription(
      { id: userId, email },
      { cycle: "monthly" },
    );
    const paidAt = new Date();
    await premium.applyEvent(subscription.id, {
      type: "payment_confirmed",
      idempotencyKey: "fake:paid",
      occurredAt: paidAt,
    });
    expect(await adTierOf(profileId)).toBe("premium");
    const day = 24 * 60 * 60 * 1000;
    const before = await premium.expireDueSubscriptions(new Date(paidAt.getTime() + 10 * day));
    expect(before).toBe(0);
    const expired = await premium.expireDueSubscriptions(new Date(paidAt.getTime() + 40 * day));
    expect(expired).toBe(1);
    expect(await adTierOf(profileId)).toBe("normal");
    const state = await premium.getState(userId);
    expect(state.plan).toBe("standard");
    expect(state.subscription?.status).toBe("expired");
    const again = await premium.expireDueSubscriptions(new Date(paidAt.getTime() + 41 * day));
    expect(again).toBe(0);
    const restarted = await premium.startSubscription({ id: userId, email }, { cycle: "monthly" });
    expect(restarted.subscription.status).toBe("pending_payment");
  });

  it("renewed via webhook estende o período a partir do fim anterior", async () => {
    const { premium, userId, email, webhook } = await setup();
    const { subscription } = await premium.startSubscription(
      { id: userId, email },
      { cycle: "monthly" },
    );
    const paidAt = new Date();
    await premium.applyEvent(subscription.id, {
      type: "payment_confirmed",
      idempotencyKey: "fake:paid",
      occurredAt: paidAt,
    });
    const firstEnd = addBillingCycle(paidAt, "monthly");
    const response = await webhook({
      type: "renewed",
      externalId: "evt-renew",
      providerRef: `fake_${subscription.id}`,
      occurredAt: new Date(firstEnd.getTime() - 60_000).toISOString(),
    });
    expect(response.status).toBe(202);
    const state = await premium.getState(userId);
    expect(state.subscription?.status).toBe("active");
    expect(state.subscription?.currentPeriodStart).toBe(firstEnd.toISOString());
    expect(state.subscription?.currentPeriodEnd).toBe(
      addBillingCycle(firstEnd, "monthly").toISOString(),
    );
  });

  it("webhook para providerRef desconhecido marca erro sem quebrar", async () => {
    const { webhook } = await setup();
    const response = await webhook({
      type: "payment_confirmed",
      externalId: "evt-orfao",
      providerRef: "fake_inexistente",
    });
    expect(response.status).toBe(202);
    const [delivery] = await harness.db.select().from(webhookDeliveries);
    expect(delivery?.error).toBe("assinatura_nao_encontrada");
  });
});
