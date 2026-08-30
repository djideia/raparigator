"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { animate, useMotionValue, type PanInfo } from "motion/react";
import {
  clampMobileContactFabY,
  getMobileContactFabDragConstraints,
  getMobileContactFabTooltipSide,
  MOBILE_CONTACT_FAB_DRAG_THRESHOLD,
  MOBILE_CONTACT_FAB_EDGE_INSET,
  MOBILE_CONTACT_FAB_SCROLL_THRESHOLD,
  MOBILE_CONTACT_FAB_SIZE,
  readMobileContactFabSide,
  readMobileContactFabY,
  saveMobileContactFabSide,
  saveMobileContactFabY,
  type MobileContactFabSide,
} from "@/lib/mobile-contact-fab-position";

export function useMobileContactFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);
  const [fabSide, setFabSide] = useState<MobileContactFabSide>("left");
  const [viewport, setViewport] = useState({ width: 390, height: 844 });
  const tooltipSide = getMobileContactFabTooltipSide(fabSide);
  const fabRef = useRef<HTMLDivElement>(null);
  const savedYRef = useRef(0);
  const didInitRef = useRef(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useLayoutEffect(() => {
    if (didInitRef.current) {
      return;
    }
    didInitRef.current = true;

    const side = readMobileContactFabSide();
    const nextY = clampMobileContactFabY(readMobileContactFabY(), window.innerHeight);
    setFabSide(side);
    savedYRef.current = nextY;
    x.set(0);
    y.set(nextY);
    setViewport({ width: window.innerWidth, height: window.innerHeight });
  }, [x, y]);

  useEffect(() => {
    const syncVisibility = () => {
      const nextVisible = window.scrollY > MOBILE_CONTACT_FAB_SCROLL_THRESHOLD;
      if (nextVisible) {
        setHasAppeared(true);
      }
      setIsVisible((prev) => (prev === nextVisible ? prev : nextVisible));
      if (!nextVisible) {
        setIsOpen(false);
      }
    };

    syncVisibility();
    window.addEventListener("scroll", syncVisibility, { passive: true });
    return () => {
      window.removeEventListener("scroll", syncVisibility);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const dragConstraints = useMemo(() => {
    const base = getMobileContactFabDragConstraints(viewport.width, viewport.height);
    if (fabSide === "right") {
      return {
        top: base.top,
        bottom: base.bottom,
        left: -base.right,
        right: 0,
      };
    }
    return base;
  }, [fabSide, viewport.height, viewport.width]);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    if (showTooltip) {
      setShowTooltip(false);
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!fabRef.current) {
      return;
    }

    const dragDistance = Math.hypot(info.offset.x, info.offset.y);
    const targetY = clampMobileContactFabY(y.get(), window.innerHeight);

    if (dragDistance < MOBILE_CONTACT_FAB_DRAG_THRESHOLD) {
      animate(x, 0, { type: "spring", bounce: 0.2, duration: 0.35 });
      y.set(savedYRef.current);
      return;
    }

    const fabRect = fabRef.current.getBoundingClientRect();
    const fabCenter = fabRect.left + fabRect.width / 2;
    const nextSide: MobileContactFabSide = fabCenter > window.innerWidth / 2 ? "right" : "left";
    const maxHorizontal = Math.max(
      0,
      window.innerWidth - MOBILE_CONTACT_FAB_SIZE - MOBILE_CONTACT_FAB_EDGE_INSET * 2,
    );
    const preserveX =
      nextSide === "left"
        ? Math.min(maxHorizontal, Math.max(0, fabRect.left - MOBILE_CONTACT_FAB_EDGE_INSET))
        : -Math.min(
            maxHorizontal,
            Math.max(0, window.innerWidth - MOBILE_CONTACT_FAB_EDGE_INSET - fabRect.right),
          );

    flushSync(() => {
      setFabSide(nextSide);
    });
    x.set(preserveX);
    y.set(targetY);

    saveMobileContactFabSide(nextSide);
    savedYRef.current = targetY;
    saveMobileContactFabY(targetY);

    animate(x, 0, { type: "spring", bounce: 0.2, duration: 0.5 });
    animate(y, targetY, { type: "spring", bounce: 0.2, duration: 0.5 });
  };

  return {
    isOpen,
    showTooltip,
    isVisible,
    hasAppeared,
    fabSide,
    tooltipSide,
    fabRef,
    x,
    y,
    dragConstraints,
    toggleOpen,
    handleDragEnd,
  };
}
