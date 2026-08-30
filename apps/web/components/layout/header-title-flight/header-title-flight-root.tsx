"use client";

import { useMemo, type ReactNode } from "react";
import { getTitleFlightRegistry } from "./registry";

export function HeaderTitleFlightRoot({ children }: { children: ReactNode }) {
  useMemo(() => {
    getTitleFlightRegistry();
  }, []);

  return children;
}
