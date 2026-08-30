import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import type {
  PremiumBillingCycle,
  PremiumPlanOption,
  PremiumState,
  StartSubscriptionOutput,
  Subscription,
  SubscriptionEventType,
} from "@sigillus/contracts";
import { PREMIUM_PLAN_OPTIONS, getPlanLimits, getPlanOption } from "@sigillus/domain";
import type { AppConfig } from "../../config";
import type { Database } from "../../db/client";
import { professionalProfiles, subscriptionEvents, subscriptions } from "../../db/schema";
import type { BillingProvider } from "../../lib/billing/provider";
import { newId } from "../../lib/ids";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import { reduceSubscriptionEvents } from "./reducer";

export type PremiumServiceDeps = {
  db: Database;
  billing: BillingProvider;
  config: AppConfig;
  jobs: JobQueue;
  logger: Logger;
};

export type PremiumService = ReturnType<typeof createPremiumService>;

export type PremiumUser = { id: string; email: string };

export type ApplyEventInput = {
  type: SubscriptionEventType;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
  occurredAt?: Date;
};

type SubscriptionRow = typeof subscriptions.$inferSelect;
type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

const OPEN_STATUSES = ["active", "pending_payment"] as const;

export function toSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    cycle: row.cycle,
    status: row.status,
    currentPeriodStart: row.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    provider: row.provider,
  };
}

