import type { MotionValue } from "motion/react";

export type TitleFlightSurfaceId = "feed" | "dashboard";

export type TitleFlightMode = "desktop" | "mobile";

export type FeedTitleFlightFlags = {
  enabled: boolean;
  mode: TitleFlightMode;
  hasPremium: boolean;
  hasStandard: boolean;
};

export type DashboardTitleFlightFlags = {
  enabled: boolean;
  mode: TitleFlightMode;
};

export type FeedTitleFlightMotion = {
  pushProgress: MotionValue<number>;
  headerReveal: MotionValue<number>;
  inPageTitleOpacity: MotionValue<number>;
  inPageTitleMaxHeight: MotionValue<number>;
  standardDividerOpacity: MotionValue<number>;
  titleFlightX: MotionValue<number>;
  titleFlightY: MotionValue<number>;
  titleFlightW: MotionValue<number>;
  titleFlightReady: MotionValue<number>;
};

export type DashboardTitleFlightMotion = {
  headerReveal: MotionValue<number>;
  inPageTitleOpacity: MotionValue<number>;
  inPageTitleMaxHeight: MotionValue<number>;
  titleFlightX: MotionValue<number>;
  titleFlightY: MotionValue<number>;
  titleFlightW: MotionValue<number>;
  titleFlightReady: MotionValue<number>;
};

export const DEFAULT_FEED_TITLE_FLIGHT_FLAGS: FeedTitleFlightFlags = {
  enabled: false,
  mode: "desktop",
  hasPremium: false,
  hasStandard: false,
};

export const DEFAULT_DASHBOARD_TITLE_FLIGHT_FLAGS: DashboardTitleFlightFlags = {
  enabled: false,
  mode: "desktop",
};
