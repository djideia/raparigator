import { z } from "zod";
import { PlanTierSchema, PremiumBillingCycleSchema } from "./common";

export const PremiumPlanOptionSchema = z.object({
  cycle: PremiumBillingCycleSchema,
  label: z.string(),
  price: z.number(),
  monthlyEquivalent: z.number(),
  badge: z.string().optional(),
});
export type PremiumPlanOption = z.infer<typeof PremiumPlanOptionSchema>;

export const PlanLimitsSchema = z.object({
  photoLimit: z.number().int(),
  videoLimit: z.number().int(),
  canSendViewOnce: z.boolean(),
  canUseAlias: z.boolean(),
  visibilityMultiplier: z.number(),
});
export type PlanLimits = z.infer<typeof PlanLimitsSchema>;

export const SubscriptionStatusSchema = z.enum([
  "none",
  "pending_payment",
  "active",
  "past_due",
  "canceled",
  "expired",
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const SubscriptionSchema = z.object({
  id: z.string(),
  cycle: PremiumBillingCycleSchema,
  status: SubscriptionStatusSchema,
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  provider: z.string(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

export const PremiumStateSchema = z.object({
  plan: PlanTierSchema,
  limits: PlanLimitsSchema,
  subscription: SubscriptionSchema.nullable(),
});
export type PremiumState = z.infer<typeof PremiumStateSchema>;

export const SubscriptionEventTypeSchema = z.enum([
  "checkout_created",
  "payment_confirmed",
  "payment_failed",
  "renewed",
  "cancel_requested",
  "canceled",
  "expired",
]);
export type SubscriptionEventType = z.infer<typeof SubscriptionEventTypeSchema>;

export const StartSubscriptionInputSchema = z.object({
  cycle: PremiumBillingCycleSchema,
});
export type StartSubscriptionInput = z.infer<typeof StartSubscriptionInputSchema>;

export const StartSubscriptionOutputSchema = z.object({
  subscription: SubscriptionSchema,
  checkoutUrl: z.string().nullable(),
});
export type StartSubscriptionOutput = z.infer<typeof StartSubscriptionOutputSchema>;
