import type {
  PremiumBillingCycle,
  SubscriptionEventType,
  SubscriptionStatus,
} from "@sigillus/contracts";
import { addBillingCycle } from "@sigillus/domain";

export type SubscriptionEventInput = {
  type: SubscriptionEventType;
  occurredAt: Date;
  payload?: Record<string, unknown>;
};

export type ReducedSubscriptionState = {
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export const INITIAL_SUBSCRIPTION_STATE: ReducedSubscriptionState = {
  status: "none",
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

function applyOne(
  state: ReducedSubscriptionState,
  event: SubscriptionEventInput,
  cycle: PremiumBillingCycle,
): ReducedSubscriptionState {
  switch (event.type) {
    case "checkout_created":
      return { ...state, status: "pending_payment" };
    case "payment_confirmed":
      return {
        status: "active",
        currentPeriodStart: event.occurredAt,
        currentPeriodEnd: addBillingCycle(event.occurredAt, cycle),
        cancelAtPeriodEnd: false,
      };
    case "renewed": {
      const base =
        state.currentPeriodEnd && state.currentPeriodEnd.getTime() > event.occurredAt.getTime()
          ? state.currentPeriodEnd
          : event.occurredAt;
      return {
        ...state,
        status: "active",
        currentPeriodStart: base,
        currentPeriodEnd: addBillingCycle(base, cycle),
      };
    }
    case "payment_failed":
      return { ...state, status: "past_due" };
    case "cancel_requested":
      return { ...state, cancelAtPeriodEnd: true };
    case "canceled":
      return { ...state, status: "canceled" };
    case "expired":
      return { ...state, status: "expired" };
  }
}

export function reduceSubscriptionEvents(
  events: SubscriptionEventInput[],
  cycle: PremiumBillingCycle,
  now: Date = new Date(),
): ReducedSubscriptionState {
  const ordered = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  let state = INITIAL_SUBSCRIPTION_STATE;
  for (const event of ordered) {
    state = applyOne(state, event, cycle);
  }
  if (
    state.status === "active" &&
    state.currentPeriodEnd &&
    now.getTime() > state.currentPeriodEnd.getTime()
  ) {
    return { ...state, status: "expired" };
  }
  return state;
}
