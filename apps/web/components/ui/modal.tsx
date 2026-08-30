"use client";

import { ReactNode, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useModalLock } from "@/lib/modal-lock";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export type ModalScrollAvailability = {
  canScrollDown: boolean;
  reachedEnd: boolean;
};

const SCROLL_END_THRESHOLD_PX = 20;

interface ModalProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  actions?: ReactNode | null;
  headerActions?: ReactNode;
  size?: "sm" | "md";
  mobileCentered?: boolean;
  titleClassName?: string;
  scrollResetKey?: string | number;
  onScrollAvailabilityChange?: (state: ModalScrollAvailability) => void;
  showScrollHint?: boolean;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  actions,
  headerActions,
  size = "sm",
  mobileCentered = false,
  titleClassName,
  scrollResetKey,
  onScrollAvailabilityChange,
  showScrollHint = false,
}: ModalProps) {
  useModalLock(open);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onScrollAvailabilityChangeRef = useRef(onScrollAvailabilityChange);

  useEffect(() => {
    onScrollAvailabilityChangeRef.current = onScrollAvailabilityChange;
  }, [onScrollAvailabilityChange]);

  const measureScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    const canScrollDown = maxScroll > 1;
    const reachedEnd = !canScrollDown || el.scrollTop >= maxScroll - SCROLL_END_THRESHOLD_PX;
    onScrollAvailabilityChangeRef.current?.({ canScrollDown, reachedEnd });
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;

    measureScroll();
    el.addEventListener("scroll", measureScroll, { passive: true });
    const ro = new ResizeObserver(() => measureScroll());
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    return () => {
      el.removeEventListener("scroll", measureScroll);
      ro.disconnect();
    };
  }, [open, scrollResetKey, children, measureScroll]);

  useEffect(() => {
    if (!open || scrollResetKey === undefined) return;
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    const id = window.setTimeout(() => measureScroll(), 50);
    return () => window.clearTimeout(id);
  }, [open, scrollResetKey, measureScroll]);

  if (!open) return null;

  const resolvedActions =
    actions === undefined ? (
      <Button variant="secondary" fullWidth onClick={onClose}>
        Fechar
      </Button>
    ) : (
      actions
    );

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-220 flex bg-zinc-900/50 px-3 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] touch-none sm:px-4 sm:items-center sm:justify-center",
        mobileCentered ? "items-center" : "items-end",
        "animate-[modal-overlay-in_200ms_ease-out_forwards]",
      )}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "flex w-full flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-5",
          mobileCentered ? "max-h-[min(92dvh,48rem)]" : "max-h-[min(94dvh,48rem)]",
          size === "md" ? "sm:max-w-2xl" : "sm:max-w-md",
          "animate-[modal-content-in_300ms_ease-out_forwards]",
        )}
        style={{
          maxHeight: mobileCentered
            ? "calc(92dvh - max(1rem, env(safe-area-inset-top)) - max(1rem, env(safe-area-inset-bottom)))"
            : "calc(94dvh - max(1rem, env(safe-area-inset-top)) - max(1rem, env(safe-area-inset-bottom)))",
        }}
      >
        <div
          className={cn(
            "flex justify-between gap-3 sm:gap-4",
            description ? "mb-4 items-start" : "mb-3 items-center",
          )}
        >
          <div className={cn("min-w-0", description ? "space-y-1" : undefined)}>
            <h3
              className={cn(
                "font-semibold leading-tight",
                titleClassName ?? "text-lg text-zinc-900 sm:text-lg",
              )}
            >
              {title}
            </h3>
            {description ? (
              typeof description === "string" ? (
                <p className="text-sm leading-snug text-zinc-600">{description}</p>
              ) : (
                description
              )
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              type="button"
              aria-label="Fechar modal"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={scrollRef}
            data-testid="modal-scroll"
            className="modal-scroll min-h-0 flex-1 overflow-y-auto px-0.5 pr-1 overscroll-contain touch-pan-y pb-4 sm:px-1"
          >
            {children}
          </div>
          {showScrollHint ? (
            <div
              data-testid="modal-scroll-hint"
              className="pointer-events-none absolute inset-x-0 bottom-0 flex h-14 items-end justify-center bg-linear-to-t from-white via-white/80 to-transparent pb-1"
              aria-hidden="true"
            >
              <motion.span
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="text-zinc-400"
              >
                <ChevronDown className="h-5 w-5" />
              </motion.span>
            </div>
          ) : null}
        </div>

        {resolvedActions ? (
          <div
            className={cn(
              "flex shrink-0 gap-2 border-t border-zinc-100 bg-white pt-4 mt-2",
              mobileCentered ? "flex-col sm:flex-row" : "flex-col sm:flex-row",
            )}
          >
            {resolvedActions}
          </div>
        ) : null}
      </div>
      <button aria-label="Fechar modal" className="absolute inset-0 -z-10" onClick={onClose} />
      <style jsx>{`
        @keyframes modal-overlay-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes modal-content-in {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .modal-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
      `}</style>
    </div>,
    document.body,
  );
}
