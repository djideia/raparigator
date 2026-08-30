"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { useIsTabActive } from "@/components/layout/tab-activity";
import {
  clamp01,
  dampExp,
  headerOffsetPx,
  inPageSpacerFromReveal,
  IN_PAGE_OPACITY_REVEAL_DIVISOR,
  IN_PAGE_TITLE_HEIGHT,
  progressAcrossBand,
  REVEAL_LAMBDA_DESKTOP,
  REVEAL_LAMBDA_MOBILE,
  sampleMobileTitleReveal,
  smootherstep,
  SPACER_LAMBDA,
  useDampedScrollLoop,
  useMatchDesktop,
  writeFlightFromReveal,
} from "@/components/layout/header-title-flight";
import {
  publishDashboardHeaderTitleFlags,
  useDashboardHeaderTitleMotion,
  type DashboardHeaderTitleFlags,
  type DashboardHeaderTitleMode,
} from "./dashboard-header-title-context";

const REVEAL_START_DESKTOP_PX = 120;
const REVEAL_END_DESKTOP_PX = 8;
const REVEAL_SCROLL_FADE_DESKTOP_PX = 36;

interface UseDashboardTitleScrollArgs {
  headingRef: RefObject<HTMLDivElement | null>;
}

export function useDashboardTitleScroll({
  headingRef,
}: UseDashboardTitleScrollArgs): DashboardHeaderTitleFlags {
  const motion = useDashboardHeaderTitleMotion();
  const isTabActive = useIsTabActive();
  const isDesktop = useMatchDesktop();
  const stateRef = useRef({
    target: {
      reveal: 0,
      spacer: IN_PAGE_TITLE_HEIGHT,
    },
    current: {
      reveal: 0,
      spacer: IN_PAGE_TITLE_HEIGHT,
    },
  });

  useLayoutEffect(() => {
    const mode: DashboardHeaderTitleMode = isDesktop ? "desktop" : "mobile";
    publishDashboardHeaderTitleFlags({
      enabled: true,
      mode,
    });

    if (!isTabActive) {
      motion.headerReveal.set(0);
      motion.titleFlightReady.set(0);
      motion.inPageTitleOpacity.set(1);
      motion.inPageTitleMaxHeight.set(IN_PAGE_TITLE_HEIGHT);
    }

    return () => {
      publishDashboardHeaderTitleFlags({
        enabled: false,
        mode: "desktop",
      });
      motion.headerReveal.set(0);
      motion.titleFlightReady.set(0);
      motion.inPageTitleOpacity.set(1);
      motion.inPageTitleMaxHeight.set(IN_PAGE_TITLE_HEIGHT);
    };
  }, [isDesktop, isTabActive, motion]);

  useDampedScrollLoop(
    isTabActive,
    (dt, seeded) => {
      const {
        headerReveal,
        inPageTitleOpacity,
        inPageTitleMaxHeight,
        titleFlightX,
        titleFlightY,
        titleFlightW,
        titleFlightReady,
      } = motion;

      const { target, current } = stateRef.current;
      const headerBottom = headerOffsetPx();
      const mode: DashboardHeaderTitleMode = isDesktop ? "desktop" : "mobile";

      if (mode === "desktop") {
        const revealTarget =
          document.querySelector<HTMLElement>("[data-dashboard-desktop-title-source]") ??
          headingRef.current;

        if (!revealTarget) {
          target.reveal = 0;
          target.spacer = 0;
        } else {
          const top = revealTarget.getBoundingClientRect().top;
          const start = headerBottom + REVEAL_START_DESKTOP_PX;
          const end = headerBottom + REVEAL_END_DESKTOP_PX;
          const band = smootherstep(progressAcrossBand(top, start, end));
          const scrollFade = smootherstep(window.scrollY / REVEAL_SCROLL_FADE_DESKTOP_PX);
          target.reveal = band * scrollFade;
          target.spacer = 0;
        }
      } else {
        const revealTarget = headingRef.current;
        if (!revealTarget) {
          target.reveal = 0;
          target.spacer = IN_PAGE_TITLE_HEIGHT;
        } else {
          const sampled = sampleMobileTitleReveal({
            targetTop: revealTarget.getBoundingClientRect().top,
            headerBottom,
            scrollY: window.scrollY,
          });
          target.reveal = sampled.reveal;
          target.spacer = inPageSpacerFromReveal(target.reveal);
        }
      }

      const revealLambda = mode === "mobile" ? REVEAL_LAMBDA_MOBILE : REVEAL_LAMBDA_DESKTOP;

      let nextSeeded = seeded;
      if (!seeded) {
        current.reveal = target.reveal;
        current.spacer = target.spacer;
        nextSeeded = true;
      } else {
        current.reveal = dampExp(current.reveal, target.reveal, revealLambda, dt);
        current.spacer = dampExp(current.spacer, target.spacer, SPACER_LAMBDA, dt);
      }

      headerReveal.set(current.reveal);
      inPageTitleOpacity.set(clamp01(1 - current.reveal / IN_PAGE_OPACITY_REVEAL_DIVISOR));
      inPageTitleMaxHeight.set(current.spacer);
      writeFlightFromReveal({
        reveal: current.reveal,
        sourceSelector: "[data-dashboard-title-source]",
        targetSelector: "[data-dashboard-title-target]",
        motion: {
          titleFlightX,
          titleFlightY,
          titleFlightW,
          titleFlightReady,
        },
        enabled: mode === "mobile",
      });

      return nextSeeded;
    },
    isDesktop,
  );

  return {
    enabled: true,
    mode: isDesktop ? "desktop" : "mobile",
  };
}
