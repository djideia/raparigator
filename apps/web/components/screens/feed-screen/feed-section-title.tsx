"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedSectionTitleVariant = "premium" | "standard";

interface FeedSectionTitleProps {
  variant: FeedSectionTitleVariant;
  size?: "md" | "sm" | "lg";
  className?: string;
  fit?: boolean;
  fitToTarget?: boolean;
}

const PREMIUM_LABEL = "Modelos Premium";
const STANDARD_LABEL = "Outras modelos";
const FIT_MIN_PX = 15;
const FIT_MAX_PX = 30;
const FIT_MAX_HEADER_PX = 24;

function applyProbe(
  label: HTMLElement,
  icon: HTMLElement | null,
  fontPx: number,
  showIcon: boolean,
) {
  label.style.fontSize = `${fontPx}px`;
  if (!icon) {
    return;
  }

  if (showIcon) {
    const iconSize = Math.max(16, Math.round(fontPx * 0.95));
    icon.style.display = "block";
    icon.style.width = `${iconSize}px`;
    icon.style.height = `${iconSize}px`;
  } else {
    icon.style.display = "none";
  }
}

function largestFit(
  root: HTMLElement,
  label: HTMLElement,
  icon: HTMLElement | null,
  available: number,
  withIcon: boolean,
  maxPx: number,
) {
  let low = FIT_MIN_PX;
  let high = maxPx;
  let best = FIT_MIN_PX;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    applyProbe(label, icon, mid, withIcon);

    if (root.scrollWidth <= available + 0.5) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  applyProbe(label, icon, best, withIcon);
  return best;
}

function readFitAvailable(root: HTMLElement, fitToTarget: boolean) {
  if (fitToTarget) {
    const target = document.querySelector<HTMLElement>("[data-feed-title-target]");
    if (target && target.clientWidth > 0) {
      return target.clientWidth;
    }
  }

  return root.clientWidth;
}

export function FeedSectionTitle({
  variant,
  size = "md",
  className,
  fit = false,
  fitToTarget = false,
}: FeedSectionTitleProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [fitPx, setFitPx] = useState(22);
  const [showIcon, setShowIcon] = useState(true);

  useLayoutEffect(() => {
    if (!fit) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    let frame = 0;
    let lastMeasuredWidth = -1;

    const measure = () => {
      const label = root.querySelector("[data-title-label]") as HTMLElement | null;
      const icon = root.querySelector("[data-title-icon]") as HTMLElement | null;
      const available = readFitAvailable(root, fitToTarget);
      if (!label || available <= 0) {
        return;
      }

      if (lastMeasuredWidth > 0 && Math.abs(available - lastMeasuredWidth) < 1.5) {
        return;
      }

      const prevWidth = root.style.width;
      const prevMaxWidth = root.style.maxWidth;
      root.style.width = `${available}px`;
      root.style.maxWidth = `${available}px`;

      const maxPx = fitToTarget ? FIT_MAX_HEADER_PX : FIT_MAX_PX;
      applyProbe(label, icon, FIT_MIN_PX, true);
      const withIcon = root.scrollWidth <= available + 0.5;
      const best = largestFit(root, label, icon, available, withIcon, maxPx);
      lastMeasuredWidth = available;

      root.style.width = prevWidth;
      root.style.maxWidth = prevMaxWidth;

      setShowIcon((prev) => (prev === withIcon ? prev : withIcon));
      setFitPx((prev) => (prev === best ? prev : best));
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(schedule);
    observer.observe(root);

    const target = fitToTarget
      ? document.querySelector<HTMLElement>("[data-feed-title-target]")
      : null;
    if (target) {
      observer.observe(target);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [fit, fitToTarget, variant]);

  const iconSize = fit ? Math.max(16, Math.round(fitPx * 0.95)) : size === "lg" ? 26 : 22;

  const premiumTextClass = fit
    ? "leading-none"
    : size === "lg"
      ? "text-2xl md:text-3xl"
      : size === "sm"
        ? "text-[1.375rem] leading-none"
        : "text-2xl";

  const standardTextClass = fit
    ? "leading-none"
    : size === "lg"
      ? "text-xl md:text-2xl"
      : size === "sm"
        ? "text-[1.375rem] leading-none"
        : "text-xl";

  const labelStyle = fit ? { fontSize: fitPx } : undefined;
  const iconStyle = fit
    ? {
        display: showIcon ? "block" : "none",
        width: iconSize,
        height: iconSize,
      }
    : undefined;

  const ambientStyle = {
    filter: "drop-shadow(0 1px 1px rgba(15,23,42,0.28)) drop-shadow(0 2px 6px rgba(15,23,42,0.16))",
  };

  if (variant === "premium") {
    return (
      <span
        ref={rootRef}
        className={cn(
          "inline-flex max-w-full min-w-0 items-center gap-1.5 select-none",
          fit && "w-full",
          className,
        )}
        style={ambientStyle}
      >
        <Star
          data-title-icon
          size={iconSize}
          className="shrink-0 fill-[#A67C12] text-[#A67C12]"
          style={iconStyle}
        />
        <span
          data-title-label
          className={cn(
            "whitespace-nowrap font-display font-semibold tracking-wide text-[#5C4310]",
            premiumTextClass,
          )}
          style={labelStyle}
        >
          {PREMIUM_LABEL}
        </span>
      </span>
    );
  }

  return (
    <span
      ref={rootRef}
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-1.5 select-none",
        fit && "w-full",
        className,
      )}
      style={ambientStyle}
    >
      <Flame
        data-title-icon
        size={fit ? iconSize : size === "lg" ? 22 : iconSize}
        className="shrink-0 text-wine-700"
        style={iconStyle}
      />
      <span
        data-title-label
        className={cn("whitespace-nowrap font-semibold text-wine-700", standardTextClass)}
        style={labelStyle}
      >
        {STANDARD_LABEL}
      </span>
    </span>
  );
}
