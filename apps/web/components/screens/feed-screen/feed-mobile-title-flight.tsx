"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import { useIsTabActive } from "@/components/layout/tab-activity";
import { MobileTitleFlightPortal } from "@/components/layout/header-title-flight/mobile-title-flight-portal";
import {
  useFeedHeaderTitleFlags,
  useOptionalFeedHeaderTitleMotion,
} from "./feed-header-title-context";
import { FeedSectionTitle } from "./feed-section-title";

const TITLE_STACK_PX = 28;

function clampFade(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function FeedMobileTitleFlight() {
  const isTabActive = useIsTabActive();
  const { enabled, mode, hasPremium, hasStandard } = useFeedHeaderTitleFlags();
  const motionValues = useOptionalFeedHeaderTitleMotion();
  const fallbackX = useMotionValue(0);
  const fallbackY = useMotionValue(0);
  const fallbackW = useMotionValue(0);
  const fallbackReady = useMotionValue(0);
  const fallbackPush = useMotionValue(0);

  const titleFlightX = motionValues?.titleFlightX ?? fallbackX;
  const titleFlightY = motionValues?.titleFlightY ?? fallbackY;
  const titleFlightW = motionValues?.titleFlightW ?? fallbackW;
  const titleFlightReady = motionValues?.titleFlightReady ?? fallbackReady;
  const pushProgress = motionValues?.pushProgress ?? fallbackPush;

  const stackT = useTransform(pushProgress, (value) => {
    if (!hasPremium || !hasStandard) {
      return hasPremium ? 0 : 1;
    }
    if (value <= 0.25) {
      return 0;
    }
    if (value >= 0.85) {
      return 1;
    }
    return clampFade((value - 0.25) / 0.6);
  });

  const premiumY = useTransform(stackT, (value) => -value * TITLE_STACK_PX);
  const standardY = useTransform(stackT, (value) => (1 - value) * TITLE_STACK_PX);

  const premiumOpacity = useTransform(pushProgress, (value) => {
    if (!hasPremium || !hasStandard) {
      return hasPremium ? 1 : 0;
    }
    if (value <= 0.25) {
      return 1;
    }
    if (value >= 0.85) {
      return 0;
    }
    return clampFade(1 - (value - 0.25) / 0.6);
  });

  const standardOpacity = useTransform(pushProgress, (value) => {
    if (!hasPremium || !hasStandard) {
      return hasStandard && !hasPremium ? 1 : 0;
    }
    if (value <= 0.25) {
      return 0;
    }
    if (value >= 0.85) {
      return 1;
    }
    return clampFade((value - 0.25) / 0.6);
  });

  return (
    <MobileTitleFlightPortal
      active={isTabActive && enabled && mode === "mobile"}
      titleFlightX={titleFlightX}
      titleFlightY={titleFlightY}
      titleFlightW={titleFlightW}
      titleFlightReady={titleFlightReady}
    >
      <div className="relative h-10 w-full min-w-0">
        {hasPremium ? (
          <motion.div
            style={{ y: premiumY, opacity: premiumOpacity }}
            className="flex h-10 w-full min-w-0 items-center will-change-transform"
          >
            <FeedSectionTitle variant="premium" fit fitToTarget className="w-full justify-center" />
          </motion.div>
        ) : null}
        {hasStandard ? (
          <motion.div
            style={{
              y: hasPremium ? standardY : 0,
              opacity: hasPremium ? standardOpacity : 1,
            }}
            className={
              hasPremium
                ? "absolute inset-0 flex h-10 w-full min-w-0 items-center will-change-transform"
                : "flex h-10 w-full min-w-0 items-center will-change-transform"
            }
          >
            <FeedSectionTitle
              variant="standard"
              fit
              fitToTarget
              className="w-full justify-center"
            />
          </motion.div>
        ) : null}
      </div>
    </MobileTitleFlightPortal>
  );
}
