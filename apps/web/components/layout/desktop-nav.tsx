"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { NavigationItem } from "@/lib/navigation";
import {
  getDirectionBetweenTabs,
  getTabHrefForPathname,
  saveCurrentTabScroll,
  setTabDirection,
} from "@/lib/tab-navigation";
import { cn } from "@/lib/utils";
import { useAuthSession } from "@/lib/auth-session";
import { getDashboardHref, useAccountNotifications } from "@/lib/account-notifications";
import type { AuthRole } from "@/lib/types";

interface DesktopNavProps {
  items: NavigationItem[];
  className?: string;
}

const pillTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 36,
  mass: 0.7,
};

export function DesktopNav({ items, className }: DesktopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuthSession();
  const safeRole = role === "visitor" ? null : (role as Exclude<AuthRole, "visitor">);
  const notifications = useAccountNotifications(safeRole ?? "cliente");
  const dashboardHref = getDashboardHref(role);
  const [activeTab, setActiveTab] = useState(pathname);
  const [previousPathname, setPreviousPathname] = useState(pathname);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false });

  if (pathname !== previousPathname) {
    setPreviousPathname(pathname);
    setActiveTab(pathname);
  }

  useEffect(() => {
    items.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [items, router]);

  const activeHref = getTabHrefForPathname(activeTab, items);

  const updateIndicator = useCallback(() => {
    const list = listRef.current;
    const itemEl = activeHref ? itemRefs.current.get(activeHref) : null;

    if (!list || !itemEl) {
      setIndicator((current) => (current.ready ? { ...current, ready: false } : current));
      return;
    }

    setIndicator({
      x: itemEl.offsetLeft,
      width: itemEl.offsetWidth,
      ready: true,
    });
  }, [activeHref]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateIndicator();
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [updateIndicator]);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "relative ml-0 h-12 w-64 max-w-64 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-white p-1 shadow-[0_2px_12px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <ul
        ref={listRef}
        className="relative grid h-full w-full items-stretch gap-0"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 h-full rounded-full bg-wine-700/90 shadow-[0_2px_8px_rgba(182,0,49,0.28)]"
          initial={false}
          animate={{
            x: indicator.x,
            width: indicator.width || 72,
          }}
          transition={indicator.ready ? pillTransition : { duration: 0 }}
          style={{
            left: 0,
            visibility: indicator.ready ? "visible" : "hidden",
          }}
        />
        {items.map((item) => {
          const active = activeHref === item.href;
          const isDashboardTab = item.href === dashboardHref;
          const notificationBadge = safeRole && isDashboardTab ? notifications.navbarBadgeCount : 0;

          return (
            <li
              key={item.href}
              ref={(node) => {
                if (node) {
                  itemRefs.current.set(item.href, node);
                } else {
                  itemRefs.current.delete(item.href);
                }
              }}
              className="relative z-10 min-w-0"
            >
              <motion.div
                className="h-full w-full"
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
              >
                <Link
                  href={item.href}
                  prefetch
                  onClick={() => {
                    if (isDashboardTab && safeRole) {
                      notifications.clearNavbarBadge();
                    }

                    if (activeHref === item.href) {
                      return;
                    }

                    saveCurrentTabScroll(pathname, items);
                    const direction = getDirectionBetweenTabs(pathname, item.href, items);
                    setTabDirection(direction);
                    setActiveTab(item.href);
                  }}
                  className={cn(
                    "inline-flex h-full min-w-0 w-full items-center justify-center gap-1.5 rounded-full px-2.5 text-[0.9375rem] font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 focus-visible:ring-offset-2",
                    active ? "text-white" : "text-zinc-700 hover:text-zinc-900",
                  )}
                  style={active ? { color: "#fff" } : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="truncate">{item.label}</span>
                  {notificationBadge > 0 ? (
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                        active ? "bg-white text-wine-700" : "bg-wine-700 text-white",
                      )}
                    >
                      {notificationBadge > 99 ? "99+" : notificationBadge}
                    </span>
                  ) : null}
                </Link>
              </motion.div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
