"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "sigillus-age-verified";
export const UNDERAGE_REDIRECT_URL = "https://www.google.com";

export type AgeGateStatus = "pending" | "verified" | "unverified";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function readRaw(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function readStatus(): AgeGateStatus {
  const raw = readRaw();
  if (raw === "true") {
    return "verified";
  }

  if (raw === "false") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      return "unverified";
    }
    return "unverified";
  }

  return "unverified";
}

function writeVerified() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    return;
  }

  emitChange();
}

export function confirmAdult() {
  writeVerified();
}

export function denyUnderage() {
  if (typeof window !== "undefined") {
    window.location.replace(UNDERAGE_REDIRECT_URL);
  }
}

export function useAgeGate() {
  const status = useSyncExternalStore<AgeGateStatus>(subscribe, readStatus, () => "pending");

  return {
    status,
    confirmAdult,
    denyUnderage,
  };
}
