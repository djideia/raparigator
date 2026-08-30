"use client";

import type { ReactNode } from "react";
import { AgeGateScreen } from "@/components/screens/age-gate-screen";
import { useAgeGate } from "@/lib/age-gate";

export function AgeGateGate({ children }: { children: ReactNode }) {
  const { status } = useAgeGate();

  if (status === "pending") {
    return <div className="min-h-dvh bg-zinc-50" aria-busy="true" />;
  }

  if (status === "unverified") {
    return <AgeGateScreen />;
  }

  return children;
}
