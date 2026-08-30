"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { UserPlus } from "lucide-react";
import { chromeCircle, chromePill, chromePillActive } from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";

function subscribeNoop() {
  return () => {};
}

function getClientMounted() {
  return true;
}

function getServerMounted() {
  return false;
}

export function GuestAuthControls() {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(subscribeNoop, getClientMounted, getServerMounted);

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
    <>
      <div className="relative lg:hidden">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={cn(chromeCircle, "text-wine-700")}
          aria-label="Entrar ou criar conta"
          aria-expanded={open}
        >
          <UserPlus size={18} aria-hidden />
        </button>
      </div>

      {mounted && open
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-60 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-900/20"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <Link
                href="/auth/login"
                className={cn(
                  chromePill,
                  "flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-zinc-900",
                )}
                onClick={() => setOpen(false)}
              >
                Entrar
              </Link>
              <Link
                href="/auth/cadastro"
                className={cn(
                  chromePillActive,
                  "mt-1.5 flex w-full items-center justify-center px-3 py-2.5 text-sm font-semibold",
                )}
                style={{ color: "#fff" }}
                onClick={() => setOpen(false)}
              >
                Criar conta
              </Link>
            </div>,
            document.body,
          )
        : null}

      <div className="hidden items-center gap-3 text-sm lg:flex">
        <Link
          href="/auth/login"
          className="font-medium text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 focus-visible:ring-offset-2"
        >
          Entrar
        </Link>
        <Link
          href="/auth/cadastro"
          className={cn(chromePillActive, "px-3 font-medium")}
          style={{ color: "#fff" }}
        >
          Criar conta
        </Link>
      </div>
    </>
  );
}
