import type { TitleFlightSurfaceId } from "./surface-types";

export function isFeedTitleFlightPath(pathname: string) {
  return pathname === "/feed" || pathname.startsWith("/feed/");
}

export function isDashboardTitleFlightPath(pathname: string) {
  return pathname === "/profissional/dashboard" || pathname.startsWith("/profissional/dashboard/");
}

export function resolveTitleFlightSurfaceId(pathname: string): TitleFlightSurfaceId | null {
  if (isFeedTitleFlightPath(pathname)) {
    return "feed";
  }
  if (isDashboardTitleFlightPath(pathname)) {
    return "dashboard";
  }
  return null;
}
