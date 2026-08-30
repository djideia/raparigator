"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { usePathname } from "next/navigation";
import { FeedSectionTitle } from "@/components/screens/feed-screen/feed-section-title";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { TITLE_STACK_PX } from "./constants";
import { MobileLogoSwap } from "./mobile-logo-swap";
import { isFeedTitleFlightPath } from "./resolve-surface";
import { useActiveTitleFlightSurface } from "./use-title-flight-surface";

function BrandLogoLink({ className }: { className?: string }) {
  return <BrandWordmark className={className} />;
}

function DesktopTitleStack({
  hasPremium,
  hasStandard,
  pushProgress,
}: {
  hasPremium: boolean;
  hasStandard: boolean;
  pushProgress: MotionValue<number>;
}) {
  const premiumY = useTransform(pushProgress, (value) => -value * TITLE_STACK_PX);
  const standardY = useTransform(pushProgress, (value) => (1 - value) * TITLE_STACK_PX);
  const premiumOpacity = useTransform(pushProgress, [0, 0.35, 0.65], [1, 1, 0]);
  const standardOpacity = useTransform(pushProgress, [0.35, 0.65, 1], [0, 1, 1]);

  if (hasPremium && hasStandard) {
    return (
      <div
        data-feed-desktop-title-stack
        className="relative mx-auto h-12 w-full max-w-lg overflow-hidden"
      >
        <motion.div
          data-feed-desktop-title="premium"
          style={{ y: premiumY, opacity: premiumOpacity }}
          className="flex h-12 w-full items-center justify-center will-change-transform"
        >
          <FeedSectionTitle variant="premium" size="lg" className="justify-center" />
        </motion.div>
        <motion.div
          data-feed-desktop-title="standard"
          style={{ y: standardY, opacity: standardOpacity }}
          className="absolute inset-0 flex h-12 w-full items-center justify-center will-change-transform"
        >
          <FeedSectionTitle variant="standard" size="lg" className="justify-center" />
        </motion.div>
      </div>
    );
  }

  if (hasPremium) {
    return (
      <div className="flex h-12 w-full max-w-lg items-center justify-center">
        <FeedSectionTitle variant="premium" size="lg" className="justify-center" />
      </div>
    );
  }

  if (hasStandard) {
    return (
      <div className="flex h-12 w-full max-w-lg items-center justify-center">
        <FeedSectionTitle variant="standard" size="lg" className="justify-center" />
      </div>
    );
  }

  return null;
}

export function HeaderTitleSlot() {
  const pathname = usePathname();
  const active = useActiveTitleFlightSurface(pathname);

  if (active?.id === "feed" && active.flags.enabled) {
    if (active.flags.mode === "mobile") {
      return (
        <MobileLogoSwap
          enabled
          headerReveal={active.motion.headerReveal}
          targetAttr="data-feed-title-target"
          fallback={<BrandLogoLink />}
          logo={<BrandLogoLink />}
        />
      );
    }
    return <BrandLogoLink className="relative z-10" />;
  }

  if (active?.id === "dashboard" && active.flags.enabled) {
    if (active.flags.mode === "mobile") {
      return (
        <MobileLogoSwap
          enabled
          headerReveal={active.motion.headerReveal}
          targetAttr="data-dashboard-title-target"
          fallback={<BrandLogoLink />}
          logo={<BrandLogoLink />}
        />
      );
    }
    return <BrandLogoLink />;
  }

  return <BrandLogoLink />;
}

export function FeedHeaderDesktopTitle() {
  const pathname = usePathname();
  const active = useActiveTitleFlightSurface(pathname);

  if (
    !isFeedTitleFlightPath(pathname) ||
    active?.id !== "feed" ||
    !active.flags.enabled ||
    active.flags.mode !== "desktop"
  ) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center px-32">
      <DesktopTitleStack
        hasPremium={active.flags.hasPremium}
        hasStandard={active.flags.hasStandard}
        pushProgress={active.motion.pushProgress}
      />
    </div>
  );
}