export function createPremiumService(deps: PremiumServiceDeps) {
  const { db, billing, config, logger } = deps;

  async function findLatestForUser(userId: string): Promise<SubscriptionRow | null> {
    const [row] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return row ?? null;
  }

  async function findById(id: string): Promise<SubscriptionRow | null> {
    const [row] = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    return row ?? null;
  }

  async function syncAdTier(tx: Tx, userId: string) {
    const [active] = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
      .limit(1);
    await tx
      .update(professionalProfiles)
      .set({ adTier: active ? "premium" : "normal", updatedAt: new Date() })
      .where(eq(professionalProfiles.userId, userId));
  }

  async function applyEvent(subscriptionId: string, input: ApplyEventInput): Promise<Subscription> {
    const now = new Date();
    const occurredAt = input.occurredAt ?? now;
    return db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, subscriptionId))
        .for("update");
      if (!locked) {
        throw new ORPCError("NOT_FOUND", { message: "Assinatura não encontrada." });
      }
      const inserted = await tx
        .insert(subscriptionEvents)
        .values({
          id: newId(),
          subscriptionId,
          type: input.type,
          idempotencyKey: input.idempotencyKey,
          payload: input.payload ?? {},
          occurredAt,
        })
        .onConflictDoNothing({ target: subscriptionEvents.idempotencyKey })
        .returning({ id: subscriptionEvents.id });
      if (inserted.length === 0) {
        logger.debug({ subscriptionId, type: input.type }, "evento de assinatura já aplicado");
        return toSubscription(locked);
      }
      const events = await tx
        .select({
          type: subscriptionEvents.type,
          occurredAt: subscriptionEvents.occurredAt,
          payload: subscriptionEvents.payload,
        })
        .from(subscriptionEvents)
        .where(eq(subscriptionEvents.subscriptionId, subscriptionId))
        .orderBy(asc(subscriptionEvents.occurredAt), asc(subscriptionEvents.createdAt));
      const derived = reduceSubscriptionEvents(events, locked.cycle, now);
      const [updated] = await tx
        .update(subscriptions)
        .set({ ...derived, updatedAt: now })
        .where(eq(subscriptions.id, subscriptionId))
        .returning();
      await syncAdTier(tx, locked.userId);
      logger.info(
        { subscriptionId, type: input.type, status: derived.status },
        "evento de assinatura aplicado",
      );
      return toSubscription(updated ?? locked);
    });
  }

  function stateFrom(subscription: Subscription | null): PremiumState {
    const plan = subscription?.status === "active" ? "premium" : "standard";
    return { plan, limits: getPlanLimits(plan), subscription };
  }

  return {
    applyEvent,
    findById,

    plans(): PremiumPlanOption[] {
      return PREMIUM_PLAN_OPTIONS;
    },

    async getState(userId: string): Promise<PremiumState> {
      const latest = await findLatestForUser(userId);
      return stateFrom(latest ? toSubscription(latest) : null);
    },

    async startSubscription(
      user: PremiumUser,
      input: { cycle: PremiumBillingCycle },
    ): Promise<StartSubscriptionOutput> {
      if (!config.billingEnabled) {
        throw new ORPCError("CONFLICT", { message: "Assinatura indisponível no momento." });
      }
      const [open] = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(
          and(eq(subscriptions.userId, user.id), inArray(subscriptions.status, [...OPEN_STATUSES])),
        )
        .limit(1);
      if (open) {
        throw new ORPCError("CONFLICT", { message: "Já existe uma assinatura em andamento." });
      }
      const subscriptionId = newId();
      await db.insert(subscriptions).values({
        id: subscriptionId,
        userId: user.id,
        provider: billing.name,
        cycle: input.cycle,
        status: "pending_payment",
      });
      await applyEvent(subscriptionId, {
        type: "checkout_created",
        idempotencyKey: `checkout:${subscriptionId}`,
        payload: { cycle: input.cycle },
      });
      const checkout = await billing.createCheckout({
        subscriptionId,
        userId: user.id,
        email: user.email,
        cycle: input.cycle,
        amount: getPlanOption(input.cycle).price,
        currency: "BRL",
      });
      const [updated] = await db
        .update(subscriptions)
        .set({ providerRef: checkout.providerRef, updatedAt: new Date() })
        .where(eq(subscriptions.id, subscriptionId))
        .returning();
      if (!updated) {
        throw new ORPCError("NOT_FOUND", { message: "Assinatura não encontrada." });
      }
      logger.info({ subscriptionId, userId: user.id, cycle: input.cycle }, "checkout criado");
      return { subscription: toSubscription(updated), checkoutUrl: checkout.checkoutUrl };
    },

    async cancelSubscription(userId: string): Promise<PremiumState> {
      const latest = await findLatestForUser(userId);
      if (!latest || latest.status !== "active") {
        throw new ORPCError("CONFLICT", { message: "Nenhuma assinatura ativa para cancelar." });
      }
      if (latest.cancelAtPeriodEnd) {
        return stateFrom(toSubscription(latest));
      }
      const day = new Date().toISOString().slice(0, 10);
      const subscription = await applyEvent(latest.id, {
        type: "cancel_requested",
        idempotencyKey: `cancel:${latest.id}:${day}`,
      });
      if (latest.providerRef) {
        await billing.cancelSubscription(latest.providerRef);
      }
      return stateFrom(subscription);
    },

    async confirmFakePayment(subscriptionId: string): Promise<Subscription> {
      if (billing.name !== "fake") {
        throw new ORPCError("CONFLICT", {
          message: "Confirmação manual só está disponível com o provedor fake.",
        });
      }
      return applyEvent(subscriptionId, {
        type: "payment_confirmed",
        idempotencyKey: `fake-confirm:${subscriptionId}`,
        payload: { source: "fake" },
      });
    },

    async findByProviderRef(
      provider: string,
      providerRef: string,
    ): Promise<SubscriptionRow | null> {
      const [row] = await db
        .select()
        .from(subscriptions)
        .where(
          and(eq(subscriptions.provider, provider), eq(subscriptions.providerRef, providerRef)),
        )
        .limit(1);
      return row ?? null;
    },

    async expireDueSubscriptions(now: Date = new Date()): Promise<number> {
      const due = await db
        .select({ id: subscriptions.id, currentPeriodEnd: subscriptions.currentPeriodEnd })
        .from(subscriptions)
        .where(and(eq(subscriptions.status, "active"), lt(subscriptions.currentPeriodEnd, now)));
      let expired = 0;
      for (const row of due) {
        const periodEnd = row.currentPeriodEnd ?? now;
        await applyEvent(row.id, {
          type: "expired",
          idempotencyKey: `expired:${row.id}:${periodEnd.toISOString()}`,
          occurredAt: periodEnd,
        });
        expired += 1;
      }
      if (expired > 0) {
        logger.info({ expired }, "assinaturas expiradas");
      }
      return expired;
    },
  };
}
