"use client";

import { useMotionValue } from "motion/react";
import { useIsTabActive } from "@/components/layout/tab-activity";
import { MobileTitleFlightPortal } from "@/components/layout/header-title-flight/mobile-title-flight-portal";
import { cn } from "@/lib/utils";
import {
  useDashboardHeaderTitleFlags,
  useOptionalDashboardHeaderTitleMotion,
} from "./dashboard-header-title-context";
import { DASHBOARD_HEADER_TITLE, DASHBOARD_TITLE_HEADER_CLASS } from "./dashboard-title";

export function DashboardMobileTitleFlight() {
  const isTabActive = useIsTabActive();
  const { enabled, mode } = useDashboardHeaderTitleFlags();
  const motionValues = useOptionalDashboardHeaderTitleMotion();
  const fallbackX = useMotionValue(0);
  const fallbackY = useMotionValue(0);
  const fallbackW = useMotionValue(0);
  const fallbackReady = useMotionValue(0);

  const titleFlightX = motionValues?.titleFlightX ?? fallbackX;
  const titleFlightY = motionValues?.titleFlightY ?? fallbackY;
  const titleFlightW = motionValues?.titleFlightW ?? fallbackW;
  const titleFlightReady = motionValues?.titleFlightReady ?? fallbackReady;

  return (
    <MobileTitleFlightPortal
      active={isTabActive && enabled && mode === "mobile"}
      titleFlightX={titleFlightX}
      titleFlightY={titleFlightY}
      titleFlightW={titleFlightW}
      titleFlightReady={titleFlightReady}
    >
      <div className="flex h-10 w-full min-w-0 items-center">
        <span className={cn("truncate", DASHBOARD_TITLE_HEADER_CLASS)}>
          {DASHBOARD_HEADER_TITLE}
        </span>
      </div>
    </MobileTitleFlightPortal>
  );
}
