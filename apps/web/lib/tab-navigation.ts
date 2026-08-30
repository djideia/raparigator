import type { NavigationItem } from "@/lib/navigation";

export type TabDirection = -1 | 0 | 1;

type TabNavigationState = {
  mobileNavHidden: boolean;
  shellActive: boolean;
};

const listeners = new Set<() => void>();

let shellCount = 0;
let pendingDirection: TabDirection = 0;
const scrollByTab = new Map<string, number>();

let state: TabNavigationState = {
  mobileNavHidden: false,
  shellActive: false,
};

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeTabNavigation(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getShellActiveSnapshot(): boolean {
  return state.shellActive;
}

export function getMobileNavHiddenSnapshot(): boolean {
  return state.mobileNavHidden;
}

export function getTabDirectionSnapshot(): TabDirection {
  return pendingDirection;
}

export function setTabDirection(direction: TabDirection) {
  pendingDirection = direction;
}

export function consumeTabDirection(): TabDirection {
  const current = pendingDirection;
  pendingDirection = 0;
  return current;
}

export function getTabHrefForPathname(pathname: string, items: NavigationItem[]): string | null {
  const index = getTabIndex(pathname, items);
  if (index < 0) {
    return null;
  }

  return items[index]?.href ?? null;
}

export function saveTabScroll(href: string, y: number) {
  scrollByTab.set(href, Math.max(0, y));
}

export function getTabScroll(href: string): number {
  return scrollByTab.get(href) ?? 0;
}

export function saveCurrentTabScroll(pathname: string, items: NavigationItem[]) {
  const href = getTabHrefForPathname(pathname, items);
  if (!href || typeof window === "undefined") {
    return;
  }

  saveTabScroll(href, window.scrollY);
}

export function restoreTabScroll(pathname: string, items: NavigationItem[]) {
  const href = getTabHrefForPathname(pathname, items);
  if (!href || typeof window === "undefined") {
    return;
  }

  window.scrollTo({ top: getTabScroll(href), left: 0, behavior: "instant" });
}

export function setMobileNavHidden(hidden: boolean) {
  if (state.mobileNavHidden === hidden) {
    return;
  }

  state = { ...state, mobileNavHidden: hidden };
  emit();
}

function syncShellActive() {
  const next = shellCount > 0;
  if (state.shellActive === next) {
    return;
  }

  state = {
    ...state,
    shellActive: next,
    mobileNavHidden: next ? state.mobileNavHidden : false,
  };
  emit();
}

export function registerShell() {
  shellCount += 1;
  syncShellActive();
}

export function unregisterShell() {
  shellCount = Math.max(0, shellCount - 1);
  queueMicrotask(() => {
    syncShellActive();
  });
}

export function getTabIndex(pathname: string, items: NavigationItem[]): number {
  const direct = items.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  if (direct >= 0) {
    return direct;
  }

  if (pathname.startsWith("/anuncio/") || pathname.startsWith("/p/")) {
    return items.findIndex((item) => item.href === "/feed");
  }

  return -1;
}

export function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function getDirectionBetweenTabs(
  fromPathname: string,
  toHref: string,
  items: NavigationItem[],
): TabDirection {
  const fromIndex = getTabIndex(fromPathname, items);
  const toIndex = getTabIndex(toHref, items);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return 0;
  }

  return toIndex > fromIndex ? 1 : -1;
}
