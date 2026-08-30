import type {
  PlanLimits,
  PlanTier,
  PremiumBillingCycle,
  PremiumPlanOption,
} from "@sigillus/contracts";

export const STANDARD_PHOTO_LIMIT = 10;
export const STANDARD_VIDEO_LIMIT = 3;
export const PREMIUM_PHOTO_LIMIT = 100;
export const PREMIUM_VIDEO_LIMIT = 50;
export const PREMIUM_VISIBILITY_MULTIPLIER = 1.6;
export const STANDARD_VISIBILITY_MULTIPLIER = 1;

export const PREMIUM_PLAN_OPTIONS: PremiumPlanOption[] = [
  {
    cycle: "monthly",
    label: "Mensal",
    price: 10,
    monthlyEquivalent: 10,
  },
  {
    cycle: "semiannual",
    label: "Semestral",
    price: 30,
    monthlyEquivalent: 5,
    badge: "50% off",
  },
];

export const PREMIUM_CYCLE_MONTHS: Record<PremiumBillingCycle, number> = {
  monthly: 1,
  semiannual: 6,
};

export function getPlanLimits(plan: PlanTier): PlanLimits {
  const isPremium = plan === "premium";
  return {
    photoLimit: isPremium ? PREMIUM_PHOTO_LIMIT : STANDARD_PHOTO_LIMIT,
    videoLimit: isPremium ? PREMIUM_VIDEO_LIMIT : STANDARD_VIDEO_LIMIT,
    canSendViewOnce: isPremium,
    canUseAlias: isPremium,
    visibilityMultiplier: isPremium
      ? PREMIUM_VISIBILITY_MULTIPLIER
      : STANDARD_VISIBILITY_MULTIPLIER,
  };
}

export function canUploadMedia(
  plan: PlanTier,
  kind: "image" | "video",
  currentCount: number,
): boolean {
  const limits = getPlanLimits(plan);
  const limit = kind === "image" ? limits.photoLimit : limits.videoLimit;
  return currentCount < limit;
}

export function getPlanOption(cycle: PremiumBillingCycle): PremiumPlanOption {
  return PREMIUM_PLAN_OPTIONS.find((option) => option.cycle === cycle) ?? PREMIUM_PLAN_OPTIONS[0]!;
}

export function getBillingSavingsPercent(): number {
  const monthly = getPlanOption("monthly").monthlyEquivalent;
  const semiannual = getPlanOption("semiannual").monthlyEquivalent;
  if (monthly <= 0) {
    return 0;
  }
  return Math.round(((monthly - semiannual) / monthly) * 100);
}

export function addBillingCycle(start: Date, cycle: PremiumBillingCycle): Date {
  const months = PREMIUM_CYCLE_MONTHS[cycle];
  const targetMonthStart = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1);
  const daysInTargetMonth = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months + 1, 0),
  ).getUTCDate();
  const day = Math.min(start.getUTCDate(), daysInTargetMonth);
  const next = new Date(targetMonthStart);
  next.setUTCDate(day);
  next.setUTCHours(
    start.getUTCHours(),
    start.getUTCMinutes(),
    start.getUTCSeconds(),
    start.getUTCMilliseconds(),
  );
  return next;
}
