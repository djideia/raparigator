"use client";

import { createPortal } from "react-dom";
import { motion, useTransform, type MotionValue } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";

function subscribeNoop() {
  return () => {};
}

function getClientMounted() {
  return true;
}

function getServerMounted() {
  return false;
}

type MobileTitleFlightPortalProps = {
  active: boolean;
  titleFlightX: MotionValue<number>;
  titleFlightY: MotionValue<number>;
  titleFlightW: MotionValue<number>;
  titleFlightReady: MotionValue<number>;
  children: ReactNode;
};

export function MobileTitleFlightPortal({
  active,
  titleFlightX,
  titleFlightY,
  titleFlightW,
  titleFlightReady,
  children,
}: MobileTitleFlightPortalProps) {
  const mounted = useSyncExternalStore(subscribeNoop, getClientMounted, getServerMounted);
  const opacity = useTransform(titleFlightReady, (value) => (value > 0.5 ? 1 : 0));
  const width = useTransform(titleFlightW, (value) => Math.max(0, value));

  if (!mounted || !active) {
    return null;
  }

  return createPortal(
    <motion.div
      aria-hidden
      style={{
        x: titleFlightX,
        y: titleFlightY,
        width,
        opacity,
      }}
      className="pointer-events-none fixed top-0 left-0 z-40 overflow-hidden will-change-transform backface-hidden"
    >
      {children}
    </motion.div>,
    document.body,
  );
}
