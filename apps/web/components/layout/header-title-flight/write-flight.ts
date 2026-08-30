import type { MotionValue } from "motion/react";
import { FLIGHT_SNAP_REVEAL } from "./constants";
import { easeInOutCubic } from "./math";

export type TitleFlightMotionChannels = {
  titleFlightX: MotionValue<number>;
  titleFlightY: MotionValue<number>;
  titleFlightW: MotionValue<number>;
  titleFlightReady: MotionValue<number>;
};

export function writeFlightFromReveal({
  reveal,
  sourceSelector,
  targetSelector,
  motion,
  enabled = true,
}: {
  reveal: number;
  sourceSelector: string;
  targetSelector: string;
  motion: TitleFlightMotionChannels;
  enabled?: boolean;
}) {
  const { titleFlightX, titleFlightY, titleFlightW, titleFlightReady } = motion;

  if (!enabled) {
    titleFlightReady.set(0);
    return;
  }

  const source = document.querySelector<HTMLElement>(sourceSelector);
  const dest = document.querySelector<HTMLElement>(targetSelector);

  if (!source || !dest) {
    titleFlightReady.set(0);
    return;
  }

  const src = source.getBoundingClientRect();
  const dst = dest.getBoundingClientRect();
  if (src.width <= 0 && dst.width <= 0) {
    titleFlightReady.set(0);
    return;
  }

  const fromW = src.width > 0 ? src.width : dst.width;
  const toW = dst.width > 0 ? dst.width : src.width;
  const t = easeInOutCubic(reveal);
  const ySpan = Math.max(0, src.top - dst.top);

  if (t >= FLIGHT_SNAP_REVEAL || ySpan < 1) {
    titleFlightX.set(dst.left);
    titleFlightY.set(dst.top);
    titleFlightW.set(toW);
    titleFlightReady.set(1);
    return;
  }

  titleFlightX.set(src.left + (dst.left - src.left) * t);
  titleFlightY.set(dst.top + ySpan * (1 - t));
  titleFlightW.set(fromW + (toW - fromW) * t);
  titleFlightReady.set(1);
}
