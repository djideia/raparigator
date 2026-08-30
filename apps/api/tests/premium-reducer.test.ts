import { describe, expect, it } from "vitest";
import { addBillingCycle } from "@sigillus/domain";
import {
  reduceSubscriptionEvents,
  type SubscriptionEventInput,
} from "../src/modules/premium/reducer";

const T0 = new Date("2026-01-10T12:00:00.000Z");
const T1 = new Date("2026-01-10T12:05:00.000Z");
const T2 = new Date("2026-01-20T12:00:00.000Z");

function event(type: SubscriptionEventInput["type"], occurredAt: Date): SubscriptionEventInput {
  return { type, occurredAt, payload: {} };
}

describe("reduceSubscriptionEvents", () => {
  it("sem eventos fica em none", () => {
    expect(reduceSubscriptionEvents([], "monthly", T0)).toEqual({
      status: "none",
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  });

  it("checkout cria pending_payment e pagamento ativa com período do ciclo", () => {
    const pending = reduceSubscriptionEvents([event("checkout_created", T0)], "monthly", T1);
    expect(pending.status).toBe("pending_payment");
    expect(pending.currentPeriodStart).toBeNull();

    const active = reduceSubscriptionEvents(
      [event("checkout_created", T0), event("payment_confirmed", T1)],
      "monthly",
      T2,
    );
    expect(active.status).toBe("active");
    expect(active.currentPeriodStart).toEqual(T1);
    expect(active.currentPeriodEnd).toEqual(addBillingCycle(T1, "monthly"));
    expect(active.cancelAtPeriodEnd).toBe(false);
  });

  it("semestral usa seis meses", () => {
    const state = reduceSubscriptionEvents([event("payment_confirmed", T1)], "semiannual", T2);
    expect(state.currentPeriodEnd).toEqual(addBillingCycle(T1, "semiannual"));
  });

  it("payment_failed vira past_due e mantém o período", () => {
    const state = reduceSubscriptionEvents(
      [event("payment_confirmed", T1), event("payment_failed", T2)],
      "monthly",
      T2,
    );
    expect(state.status).toBe("past_due");
    expect(state.currentPeriodStart).toEqual(T1);
  });

  it("cancel_requested só marca cancelAtPeriodEnd e mantém active", () => {
    const state = reduceSubscriptionEvents(
      [event("payment_confirmed", T1), event("cancel_requested", T2)],
      "monthly",
      T2,
    );
    expect(state.status).toBe("active");
    expect(state.cancelAtPeriodEnd).toBe(true);
  });

  it("canceled e expired encerram", () => {
    expect(
      reduceSubscriptionEvents(
        [event("payment_confirmed", T1), event("canceled", T2)],
        "monthly",
        T2,
      ).status,
    ).toBe("canceled");
    expect(
      reduceSubscriptionEvents(
        [event("payment_confirmed", T1), event("expired", T2)],
        "monthly",
        T2,
      ).status,
    ).toBe("expired");
  });

  it("renewed antes do fim emenda o período a partir do fim anterior", () => {
    const firstEnd = addBillingCycle(T1, "monthly");
    const renewedAt = new Date(firstEnd.getTime() - 60_000);
    const state = reduceSubscriptionEvents(
      [event("payment_confirmed", T1), event("renewed", renewedAt)],
      "monthly",
      renewedAt,
    );
    expect(state.status).toBe("active");
    expect(state.currentPeriodStart).toEqual(firstEnd);
    expect(state.currentPeriodEnd).toEqual(addBillingCycle(firstEnd, "monthly"));
  });

  it("renewed depois do vencimento reinicia a partir do occurredAt", () => {
    const firstEnd = addBillingCycle(T1, "monthly");
    const renewedAt = new Date(firstEnd.getTime() + 3 * 24 * 60 * 60 * 1000);
    const state = reduceSubscriptionEvents(
      [event("payment_confirmed", T1), event("renewed", renewedAt)],
      "monthly",
      renewedAt,
    );
    expect(state.status).toBe("active");
    expect(state.currentPeriodStart).toEqual(renewedAt);
    expect(state.currentPeriodEnd).toEqual(addBillingCycle(renewedAt, "monthly"));
  });

  it("active vencido sem renovação vira expired quando now passa do fim", () => {
    const firstEnd = addBillingCycle(T1, "monthly");
    const later = new Date(firstEnd.getTime() + 1000);
    const state = reduceSubscriptionEvents([event("payment_confirmed", T1)], "monthly", later);
    expect(state.status).toBe("expired");
    expect(state.currentPeriodEnd).toEqual(firstEnd);
  });

  it("ordena por occurredAt independentemente da ordem de chegada", () => {
    const state = reduceSubscriptionEvents(
      [event("payment_confirmed", T1), event("checkout_created", T0)],
      "monthly",
      T2,
    );
    expect(state.status).toBe("active");
  });
});
