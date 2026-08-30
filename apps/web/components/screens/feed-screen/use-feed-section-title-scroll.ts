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
  publishFeedHeaderTitleFlags,
  useFeedHeaderTitleMotion,
  type FeedHeaderTitleFlags,
  type FeedHeaderTitleMode,
} from "./feed-header-title-context";

const PUSH_CLEAR_BAND_MOBILE_PX = 56;
const PUSH_LAMBDA_DESKTOP = 14;
const PUSH_LAMBDA_MOBILE = 16;

interface UseFeedSectionTitleScrollArgs {
  hasPremium: boolean;
  hasStandard: boolean;
  mobileHeadingRef: RefObject<HTMLDivElement | null>;
  premiumSectionRef: RefObject<HTMLDivElement | null>;
  standardSectionRef: RefObject<HTMLDivElement | null>;
}

export function useFeedSectionTitleScroll({
  hasPremium,
  hasStandard,
  mobileHeadingRef,
  premiumSectionRef,
  standardSectionRef,
}: UseFeedSectionTitleScrollArgs): FeedHeaderTitleFlags {
  const motion = useFeedHeaderTitleMotion();
  const isTabActive = useIsTabActive();
  const isDesktop = useMatchDesktop();
  const stateRef = useRef({
    target: {
      push: 0,
      reveal: 0,
      spacer: IN_PAGE_TITLE_HEIGHT,
      divider: 1,
    },
    current: {
      push: 0,
      reveal: 0,
      spacer: IN_PAGE_TITLE_HEIGHT,
      divider: 1,
    },
  });

  useLayoutEffect(() => {
    publishFeedHeaderTitleFlags({
      enabled: hasPremium || hasStandard,
      mode: isDesktop ? "desktop" : "mobile",
      hasPremium,
      hasStandard,
    });

    if (!isTabActive) {
      motion.headerReveal.set(0);
      motion.titleFlightReady.set(0);
      motion.inPageTitleOpacity.set(1);
      motion.inPageTitleMaxHeight.set(IN_PAGE_TITLE_HEIGHT);
      motion.pushProgress.set(0);
      motion.standardDividerOpacity.set(hasStandard ? 1 : 0);
    }
  }, [hasPremium, hasStandard, isDesktop, isTabActive, motion]);

  useDampedScrollLoop(
    isTabActive,
    (dt, seeded) => {
      const {
        pushProgress,
        headerReveal,
        inPageTitleOpacity,
        inPageTitleMaxHeight,
        standardDividerOpacity,
        titleFlightX,
        titleFlightY,
        titleFlightW,
        titleFlightReady,
      } = motion;

      const { target, current } = stateRef.current;
      const headerBottom = headerOffsetPx();
      const canPush = hasPremium && hasStandard;
      const mode: FeedHeaderTitleMode = isDesktop ? "desktop" : "mobile";

      let reveal = 0;
      let push = 0;

      if (!hasPremium && !hasStandard) {
        reveal = 0;
        push = 0;
      } else if (mode === "desktop") {
        reveal = 1;

        if (canPush && premiumSectionRef.current) {
          const premiumBottom = premiumSectionRef.current.getBoundingClientRect().bottom;
          push = premiumBottom <= headerBottom ? 1 : 0;
        }
      } else {
        const revealTarget = hasPremium
          ? mobileHeadingRef.current
          : (mobileHeadingRef.current ?? standardSectionRef.current);

        if (revealTarget) {
          reveal = sampleMobileTitleReveal({
            targetTop: revealTarget.getBoundingClientRect().top,
            headerBottom,
            scrollY: window.scrollY,
          }).reveal;
        }

        if (canPush && premiumSectionRef.current) {
          const premiumBottom = premiumSectionRef.current.getBoundingClientRect().bottom;
          if (premiumBottom > headerBottom) {
            push = 0;
          } else {
            const start = headerBottom;
            const end = headerBottom - PUSH_CLEAR_BAND_MOBILE_PX;
            push = smootherstep(progressAcrossBand(premiumBottom, start, end));
          }
        }
      }

      target.push = push;
      target.reveal = reveal;

      if (mode === "desktop") {
        target.spacer = 0;
        target.divider = canPush ? clamp01(1 - push / 0.18) : hasStandard ? 0 : 1;
      } else {
        target.spacer = inPageSpacerFromReveal(target.reveal);
        target.divider =
          !hasPremium && hasStandard ? 0 : canPush ? clamp01(1 - push / 0.22) : hasStandard ? 1 : 0;
      }

      const revealLambda = mode === "mobile" ? REVEAL_LAMBDA_MOBILE : REVEAL_LAMBDA_DESKTOP;
      const pushLambda = mode === "mobile" ? PUSH_LAMBDA_MOBILE : PUSH_LAMBDA_DESKTOP;

      let nextSeeded = seeded;
      if (!seeded) {
        current.push = target.push;
        current.reveal = target.reveal;
        current.spacer = target.spacer;
        current.divider = target.divider;
        nextSeeded = true;
      } else {
        current.push = dampExp(current.push, target.push, pushLambda, dt);
        current.reveal = dampExp(current.reveal, target.reveal, revealLambda, dt);
        current.spacer = dampExp(current.spacer, target.spacer, SPACER_LAMBDA, dt);
        current.divider = dampExp(current.divider, target.divider, pushLambda, dt);
      }

      if (mode === "desktop" && hasPremium && hasStandard && premiumSectionRef.current) {
        const premiumVisible =
          premiumSectionRef.current.getBoundingClientRect().bottom > headerOffsetPx();
        current.push = premiumVisible ? 0 : 1;
      }

      pushProgress.set(current.push);
      headerReveal.set(current.reveal);
      inPageTitleOpacity.set(clamp01(1 - current.reveal / IN_PAGE_OPACITY_REVEAL_DIVISOR));
      inPageTitleMaxHeight.set(current.spacer);
      standardDividerOpacity.set(current.divider);
      writeFlightFromReveal({
        reveal: current.reveal,
        sourceSelector: "[data-feed-title-source]",
        targetSelector: "[data-feed-title-target]",
        motion: {
          titleFlightX,
          titleFlightY,
          titleFlightW,
          titleFlightReady,
        },
        enabled: mode === "mobile" && (hasPremium || hasStandard),
      });

      return nextSeeded;
    },
    `${isDesktop}:${hasPremium}:${hasStandard}`,
  );

  return {
    enabled: hasPremium || hasStandard,
    mode: isDesktop ? "desktop" : "mobile",
    hasPremium,
    hasStandard,
  };
}
