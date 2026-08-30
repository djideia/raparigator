import {
  IN_PAGE_TITLE_HEIGHT,
  LG_QUERY,
  REVEAL_END_MOBILE_PX,
  REVEAL_SCROLL_FADE_PX,
  REVEAL_START_MOBILE_PX,
  SNAP_EPS,
  SPACER_COLLAPSE_SPAN,
  SPACER_COLLAPSE_START,
} from "./constants";

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function smootherstep(value: number) {
  const x = clamp01(value);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function easeInOutCubic(value: number) {
  const x = clamp01(value);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function dampExp(current: number, target: number, lambda: number, dt: number) {
  const next = target + (current - target) * Math.exp(-lambda * dt);
  return Math.abs(target - next) < SNAP_EPS ? target : next;
}

export function readIsDesktop() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia(LG_QUERY).matches;
}

export function headerOffsetPx() {
  if (typeof window === "undefined") {
    return 80;
  }

  return window.matchMedia("(min-width: 768px)").matches ? 80 : 64;
}

export function progressAcrossBand(edge: number, start: number, end: number) {
  if (start === end) {
    return edge <= end ? 1 : 0;
  }

  return clamp01((start - edge) / (start - end));
}

export function sampleMobileTitleReveal({
  targetTop,
  headerBottom,
  scrollY,
  inPageTitleHeight = IN_PAGE_TITLE_HEIGHT,
}: {
  targetTop: number;
  headerBottom: number;
  scrollY: number;
  inPageTitleHeight?: number;
}) {
  const start = headerBottom + REVEAL_START_MOBILE_PX;
  const end = headerBottom + REVEAL_END_MOBILE_PX;
  const band = smootherstep(progressAcrossBand(targetTop, start, end));
  const scrollFade = smootherstep(scrollY / REVEAL_SCROLL_FADE_PX);
  const reveal = band * scrollFade;
  return {
    reveal,
    spacer: inPageSpacerFromReveal(reveal, inPageTitleHeight),
  };
}

export function inPageSpacerFromReveal(reveal: number, inPageTitleHeight = IN_PAGE_TITLE_HEIGHT) {
  return reveal < SPACER_COLLAPSE_START
    ? inPageTitleHeight
    : inPageTitleHeight * clamp01(1 - (reveal - SPACER_COLLAPSE_START) / SPACER_COLLAPSE_SPAN);
}
