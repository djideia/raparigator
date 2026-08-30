"use client";

import { PropsWithChildren, useLayoutEffect, type ReactNode } from "react";
import { useAuthSession } from "@/lib/auth-session";
import { getNavigationItems } from "@/lib/navigation";
import {
  chromeDesktopNavSticky,
  chromeHeaderOffset,
  shellContainerClass,
} from "@/lib/chrome-styles";
import { registerShell, setMobileNavHidden, unregisterShell } from "@/lib/tab-navigation";
import { cn } from "@/lib/utils";
import { useShellChrome } from "./shell-chrome";
import { TopHeader } from "./top-header";
import { DesktopNav } from "./desktop-nav";

interface AppShellProps extends PropsWithChildren {
  location?: string;
  hideMobileBottomNav?: boolean;
  hideTopHeader?: boolean;
  hideDesktopNav?: boolean;
  onBack?: () => void;
  mainClassName?: string;
  desktopNavRight?: ReactNode;
}

export function AppShell({
  children,
  hideMobileBottomNav: hideMobileBottomNavProp,
  hideTopHeader: hideTopHeaderProp,
  hideDesktopNav: hideDesktopNavProp,
  onBack: onBackProp,
  mainClassName: mainClassNameProp,
  desktopNavRight: desktopNavRightProp,
}: AppShellProps) {
  const { role, user, isLoggedIn, logout } = useAuthSession();
  const navigationItems = getNavigationItems(role);
  const chrome = useShellChrome();
  const hideMobileBottomNav = hideMobileBottomNavProp ?? chrome.hideMobileBottomNav;
  const hideTopHeader = hideTopHeaderProp ?? chrome.hideTopHeader;
  const hideDesktopNav = hideDesktopNavProp ?? chrome.hideDesktopNav;
  const onBack = onBackProp ?? chrome.onBack;
  const mainClassName = mainClassNameProp ?? chrome.mainClassName;
  const desktopNavRight = desktopNavRightProp ?? chrome.desktopNavRight;

  useLayoutEffect(() => {
    registerShell();
    return () => {
      unregisterShell();
    };
  }, []);

  useLayoutEffect(() => {
    setMobileNavHidden(hideMobileBottomNav);
  }, [hideMobileBottomNav]);

  return (
    <div className="min-h-dvh bg-zinc-50" data-app-shell>
      {hideTopHeader ? null : (
        <TopHeader
          role={role}
          user={user}
          isLoggedIn={isLoggedIn}
          onLogout={logout}
          onBack={onBack}
        />
      )}
      <main
        className={cn(
          shellContainerClass,
          hideMobileBottomNav
            ? "pb-6 md:pb-10"
            : "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-10",
          !hideTopHeader && chromeHeaderOffset,
          mainClassName,
        )}
      >
        {!hideDesktopNav && navigationItems.length > 0 ? (
          <div
            className={cn(
              chromeDesktopNavSticky,
              "mb-4 hidden items-center justify-between gap-4 md:flex",
            )}
          >
            <DesktopNav items={navigationItems} className="min-w-0 flex-1" />
            {desktopNavRight ? (
              <div className="flex shrink-0 items-center gap-3">{desktopNavRight}</div>
            ) : null}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
