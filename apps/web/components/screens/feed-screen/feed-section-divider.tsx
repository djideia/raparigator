"use client";

import { motion, useMotionValue } from "motion/react";
import { useIsTabActive } from "@/components/layout/tab-activity";
import { cn } from "@/lib/utils";
import { useOptionalFeedHeaderTitleMotion } from "./feed-header-title-context";
import { FeedSectionTitle, type FeedSectionTitleVariant } from "./feed-section-title";

interface FeedSectionDividerProps {
  variant: FeedSectionTitleVariant;
  className?: string;
  hasPremiumSection?: boolean;
}

export function FeedSectionDivider({
  variant,
  className,
  hasPremiumSection = false,
}: FeedSectionDividerProps) {
  const isTabActive = useIsTabActive();
  const motionValues = useOptionalFeedHeaderTitleMotion();
  const fallbackOpacity = useMotionValue(1);
  const opacity = motionValues?.standardDividerOpacity ?? fallbackOpacity;

  if (variant === "premium") {
    if (isTabActive) {
      return null;
    }

    return (
      <div className={cn("mb-4 hidden items-center gap-3 py-2 select-none lg:flex", className)}>
        <div className="min-w-0 max-w-[min(100%,20rem)] sm:max-w-[min(100%,24rem)]">
          <FeedSectionTitle variant="premium" fit />
        </div>
      </div>
    );
  }

  if (isTabActive && !hasPremiumSection) {
    return null;
  }

  return (
    <motion.div
      style={{ opacity: isTabActive ? opacity : 1 }}
      className={cn("mt-6 flex items-center gap-3 py-4 select-none", className)}
    >
      <div className="min-w-0 max-w-[min(100%,20rem)] sm:max-w-[min(100%,24rem)]">
        <FeedSectionTitle variant="standard" fit />
      </div>
      <span
        className="h-px min-w-0 flex-1 rounded-full"
        style={{
          background: "linear-gradient(to right, rgba(182, 0, 49, 0.3), transparent)",
        }}
      />
    </motion.div>
  );
}
