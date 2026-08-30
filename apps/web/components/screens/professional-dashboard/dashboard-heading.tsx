"use client";

import type { RefObject } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { useIsTabActive } from "@/components/layout/tab-activity";
import { cn } from "@/lib/utils";
import {
  useDashboardHeaderTitleFlags,
  useOptionalDashboardHeaderTitleMotion,
} from "./dashboard-header-title-context";
import { DASHBOARD_HEADER_TITLE, DASHBOARD_TITLE_HEADER_CLASS } from "./dashboard-title";

interface DashboardHeadingProps {
  headingRef: RefObject<HTMLDivElement | null>;
}

export function DashboardHeading({ headingRef }: DashboardHeadingProps) {
  const isTabActive = useIsTabActive();
  const { enabled, mode } = useDashboardHeaderTitleFlags();
  const motionValues = useOptionalDashboardHeaderTitleMotion();
  const fallbackMaxHeight = useMotionValue(40);
  const fallbackReady = useMotionValue(0);
  const inPageTitleMaxHeight = motionValues?.inPageTitleMaxHeight ?? fallbackMaxHeight;
  const titleFlightReady = motionValues?.titleFlightReady ?? fallbackReady;
  const restTitleOpacity = useTransform(titleFlightReady, (value) => (value > 0.5 ? 0 : 1));

  const mobileFlight = enabled && mode === "mobile";

  if (!mobileFlight) {
    return null;
  }

  return (
    <div className="min-w-0 lg:hidden">
      <div ref={headingRef} className="relative min-w-0">
        {isTabActive ? (
          <>
            <motion.div
              style={{ height: inPageTitleMaxHeight }}
              className="overflow-hidden"
              aria-hidden
            />
            <div
              data-dashboard-title-source
              className="pointer-events-none invisible absolute inset-x-0 top-0 flex h-10 w-full items-center"
              aria-hidden
            >
              <span className={cn("truncate", DASHBOARD_TITLE_HEADER_CLASS)}>
                {DASHBOARD_HEADER_TITLE}
              </span>
            </div>
            <motion.div
              style={{ opacity: restTitleOpacity }}
              className="pointer-events-none absolute inset-x-0 top-0 flex h-10 w-full items-center"
            >
              <h1 className={cn("truncate", DASHBOARD_TITLE_HEADER_CLASS)}>
                {DASHBOARD_HEADER_TITLE}
              </h1>
            </motion.div>
          </>
        ) : (
          <div className="flex h-10 w-full items-center">
            <h1 className={cn("truncate", DASHBOARD_TITLE_HEADER_CLASS)}>
              {DASHBOARD_HEADER_TITLE}
            </h1>
          </div>
        )}
      </div>
    </div>
  );
}
