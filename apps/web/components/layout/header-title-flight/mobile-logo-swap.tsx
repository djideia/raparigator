"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { LOGO_SWAP_OPACITY_OUTPUT, LOGO_SWAP_REVEAL_INPUT, TITLE_STACK_PX } from "./constants";

type MobileLogoSwapProps = {
  enabled: boolean;
  headerReveal: MotionValue<number>;
  targetAttr: "data-feed-title-target" | "data-dashboard-title-target";
  fallback: ReactNode;
  logo: ReactNode;
};

export function MobileLogoSwap({
  enabled,
  headerReveal,
  targetAttr,
  fallback,
  logo,
}: MobileLogoSwapProps) {
  const logoOpacity = useTransform(
    headerReveal,
    [...LOGO_SWAP_REVEAL_INPUT],
    [...LOGO_SWAP_OPACITY_OUTPUT],
  );
  const logoY = useTransform(headerReveal, [...LOGO_SWAP_REVEAL_INPUT], [0, 0, -TITLE_STACK_PX]);
  const logoPointerEvents = useTransform(headerReveal, (value) => (value > 0.3 ? "none" : "auto"));

  if (!enabled) {
    return fallback;
  }

  return (
    <div className="relative min-w-0 flex-1">
      <div className="relative flex h-10 min-w-0 w-full items-center overflow-hidden">
        <motion.div
          style={{ opacity: logoOpacity, y: logoY, pointerEvents: logoPointerEvents }}
          className="relative z-10 flex h-10 shrink-0 items-center will-change-transform"
        >
          {logo}
        </motion.div>

        {targetAttr === "data-feed-title-target" ? (
          <div
            data-feed-title-target
            className="pointer-events-none absolute inset-y-0 left-2 right-2 h-10 min-w-0"
            aria-hidden
          />
        ) : (
          <div
            data-dashboard-title-target
            className="pointer-events-none absolute inset-y-0 left-2 right-2 h-10 min-w-0"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
