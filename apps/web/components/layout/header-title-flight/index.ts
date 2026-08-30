export {
  FLIGHT_SNAP_REVEAL,
  IN_PAGE_OPACITY_REVEAL_DIVISOR,
  IN_PAGE_TITLE_HEIGHT,
  LG_QUERY,
  REVEAL_LAMBDA_DESKTOP,
  REVEAL_LAMBDA_MOBILE,
  SPACER_LAMBDA,
  TITLE_STACK_PX,
} from "./constants";
export { createFlagsStore, getOrCreateGlobal, type FlagsStore } from "./flags-store";
export { HeaderTitleFlightRoot } from "./header-title-flight-root";
export {
  clamp01,
  dampExp,
  headerOffsetPx,
  inPageSpacerFromReveal,
  progressAcrossBand,
  readIsDesktop,
  sampleMobileTitleReveal,
  smootherstep,
} from "./math";
export { MobileLogoSwap } from "./mobile-logo-swap";
export { MobileTitleFlightPortal } from "./mobile-title-flight-portal";
export {
  getDashboardTitleFlightMotion,
  getFeedTitleFlightMotion,
  getTitleFlightRegistry,
  publishDashboardTitleFlightFlags,
  publishFeedTitleFlightFlags,
} from "./registry";
export {
  isDashboardTitleFlightPath,
  isFeedTitleFlightPath,
  resolveTitleFlightSurfaceId,
} from "./resolve-surface";
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
export { useDampedScrollLoop } from "./use-damped-scroll-loop";
export { useMatchDesktop } from "./use-match-desktop";
export {
  useActiveTitleFlightSurface,
  useDashboardTitleFlightFlags,
  useDashboardTitleFlightMotion,
  useFeedTitleFlightFlags,
  useFeedTitleFlightMotion,
  useTitleFlightSurfaceId,
  type ActiveTitleFlightSurface,
} from "./use-title-flight-surface";
export { writeFlightFromReveal, type TitleFlightMotionChannels } from "./write-flight";
