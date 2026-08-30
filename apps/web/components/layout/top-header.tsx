"use client";

import { usePathname } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import type { AuthRole, MockUser } from "@/lib/types";
import {
  chromeControlsRow,
  chromeGlassFixed,
  chromeSafeTop,
  shellContainerClass,
} from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { ChromeScrim } from "./chrome-scrim";
import {
  FeedHeaderDesktopTitle,
  HeaderTitleSlot,
} from "@/components/layout/header-title-flight/header-title-slot";
import { useActiveTitleFlightSurface } from "@/components/layout/header-title-flight/use-title-flight-surface";
import { DashboardHeaderDesktopTitle } from "@/components/screens/professional-dashboard/dashboard-header-desktop-title";
import { GuestAuthControls } from "./guest-auth-controls";
import { NotificationBellButton } from "./notification-bell-button";

interface TopHeaderProps {
  role: AuthRole;
  user: MockUser | null;
  isLoggedIn: boolean;
  onLogout: () => void;
  onBack?: () => void;
}

export function TopHeader({ role, user, isLoggedIn, onLogout, onBack }: TopHeaderProps) {
  const pathname = usePathname();
  const active = useActiveTitleFlightSurface(pathname);
  const feedDesktop =
    active?.id === "feed" && active.flags.enabled && active.flags.mode === "desktop";
  const dashboardDesktop =
    active?.id === "dashboard" && active.flags.enabled && active.flags.mode === "desktop";
  const showNotificationBell = isLoggedIn && role !== "visitor";

  return (
    <header className={cn(chromeGlassFixed, "pointer-events-none")}>
      <ChromeScrim />

      <div
        className={cn(
          chromeControlsRow,
          chromeSafeTop,
          "relative flex items-center gap-3 pb-3 sm:gap-4 md:pb-4",
          shellContainerClass,
        )}
      >
        {feedDesktop ? <FeedHeaderDesktopTitle /> : null}
        {dashboardDesktop ? <DashboardHeaderDesktopTitle /> : null}

        <div className="relative z-20 flex min-w-0 flex-1 items-center gap-3 md:gap-5">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
            <BackButton onBack={onBack} />
            <HeaderTitleSlot />
          </div>
        </div>

        <div className="relative z-20 flex shrink-0 items-center gap-2">
          {isLoggedIn ? (
            <>
              {showNotificationBell ? <NotificationBellButton role={role} /> : null}
              <AccountMenu role={role} user={user} onLogout={onLogout} />
            </>
          ) : (
            <GuestAuthControls />
          )}
        </div>
      </div>
    </header>
  );
}
