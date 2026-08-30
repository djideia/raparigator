"use client";

import { motionValue } from "motion/react";
import { createFlagsStore, getOrCreateGlobal, type FlagsStore } from "./flags-store";
import {
  DEFAULT_DASHBOARD_TITLE_FLIGHT_FLAGS,
  DEFAULT_FEED_TITLE_FLIGHT_FLAGS,
  type DashboardTitleFlightFlags,
  type DashboardTitleFlightMotion,
  type FeedTitleFlightFlags,
  type FeedTitleFlightMotion,
} from "./surface-types";

export type TitleFlightSurfaceSlot<Flags, Motion> = {
  flagsStore: FlagsStore<Flags>;
  motion: Motion;
};

export type TitleFlightRegistry = {
  feed: TitleFlightSurfaceSlot<FeedTitleFlightFlags, FeedTitleFlightMotion>;
  dashboard: TitleFlightSurfaceSlot<DashboardTitleFlightFlags, DashboardTitleFlightMotion>;
};

const REGISTRY_KEY = "__raparigatorTitleFlightRegistry_v1";

function createFeedMotion(): FeedTitleFlightMotion {
  return {
    pushProgress: motionValue(0),
    headerReveal: motionValue(0),
    inPageTitleOpacity: motionValue(1),
    inPageTitleMaxHeight: motionValue(48),
    standardDividerOpacity: motionValue(1),
    titleFlightX: motionValue(0),
    titleFlightY: motionValue(0),
    titleFlightW: motionValue(0),
    titleFlightReady: motionValue(0),
  };
}

function createDashboardMotion(): DashboardTitleFlightMotion {
  return {
    headerReveal: motionValue(0),
    inPageTitleOpacity: motionValue(1),
    inPageTitleMaxHeight: motionValue(40),
    titleFlightX: motionValue(0),
    titleFlightY: motionValue(0),
    titleFlightW: motionValue(0),
    titleFlightReady: motionValue(0),
  };
}

function createRegistry(): TitleFlightRegistry {
  return {
    feed: {
      flagsStore: createFlagsStore<FeedTitleFlightFlags>(
        DEFAULT_FEED_TITLE_FLIGHT_FLAGS,
        (prev, next) =>
          prev.enabled === next.enabled &&
          prev.mode === next.mode &&
          prev.hasPremium === next.hasPremium &&
          prev.hasStandard === next.hasStandard,
      ),
      motion: createFeedMotion(),
    },
    dashboard: {
      flagsStore: createFlagsStore<DashboardTitleFlightFlags>(
        DEFAULT_DASHBOARD_TITLE_FLIGHT_FLAGS,
        (prev, next) => prev.enabled === next.enabled && prev.mode === next.mode,
      ),
      motion: createDashboardMotion(),
    },
  };
}

export function getTitleFlightRegistry(): TitleFlightRegistry {
  return getOrCreateGlobal(REGISTRY_KEY, createRegistry);
}

export function publishFeedTitleFlightFlags(flags: FeedTitleFlightFlags) {
  getTitleFlightRegistry().feed.flagsStore.setFlags(flags);
}

export function publishDashboardTitleFlightFlags(flags: DashboardTitleFlightFlags) {
  getTitleFlightRegistry().dashboard.flagsStore.setFlags(flags);
}

export function getFeedTitleFlightMotion() {
  return getTitleFlightRegistry().feed.motion;
}

export function getDashboardTitleFlightMotion() {
  return getTitleFlightRegistry().dashboard.motion;
}
