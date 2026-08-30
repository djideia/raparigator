"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { AuthRole } from "@/lib/types";
import { getNotificationHref, useAccountNotifications } from "@/lib/account-notifications";
import { chromeCircle } from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";
import { NotificationsCenter } from "./notifications-center";

interface NotificationBellButtonProps {
  role: Exclude<AuthRole, "visitor">;
  className?: string;
}

const swingTransition = {
  duration: 0.55,
  ease: [0.34, 1.3, 0.64, 1] as const,
};

export function NotificationBellButton({ role, className }: NotificationBellButtonProps) {
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const previousUnread = useRef<number | null>(null);
  const {
    unreadCount,
    unreadItems,
    readItems,
    navbarBadgeCount,
    swingPaused,
    markAsRead,
    markAllAsRead,
    pauseNotificationSwing,
    resumeNotificationSwing,
  } = useAccountNotifications(role);

  useEffect(() => {
    if (previousUnread.current === null) {
      previousUnread.current = unreadCount;
      return;
    }

    if (navbarBadgeCount > 0 || unreadCount > previousUnread.current) {
      resumeNotificationSwing();
    }

    previousUnread.current = unreadCount;
  }, [unreadCount, navbarBadgeCount, resumeNotificationSwing]);

  const shouldSwing = !reducedMotion && unreadCount > 0 && !swingPaused && !open;

  const handleOpen = () => {
    pauseNotificationSwing();
    setOpen(true);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={handleOpen}
        className={cn(chromeCircle, "relative text-zinc-900", className)}
        aria-label="Abrir central de notificações"
        aria-expanded={open}
        animate={
          shouldSwing
            ? {
                rotate: [0, -14, 12, -10, 8, -4, 0],
                transition: {
                  ...swingTransition,
                  repeat: Infinity,
                  repeatDelay: 2.4,
                },
              }
            : { rotate: 0 }
        }
        style={{ transformOrigin: "top center" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.17V11a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v3.17a2 2 0 0 1-.6 1.43L4 17h5" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-wine-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </motion.button>

      {open ? (
        <NotificationsCenter
          unreadItems={unreadItems}
          readItems={readItems}
          onClose={() => setOpen(false)}
          onMarkAllAsRead={markAllAsRead}
          onSelect={(notification) => {
            markAsRead(notification.id);
            setOpen(false);
            window.location.href = getNotificationHref(notification);
          }}
        />
      ) : null}
    </>
  );
}
