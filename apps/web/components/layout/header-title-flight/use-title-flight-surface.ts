"use client";

import { useSyncExternalStore } from "react";
import {
  getDashboardTitleFlightMotion,
  getFeedTitleFlightMotion,
  getTitleFlightRegistry,
} from "./registry";
import { resolveTitleFlightSurfaceId } from "./resolve-surface";
import {
  DEFAULT_DASHBOARD_TITLE_FLIGHT_FLAGS,
  DEFAULT_FEED_TITLE_FLIGHT_FLAGS,
  type DashboardTitleFlightFlags,
  type DashboardTitleFlightMotion,
  type FeedTitleFlightFlags,
  type FeedTitleFlightMotion,
  type TitleFlightSurfaceId,
} from "./surface-types";

export function useFeedTitleFlightFlags(): FeedTitleFlightFlags {
  const store = getTitleFlightRegistry().feed.flagsStore;
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => DEFAULT_FEED_TITLE_FLIGHT_FLAGS,
  );
}

export function useDashboardTitleFlightFlags(): DashboardTitleFlightFlags {
  const store = getTitleFlightRegistry().dashboard.flagsStore;
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => DEFAULT_DASHBOARD_TITLE_FLIGHT_FLAGS,
  );
}

export function useFeedTitleFlightMotion(): FeedTitleFlightMotion {
  return getFeedTitleFlightMotion();
}

export function useDashboardTitleFlightMotion(): DashboardTitleFlightMotion {
  return getDashboardTitleFlightMotion();
}

export type ActiveTitleFlightSurface =
  | {
      id: "feed";
      flags: FeedTitleFlightFlags;
      motion: FeedTitleFlightMotion;
    }
  | {
      id: "dashboard";
      flags: DashboardTitleFlightFlags;
      motion: DashboardTitleFlightMotion;
    };

export function useActiveTitleFlightSurface(pathname: string): ActiveTitleFlightSurface | null {
  const id = resolveTitleFlightSurfaceId(pathname);
  const feedFlags = useFeedTitleFlightFlags();
  const dashboardFlags = useDashboardTitleFlightFlags();

  if (id === "feed") {
    return {
      id,
      flags: feedFlags,
      motion: getFeedTitleFlightMotion(),
    };
  }

  if (id === "dashboard") {
    return {
      id,
      flags: dashboardFlags,
      motion: getDashboardTitleFlightMotion(),
    };
  }

  return null;
}

export function useTitleFlightSurfaceId(pathname: string): TitleFlightSurfaceId | null {
  return resolveTitleFlightSurfaceId(pathname);
}
