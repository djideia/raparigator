"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import {
  useDashboardHeaderTitleFlags,
  useOptionalDashboardHeaderTitleMotion,
} from "./dashboard-header-title-context";
import { DASHBOARD_HEADER_TITLE, DASHBOARD_TITLE_HEADER_CLASS } from "./dashboard-title";

export function DashboardHeaderDesktopTitle() {
  const { enabled, mode } = useDashboardHeaderTitleFlags();
  const motionValues = useOptionalDashboardHeaderTitleMotion();
  const fallbackReveal = useMotionValue(0);
  const headerReveal = motionValues?.headerReveal ?? fallbackReveal;

  const opacity = useTransform(headerReveal, [0, 0.18, 0.42], [0, 0, 1]);
  const y = useTransform(headerReveal, [0, 0.18, 0.42], [10, 10, 0]);

  if (!enabled || mode !== "desktop") {
    return null;
  }

  return (
    <motion.div
      aria-hidden
      style={{ opacity, y }}
      className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center px-32"
    >
      <div className="flex h-12 w-full max-w-lg items-center justify-center">
        <span className={cn("truncate", DASHBOARD_TITLE_HEADER_CLASS)}>
          {DASHBOARD_HEADER_TITLE}
        </span>
      </div>
    </motion.div>
  );
}
