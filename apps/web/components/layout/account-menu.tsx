"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { AuthRole, MockUser } from "@/lib/types";
import { getProfileHref, getRoleLabel } from "@/lib/navigation";
import { chromeCircle } from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";

interface AccountMenuProps {
  role: AuthRole;
  user: MockUser | null;
  onLogout: () => void;
}

function subscribeNoop() {
  return () => {};
}

function getClientMounted() {
  return true;
}

function getServerMounted() {
  return false;
}

export function AccountMenu({ role, user, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(subscribeNoop, getClientMounted, getServerMounted);
  const profileHref = getProfileHref(role);
  const roleLabel = getRoleLabel(role);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      return;
    }

    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setMenuPos({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(chromeCircle, "text-zinc-900")}
        aria-label={`Abrir opções da conta ${roleLabel}${user ? ` · ${user.fullName}` : ""}`}
        aria-expanded={open}
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
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      {mounted && open
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-60 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-900/20"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <div className="border-b border-zinc-100 px-3 py-2.5">
                <p className="text-sm font-semibold text-zinc-900">{user?.fullName ?? roleLabel}</p>
                <p className="text-xs text-zinc-500">{roleLabel}</p>
              </div>
              <Link
                href={profileHref}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
                onClick={() => setOpen(false)}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-900 ring-1 ring-zinc-300">
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
                  >
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span>Gerenciar sua conta</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-200">
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
                  >
                    <path d="M10 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5" />
                    <path d="M15 12H3" />
                    <path d="m18 8 4 4-4 4" />
                    <path d="M22 12H15" />
                  </svg>
                </span>
                <span>Sair da conta</span>
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
