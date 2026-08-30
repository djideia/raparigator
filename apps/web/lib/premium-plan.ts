"use client";

import { useSyncExternalStore } from "react";
import type { PlanTier } from "@sigillus/contracts";
import { getPlanLimits } from "@sigillus/domain";

export {
  PREMIUM_PHOTO_LIMIT,
  PREMIUM_VIDEO_LIMIT,
  PREMIUM_VISIBILITY_MULTIPLIER,
  STANDARD_PHOTO_LIMIT,
  STANDARD_VIDEO_LIMIT,
} from "@sigillus/domain";

const PLAN_STORAGE_KEY = "sigillus-premium-plan";
const VIEW_ONCE_COUNT_KEY = "sigillus-view-once-count";

export const PREMIUM_UPLOAD_ERROR_MESSAGE = "Houve um erro ao fazer o upload";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function isPlanTier(value: string | null): value is PlanTier {
  return value === "standard" || value === "premium";
}

function readStoredPlan(): PlanTier {
  if (typeof window === "undefined") {
    return "standard";
  }

  const stored = window.localStorage.getItem(PLAN_STORAGE_KEY);
  return isPlanTier(stored) ? stored : "standard";
}

function readViewOnceCount(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = Number(window.localStorage.getItem(VIEW_ONCE_COUNT_KEY));
  return Number.isFinite(stored) && stored > 0 ? Math.floor(stored) : 0;
}

export function activatePremium() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PLAN_STORAGE_KEY, "premium");
  }

  emitChange();
}

export function registerViewOnceSend() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(VIEW_ONCE_COUNT_KEY, String(readViewOnceCount() + 1));
  }

  emitChange();
}

export function usePremiumPlan() {
  const plan = useSyncExternalStore<PlanTier>(subscribe, readStoredPlan, () => "standard");
  const viewOnceUsed = useSyncExternalStore<number>(subscribe, readViewOnceCount, () => 0);

  const isPremium = plan === "premium";
  const limits = getPlanLimits(plan);

  return {
    plan,
    isPremium,
    activatePremium,
    viewOnceUsed,
    canSendViewOnce: limits.canSendViewOnce,
    registerViewOnceSend,
    photoLimit: limits.photoLimit,
    videoLimit: limits.videoLimit,
  };
}
