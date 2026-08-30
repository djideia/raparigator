"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

export type InfoHintProps = {
  id: string;
  label: string;
  children: ReactNode;
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  className?: string;
  align?: "start" | "center" | "end";
};

type PanelCoords = {
  top: number;
  left: number;
  width: number;
};

function computePanelCoords(trigger: DOMRect, align: "start" | "center" | "end"): PanelCoords {
  const margin = 8;
  const width = Math.min(320, window.innerWidth - margin * 2);
  let left = trigger.left;
  if (align === "end") left = trigger.right - width;
  if (align === "center") left = trigger.left + trigger.width / 2 - width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  let top = trigger.bottom + margin;
  const estimatedHeight = 220;
  if (top + estimatedHeight > window.innerHeight - margin) {
    top = Math.max(margin, trigger.top - estimatedHeight - margin);
  }
  return { top, left, width };
}

export function InfoHint({
  id,
  label,
  children,
  openId,
  onOpenChange,
  className,
  align = "start",
}: InfoHintProps) {
  const open = openId === id;
  const panelDomId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [coords, setCoords] = useState<PanelCoords | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const el = rootRef.current;
    if (!el) return;
    const place = () => {
      setCoords(computePanelCoords(el.getBoundingClientRect(), align));
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(null);
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const root = rootRef.current;
      const panel = panelRef.current;
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (root?.contains(target) || panel?.contains(target)) return;
      onOpenChange(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, onOpenChange]);

  const panel =
    open && coords ? (
      <motion.div
        ref={panelRef}
        id={panelDomId}
        role="dialog"
        data-testid={`info-hint-panel-${id}`}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 2 }}
        transition={
          reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 28 }
        }
        style={{ top: coords.top, left: coords.left, width: coords.width }}
        className="fixed z-[80] rounded-xl border border-zinc-200 bg-white p-3 text-left text-xs leading-relaxed text-zinc-600 shadow-lg"
      >
        {children}
      </motion.div>
    ) : null;

  return (
    <div ref={rootRef} className={cn("relative inline-flex shrink-0", className)}>
      <button
        type="button"
        data-testid={`info-hint-trigger-${id}`}
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelDomId}
        onClick={() => onOpenChange(open ? null : id)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500"
      >
        <CircleHelp className="h-3.5 w-3.5" aria-hidden />
      </button>
      {typeof document !== "undefined"
        ? createPortal(<AnimatePresence>{panel}</AnimatePresence>, document.body)
        : null}
    </div>
  );
}
