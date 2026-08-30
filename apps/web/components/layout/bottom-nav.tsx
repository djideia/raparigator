"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { motion } from "motion/react";
import type { NavigationItem } from "@/lib/navigation";
import {
  getDirectionBetweenTabs,
  getTabHrefForPathname,
  saveCurrentTabScroll,
  setTabDirection,
} from "@/lib/tab-navigation";
import { cn } from "@/lib/utils";
import {
  ensureChatStore,
  getChatUnreadCount,
  getServerChatStoreSnapshot,
  subscribeChatStore,
} from "@/lib/chat-store";
import { useAuthSession } from "@/lib/auth-session";
import { getDashboardHref, useAccountNotifications } from "@/lib/account-notifications";
import type { AuthRole } from "@/lib/types";

interface BottomNavProps {
  items: NavigationItem[];
}

const pillTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 36,
  mass: 0.7,
};

function NavIconSvg({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <svg
      className={cn("transition-colors duration-200", active ? "text-white" : "text-zinc-700")}
      style={active ? { color: "#fff" } : undefined}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#ffffff" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Badge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-wine-700 px-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function getNavIcon(
  label: string,
  href: string,
  active: boolean,
  chatUnreadCount: number = 0,
  notificationBadgeCount: number = 0,
) {
  if (label === "Feed" || href === "/feed") {
    return (
      <NavIconSvg active={active}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10.5V20h14v-9.5" />
        <path d="M9 20v-6h6v6" />
      </NavIconSvg>
    );
  }

  if (label === "Painel" || href.includes("dashboard")) {
    return (
      <div className="relative flex items-center justify-center">
        <NavIconSvg active={active}>
          <path d="M4 4h7v7H4z" />
          <path d="M13 4h7v4h-7z" />
          <path d="M13 10h7v10h-7z" />
          <path d="M4 13h7v7H4z" />
        </NavIconSvg>
        <Badge count={notificationBadgeCount} />
      </div>
    );
  }

  if (label === "Chat" || href === "/chat") {
    return (
      <div className="relative flex items-center justify-center">
        <NavIconSvg active={active}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </NavIconSvg>
        <Badge count={chatUnreadCount} />
      </div>
    );
  }

  if (label === "Anúncios" || href.includes("anuncios")) {
    return (
      <NavIconSvg active={active}>
        <path d="M4 11.5v1a2 2 0 0 0 2 2h2l5 4v-4h3a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Z" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </NavIconSvg>
    );
  }

  return (
    <NavIconSvg active={active}>
      <circle cx="12" cy="12" r="8" />
    </NavIconSvg>
  );
}

export function BottomNav({ items }: BottomNavProps) {
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

  const hasChat = items.some((item) => item.label === "Chat" || item.href === "/chat");
  const unreadCount = useSyncExternalStore(subscribeChatStore, getChatUnreadCount, () =>
    getServerChatStoreSnapshot().conversations.reduce(
      (total, conversation) => total + (conversation.unread || 0),
      0,
    ),
  );

  useEffect(() => {
    if (!hasChat) {
      return;
    }
    ensureChatStore();
  }, [hasChat, pathname]);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 md:hidden"
      aria-label="Navegação principal"
    >
      <div className="pointer-events-auto relative isolate w-max overflow-hidden rounded-full border border-white/40 bg-white/30 shadow-[0_12px_32px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.7)] backdrop-blur-3xl backdrop-saturate-200 supports-backdrop-filter:bg-white/20">
        <div className="pointer-events-none absolute inset-0 z-0 rounded-full bg-linear-to-b from-white/50 via-white/10 to-transparent mix-blend-overlay" />
        <ul
          ref={listRef}
          className="relative z-10 flex items-center justify-center gap-2 px-2 py-2"
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute top-2 z-0 h-12 rounded-full bg-wine-700/90 shadow-[0_4px_20px_rgba(159,18,57,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]"
            initial={false}
            animate={{
              x: indicator.x,
              width: indicator.width || 56,
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
            const notificationBadge =
              safeRole && isDashboardTab ? notifications.navbarBadgeCount : 0;
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
                className="relative flex h-12 w-14 items-center justify-center"
              >
                <motion.div
                  className="relative z-10 h-full w-full"
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                >
                  <Link
                    href={item.href}
                    prefetch
                    aria-label={item.label}
                    title={item.label}
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
                      "relative z-20 flex h-full w-full items-center justify-center rounded-full",
                      active ? "text-white [&_svg]:text-white" : "text-zinc-600",
                    )}
                    style={active ? { color: "#fff" } : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    {getNavIcon(item.label, item.href, active, unreadCount, notificationBadge)}
                  </Link>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
