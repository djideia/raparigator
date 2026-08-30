"use client";

import type { RefObject } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";
import { useIsTabActive } from "@/components/layout/tab-activity";
import {
  useFeedHeaderTitleFlags,
  useOptionalFeedHeaderTitleMotion,
} from "./feed-header-title-context";
import { FeedSectionTitle } from "./feed-section-title";

interface FeedMobileHeadingRowProps {
  headingRef: RefObject<HTMLDivElement | null>;
  onOpenFilters: () => void;
}

export function FeedMobileHeadingRow({ headingRef, onOpenFilters }: FeedMobileHeadingRowProps) {
  const isTabActive = useIsTabActive();
  const { enabled, hasPremium, hasStandard } = useFeedHeaderTitleFlags();
  const motionValues = useOptionalFeedHeaderTitleMotion();
  const fallbackMaxHeight = useMotionValue(40);
  const fallbackReady = useMotionValue(0);
  const inPageTitleMaxHeight = motionValues?.inPageTitleMaxHeight ?? fallbackMaxHeight;
  const titleFlightReady = motionValues?.titleFlightReady ?? fallbackReady;
  const restTitleOpacity = useTransform(titleFlightReady, (value) => (value > 0.5 ? 0 : 1));
  const titleVariant = hasPremium ? "premium" : hasStandard ? "standard" : null;

  return (
    <div ref={headingRef} className="relative mb-3 flex items-center gap-3 lg:hidden">
      {enabled && titleVariant ? (
        <div className="relative min-w-0 flex-1">
          {isTabActive ? (
            <>
              <motion.div
                style={{ height: inPageTitleMaxHeight }}
                className="overflow-hidden"
                aria-hidden
              />
              <div
                data-feed-title-source
                className="pointer-events-none invisible absolute inset-x-0 top-0 h-10 w-full"
                aria-hidden
              >
                <FeedSectionTitle variant={titleVariant} fit className="w-full" />
              </div>
              <motion.div
                style={{ opacity: restTitleOpacity }}
                className="pointer-events-none absolute inset-x-0 top-0 flex h-10 w-full items-center"
              >
                <FeedSectionTitle variant={titleVariant} fit className="w-full" />
              </motion.div>
            </>
          ) : (
            <div className="flex h-10 w-full items-center">
              <FeedSectionTitle variant={titleVariant} fit className="w-full" />
            </div>
          )}
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}

      <Button variant="secondary" className="shrink-0" onClick={onOpenFilters}>
        <span className="inline-flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="text-red-500"
          >
            <line x1="21" x2="14" y1="4" y2="4" />
            <line x1="10" x2="3" y1="4" y2="4" />
            <line x1="21" x2="12" y1="12" y2="12" />
            <line x1="8" x2="3" y1="12" y2="12" />
            <line x1="21" x2="16" y1="20" y2="20" />
            <line x1="12" x2="3" y1="20" y2="20" />
            <line x1="14" x2="14" y1="2" y2="6" />
            <line x1="8" x2="8" y1="10" y2="14" />
            <line x1="16" x2="16" y1="18" y2="22" />
          </svg>
          Filtros
        </span>
      </Button>
    </div>
  );
}
