"use client";

export {
  getDashboardTitleFlightMotion,
  getFeedTitleFlightMotion,
  getTitleFlightRegistry,
  publishDashboardTitleFlightFlags,
  publishFeedTitleFlightFlags,
} from "./registry";
export {
  useActiveTitleFlightSurface,
  useDashboardTitleFlightFlags,
  useDashboardTitleFlightMotion,
  useFeedTitleFlightFlags,
  useFeedTitleFlightMotion,
  useTitleFlightSurfaceId,
  type ActiveTitleFlightSurface,
} from "./use-title-flight-surface";
export {
  DEFAULT_DASHBOARD_TITLE_FLIGHT_FLAGS,
  DEFAULT_FEED_TITLE_FLIGHT_FLAGS,
  type DashboardTitleFlightFlags,
  type DashboardTitleFlightMotion,
  type FeedTitleFlightFlags,
  type FeedTitleFlightMotion,
  type TitleFlightMode,
  type TitleFlightSurfaceId,
} from "./surface-types";
export {
  isDashboardTitleFlightPath,
  isFeedTitleFlightPath,
  resolveTitleFlightSurfaceId,
} from "./resolve-surface";
export { HeaderTitleFlightRoot } from "./header-title-flight-root";
