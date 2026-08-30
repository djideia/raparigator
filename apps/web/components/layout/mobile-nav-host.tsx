"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useAuthSession } from "@/lib/auth-session";
import { getNavigationItems } from "@/lib/navigation";
import {
  getMobileNavHiddenSnapshot,
  getShellActiveSnapshot,
  isAdminRoute,
  subscribeTabNavigation,
} from "@/lib/tab-navigation";
import { BottomNav } from "./bottom-nav";

export function MobileNavHost() {
  const pathname = usePathname();
  const { role } = useAuthSession();
  const navigationItems = getNavigationItems(role);
  const shellActive = useSyncExternalStore(
    subscribeTabNavigation,
    getShellActiveSnapshot,
    () => false,
  );
  const mobileNavHidden = useSyncExternalStore(
    subscribeTabNavigation,
    getMobileNavHiddenSnapshot,
    () => false,
  );

  if (isAdminRoute(pathname) || !shellActive || mobileNavHidden || navigationItems.length === 0) {
    return null;
  }

  return <BottomNav items={navigationItems} />;
}
